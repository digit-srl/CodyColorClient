/*
 * Controller partita con avversario custom
 */
angular.module('codyColor').controller('customMmakingCtrl', ['$scope', 'rabbit', 'navigationHandler', '$translate',
    'translationHandler', 'authHandler', 'audioHandler', '$location', 'sessionHandler', 'gameData', 'scopeService',
    'chatHandler', 'settings', 'visibilityHandler', 'shareHandler',
    function ($scope, rabbit, navigationHandler, $translate, translationHandler, authHandler,
              audioHandler, $location, sessionHandler, gameData, scopeService,
              chatHandler, settings, visibilityHandler, shareHandler) {

        gameData.getGeneral().gameType = gameData.getGameTypes().custom;


        let quitGame = function() {
            rabbit.quitGame();
            gameData.initializeGameData();
            chatHandler.clearChat();
        };

        // inizializzazione sessione
        navigationHandler.initializeBackBlock($scope);
        if (sessionHandler.isSessionInvalid()) {
            quitGame();
            navigationHandler.goToPage($location, '/');
            return;
        }

        visibilityHandler.setDeadlineCallback(function() {
            rabbit.sendPlayerQuitRequest();
            quitGame();
            scopeService.safeApply($scope, function () {
                translationHandler.setTranslation($scope, 'forceExitText', 'FORCE_EXIT');
                $scope.forceExitModal = true;
            });
        });

        $scope.userLogged = authHandler.loginCompleted();
        if (authHandler.loginCompleted()) {
            $scope.userNickname = authHandler.getServerUserData().nickname;
            $scope.nickname = authHandler.getServerUserData().nickname;
        } else {
            translationHandler.setTranslation($scope, 'userNickname', 'NOT_LOGGED');
        }
        authHandler.setCookieNickCallback(function () {
            scopeService.safeApply($scope, function () {
                $scope.userLogged = authHandler.loginCompleted();
                if (authHandler.loginCompleted()) {
                    $scope.userNickname = authHandler.getServerUserData().nickname;
                    $scope.nickname = authHandler.getServerUserData().nickname;
                } else {
                    translationHandler.setTranslation($scope, 'userNickname', 'NOT_LOGGED');
                }
            });
        });

        // cambia schermata in modo 'sicuro', evitando flickering durante le animazioni
        let changeScreen = function(newScreen) {
            scopeService.safeApply($scope, function () {
                $scope.mmakingState = screens.loadingScreen;
            });
            setTimeout(function () {
                scopeService.safeApply($scope, function () {
                    $scope.mmakingState = newScreen;
                });
            }, 200);
        };

        const screens = {
            loadingScreen:     'loadingScreen',     // schermata di transizione
            joinMatch:         'joinMatch',         // schermata iniziale, opzioni ins. code e newMatch
            nicknameSelection: 'nicknameSelection', // inserimento nickname
            waitingEnemy:      'waitingEnemy',      // entrato nella gameRoom, mostra codici e attende un avvers.
            waitingReady:      'waitingReady',       // ready clicked, spettando il segnale di ready dell'avversario
        };
        $scope.screens = screens;

        changeScreen(screens.joinMatch);

        $scope.general = gameData.getGeneral();
        $scope.user = gameData.getUser();
        $scope.enemy = gameData.getEnemy();
        $scope.baseUrl = settings.webBaseUrl;
        $scope.matchUrl = settings.webBaseUrl;
        $scope.enemyReady = false;

        // tenta la connessione, se necessario
        $scope.connected = rabbit.getBrokerConnectionState();
        let requiredDelayedGameRequest = false;
        if (!$scope.connected) {
            rabbit.connect();
            requiredDelayedGameRequest = true;
        } else {
            // connessione già pronta: richiedi i dati della battle al server
            if (gameData.getGeneral().code !== '0000' || gameData.getUser().organizer) {
                rabbit.sendGameRequest();
                translationHandler.setTranslation($scope, 'joinMessage', 'SEARCH_MATCH_INFO');
            }
        }

        rabbit.setPageCallbacks({
            onConnected: function () {
                scopeService.safeApply($scope, function () {
                    if (requiredDelayedGameRequest) {
                        if (gameData.getGeneral().code !== '0000' || gameData.getUser().organizer) {
                            rabbit.sendGameRequest();
                            translationHandler.setTranslation($scope, 'joinMessage', 'SEARCH_MATCH_INFO');
                        }
                        requiredDelayedGameRequest = false;
                    }
                });

            }, onGeneralInfoMessage: function() {
                scopeService.safeApply($scope, function () {
                    if (!sessionHandler.isClientVersionValid()) {
                        quitGame();
                        translationHandler.setTranslation($scope, 'forceExitText', 'OUTDATED_VERSION_DESC');
                        $scope.forceExitModal = true;
                    }
                });

            }, onGameRequestResponse: function (message) {
                scopeService.safeApply($scope, function () {
                    if (message.code.toString() === '0000') {
                        $scope.mmakingRequested = false;
                        translationHandler.setTranslation($scope, 'joinMessage', 'CODE_NOT_VALID');
                        gameData.editGeneral({code: '0000'});

                    } else {
                        gameData.editGeneral(message.general);
                        gameData.editUser(message.user);
                        gameData.editEnemy(message.enemy);
                        $scope.matchUrl = settings.webBaseUrl + '/#!?custom=' + message.general.code;

                        rabbit.subscribeGameRoom();

                        // testo che mostra la durata di ogni match
                        let formattedTranslateCode = gameData.formatTimeStatic(gameData.getGeneral().timerSetting);
                        translationHandler.setTranslation($scope, 'totTime', formattedTranslateCode);

                        if (gameData.getUser().validated) {
                            changeScreen(screens.waitingEnemy);
                        } else {
                            changeScreen(screens.nicknameSelection);
                        }
                    }
                });

            }, onPlayerAdded: function(message) {
                scopeService.safeApply($scope, function () {
                    if (message.addedPlayerId === gameData.getUser().playerId) {
                        if (gameData.getUser().validated === false) {
                            changeScreen(screens.enemyFound);
                        }

                        gameData.editUser(message.addedPlayer);

                    } else {
                        audioHandler.playSound('enemy-found');
                        gameData.editEnemy(message.addedPlayer);
                        changeScreen(screens.enemyFound);
                    }
                });

            }, onReadyMessage: function () {
                scopeService.safeApply($scope, function () {
                    $scope.enemyReady = true;
                })

            }, onStartMatch: function (message) {
                scopeService.safeApply($scope, function () {
                    gameData.editMatch({ tiles: gameData.formatMatchTiles(message.tiles) });
                    navigationHandler.goToPage($location, '/arcade-match');
                });

            }, onGameQuit: function () {
                scopeService.safeApply($scope, function () {
                    quitGame();
                    translationHandler.setTranslation($scope,'forceExitText', 'ENEMY_LEFT');
                    $scope.forceExitModal = true;
                });

            }, onConnectionLost: function () {
                scopeService.safeApply($scope, function () {
                    quitGame();
                    translationHandler.setTranslation($scope, 'forceExitText', 'FORCE_EXIT');
                    $scope.forceExitModal = true;
                });

            }, onChatMessage: function (message) {
                scopeService.safeApply($scope, function () {
                    audioHandler.playSound('roby-over');
                    chatHandler.enqueueChatMessage(message);
                    $scope.chatBubbles = chatHandler.getChatMessages();
                });
            }
        });

        // chat
        $scope.chatVisible = false;
        $scope.chatBubbles = chatHandler.getChatMessages();
        $scope.getBubbleStyle = function(chatMessage) {
            if (chatMessage.playerId === gameData.getUser().playerId)
                return 'chat--bubble-player';
            else
                return 'chat--bubble-enemy';
        };
        $scope.chatHints = chatHandler.getChatHintsPreMatch();
        $scope.sendChatMessage = function(messageBody) {
            audioHandler.playSound('menu-click');
            let chatMessage = rabbit.sendChatMessage(messageBody);
            chatHandler.enqueueChatMessage(chatMessage);
            $scope.chatBubbles = chatHandler.getChatMessages();
        };

        // click per schermata newmatch
        $scope.goToCreateMatch = function() {
            audioHandler.playSound('menu-click');
            navigationHandler.goToPage($location, "/custom-new-match");
        };

        // click su 'unisciti', invio code
        $scope.joinGame = function(codeValue) {
            $scope.mmakingRequested = true;
            audioHandler.playSound('menu-click');
            $translate('SEARCH_MATCH_INFO').then(function (text) {
                $scope.joinMessage = text;
            }, function (translationId) {
                $scope.joinMessage = translationId;
            });
            gameData.editGeneral({ code: codeValue });
            rabbit.sendGameRequest();
        };

        // click su 'iniziamo' dall'inserimento nickname
        $scope.readyClicked = false;
        $scope.playerReady = function() {
            $scope.readyClicked = true;
            rabbit.sendReadyMessage();

            if (!$scope.enemyReady)
                changeScreen(screens.waitingReady);
        };

        $scope.validPlayer = function() {
            $scope.playerValidated = true;
            gameData.editUser({ nickname: $scope.nickname });
            rabbit.sendValidationMessage();
            sessionHandler.enableNoSleep();
            audioHandler.splashStartBase();
        };

        $scope.linkCopied = false;
        $scope.codeCopied = false;
        $scope.copyLink = function () {
            audioHandler.playSound('menu-click');
            shareHandler.copyTextToClipboard($scope.matchUrl);
            $scope.linkCopied = true;
            $scope.codeCopied = false;
        };

        $scope.copyCode = function () {
            audioHandler.playSound('menu-click');
            shareHandler.copyTextToClipboard(gameData.getGeneral().code);
            $scope.linkCopied = false;
            $scope.codeCopied = true;
        };

        // termina la partita alla pressione sul tasto corrispondente
        $scope.exitGameModal = false;
        $scope.exitGame = function () {
            audioHandler.playSound('menu-click');
            $scope.exitGameModal = true;
        };
        $scope.continueExitGame = function() {
            audioHandler.playSound('menu-click');
            rabbit.sendPlayerQuitRequest();
            quitGame();
            navigationHandler.goToPage($location, '/home');
        };
        $scope.stopExitGame = function() {
            audioHandler.playSound('menu-click');
            $scope.exitGameModal = false;
        };

        $scope.forceExitModal = false;
        $scope.forceExitText = '';
        $scope.continueForceExit = function() {
            audioHandler.playSound('menu-click');
            quitGame();
            navigationHandler.goToPage($location, '/home');
        };

        // impostazioni multi language
        $scope.openLanguageModal = function() {
            $scope.languageModal = true;
            audioHandler.playSound('menu-click');
        };
        $scope.closeLanguageModal = function() {
            $scope.languageModal = false;
            audioHandler.playSound('menu-click');
        };
        $scope.changeLanguage = function(langKey) {
            $translate.use(langKey);
            $scope.languageModal = false;
            audioHandler.playSound('menu-click');

            if (!authHandler.loginCompleted()) {
                translationHandler.setTranslation($scope, 'userNickname', 'NOT_LOGGED');
            }
        };

        // impostazioni audio
        $scope.basePlaying = audioHandler.isAudioEnabled();
        $scope.toggleBase = function () {
            audioHandler.toggleBase();
            $scope.basePlaying = audioHandler.isAudioEnabled();
        };
    }
]);
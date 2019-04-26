/*
 * Controller responsabile della schermata partita
 */

angular.module('codyColor').controller('matchCtrl',
    function ($scope, rabbit, gameData, scopeService, robyAnimator, $location,
              navigationHandler, audioHandler, sessionHandler) {
        console.log("Controller match ready.");

        let enemyMatchTimer;
        let playerMatchTimer;
        let startCountdownTimer;

        // inizializzazione sessione
        navigationHandler.initializeBackBlock($scope);
        if (sessionHandler.isSessionInvalid()) {
            if (enemyMatchTimer !== undefined)
                clearInterval(enemyMatchTimer);

            if (playerMatchTimer !== undefined)
                clearInterval(playerMatchTimer);

            if (startCountdownTimer !== undefined)
                clearInterval(startCountdownTimer);

            rabbit.quitGame();
            robyAnimator.quitGame();
            navigationHandler.goToPage($location, $scope, '/');
            gameData.clearGameData();
            return;
        }

        // inizializzazione componenti generali interfaccia
        $scope.playerPoints = gameData.getPlayerPoints();
        $scope.enemyPoints  = gameData.getEnemyPoints();
        $scope.playerNickname = gameData.getPlayerNickname();
        $scope.enemyNickname  = gameData.getEnemyNickname();

        // inizializzazione riferimenti agli elementi della griglia
        $scope.playerRobyImage = 'roby-positioned';
        $scope.enemyRobyImage  = 'enemy-positioned';
        robyAnimator.initializeElements(function (image) {
            scopeService.safeApply($scope, function () { $scope.playerRobyImage = image; });
        }, function (image) {
            scopeService.safeApply($scope, function () { $scope.enemyRobyImage = image; });
        });


        let setArrowCss = function(side, distance, over) {
            let finalResult = '';

            let arrowSide = '';
            switch(side) {
                case 0:
                    arrowSide = 'down';
                    break;
                case 1:
                    arrowSide = 'left';
                    break;
                case 2:
                    arrowSide = 'up';
                    break;
                case 3:
                    arrowSide = 'right';
                    break;
            }

            if (over) {
                finalResult += 'fas fa-chevron-circle-' + arrowSide + ' arrow-cell-over';
            } else {
                finalResult += 'fas fa-angle-' + arrowSide + ' arrow-cell';
            }

            if ($scope.showArrows) {
                finalResult += ' floating-' + arrowSide + '-component';
            }

            $scope.startPositionsCss[side][distance] = finalResult;
        };

        let calculateAllStartPositionCss = function(over) {
            for (let side = 0; side < 4; side++) {
                $scope.startPositionsCss[side] = new Array(5);
                for (let distance = 0; distance < 5; distance++) {
                   setArrowCss(side, distance, over);
                }
            }
        };

        // utilizzato nell'animazione delle arrow nelle posizioni di partenza,
        // nel momento in cui roby viene trascinato sopra la posizione
        $scope.startPositionsCss = new Array(4);
        calculateAllStartPositionCss(false);


        // inizializzazione timers
        let playerMatchTimerValue = 30000;
        $scope.playerMatchTimerText = '30:00';

        let enemyMatchTimerValue = 30000;
        $scope.enemyMatchTimerText = '30:00';


        let startCountdownValue = 3;
        $scope.startCountdownText = startCountdownValue.toString();
        $scope.countdownInProgress = true;
        startCountdownTimer = setInterval(function () {
            startCountdownValue--;
            if (startCountdownValue > 0) {
                scopeService.safeApply($scope, function () {
                    $scope.startCountdownText = startCountdownValue.toString();
                });

            } else if (startCountdownValue === 0) {
                scopeService.safeApply($scope, function () {
                    $scope.startCountdownText = "Let's Cody!";
                });

            } else {
                // interrompi countdown e mostra schermata di gioco
                clearInterval(startCountdownTimer);
                startCountdownTimer = undefined;

                scopeService.safeApply($scope, function () {
                    $scope.countdownInProgress = false;
                });

                startMatchTimers();
            }
        }, 1000);

        // avvia i timer per visualizzare tempo rimanente di giocatore e avversario
        let startMatchTimers = function() {
            // avvia timer partita giocatore
            playerMatchTimer = setInterval(function () {
                playerMatchTimerValue -= 10;

                if (playerMatchTimerValue > 0) {
                    scopeService.safeApply($scope, function () {
                        $scope.playerMatchTimerText = gameData.formatTimerText(playerMatchTimerValue);
                    });

                } else {
                    clearInterval(playerMatchTimer);
                    playerMatchTimer = undefined;

                    scopeService.safeApply($scope, function () {
                        $scope.showCompleteGrid = true;
                        $scope.showArrows = false;
                        $scope.playerPositioned = true;
                        $scope.playerMatchTimerText = gameData.formatTimerText(0);
                        calculateAllStartPositionCss(false);
                    });

                    gameData.setPlayerMatchTime(0);
                    if ($scope.enemyPositioned && $scope.playerPositioned) {
                        endMatch();
                    }
                }
            }, 10);

            // avvia timer partita avversario
            enemyMatchTimer = setInterval(function () {
                enemyMatchTimerValue -= 10;

                if (enemyMatchTimerValue > 0) {
                    scopeService.safeApply($scope, function () {
                        $scope.enemyMatchTimerText = gameData.formatTimerText(enemyMatchTimerValue);
                    });

                } else {
                    clearInterval(enemyMatchTimer);
                    enemyMatchTimer = undefined;

                    scopeService.safeApply($scope, function () {
                        $scope.enemyPositioned = true;
                        $scope.enemyMatchTimerText = gameData.formatTimerText(0);
                    });

                    gameData.setEnemyMatchTime(0);
                    if ($scope.enemyPositioned && $scope.playerPositioned) {
                        endMatch();
                    }
                }
            }, 10);
        };

        // associa il colore ad ogni tile, a seconda di quanto memorizzato in gameData
        $scope.getTileStyle = function (x, y) {
            switch (gameData.getCurrentMatchTiles()[x][y]) {
                case 'Y':
                    return 'yellow-play-tile';
                case 'R':
                    return 'red-play-tile';
                case 'G':
                    return 'gray-play-tile';
            }
        };

        // inizializzazione draggable roby
        $scope.playerPositioned = false;
        $scope.enemyPositioned  = false;
        $scope.showCompleteGrid = false;
        $scope.showArrows = false;
        $scope.endMatch = false;
        $scope.draggableRobyImage = 'roby-idle';

        // quando roby viene trascinato, viene mostrata la griglia completa (con le posizioni di partenza), e
        // modificata l'immagine di roby
        $scope.startDragging = function () {
            console.log("Start dragging");
            scopeService.safeApply($scope, function () {
                $scope.playerPositioned = false;
                $scope.showCompleteGrid = true;
                $scope.draggableRobyImage = 'roby-dragging-trasp';
                $scope.showArrows = true;
                calculateAllStartPositionCss(false);
            });
        };

        // invocato quando roby viene posizionato, ma non rilasciato, sopra una posizione di partenza valida
        $scope.robyOver = function (event, ui, side, distance) {
           scopeService.safeApply($scope, function () {
                setArrowCss(side, distance, true);
            });
        };

        // invocato quando roby viene spostato da una posizione di partenza valida
        $scope.robyOut = function (event, ui, side, distance) {
            scopeService.safeApply($scope, function () {
                setArrowCss(side, distance, false);
            });
        };

        // quando roby viene rilasciato, ritorna nella posizione iniziale...
        $scope.endDragging = function () {
            console.log("End dragging");
            if (!$scope.endMatch) {
                scopeService.safeApply($scope, function () {
                    $scope.showArrows = false;
                    $scope.playerPositioned = false;
                    $scope.showCompleteGrid = false;
                    $scope.draggableRobyImage = 'roby-idle';
                    calculateAllStartPositionCss(false);
                });
            }
        };

        //...a meno che, non venga rilasciato in una posizione valida. In quel caso, viene utilizzata un secondo tag
        // img, per mostrare roby nella sua posizione di partenza. Viene inoltre fermato il timer, e notificato
        // l'avversario dell'avvenuta presa di posizione
        $scope.robyDropped = function (event, ui, side, distance) {
            console.log("Roby dropped");
            if (!$scope.endMatch) {
                gameData.setPlayerStartPosition({'side': side, 'distance': distance});
                gameData.setPlayerMatchTime(playerMatchTimerValue);

                clearInterval(playerMatchTimer);
                rabbit.sendPlayerPositionedMessage();

                // l'esecuzione avviene subito dopo endDragging(), e va quindi gestito in modo sicuro l'$apply
                scopeService.safeApply($scope, function () {
                    $scope.playerPositioned = true;
                    $scope.showCompleteGrid = true;
                });

                robyAnimator.positionRoby('player');

                if ($scope.enemyPositioned && $scope.playerPositioned) {
                    endMatch();
                }
            }
        };

        // callback passati alla classe responsabile della comunicazione con il broker.
        // Invocati all'arrivo di nuovi messaggi
        rabbit.setMatchCallbacks(function (response) {
            // onEnemyPositionedMessage
            gameData.setEnemyStartPosition({ side: response.side, distance: response.distance });
            gameData.setEnemyMatchTime(response.matchTime);

            clearInterval(enemyMatchTimer);
            enemyMatchTimer = undefined;
            scopeService.safeApply($scope, function () {
                $scope.enemyPositioned = true;
                $scope.enemyMatchTimerText = gameData.formatTimerText(response.matchTime);
            });

            if ($scope.enemyPositioned && $scope.playerPositioned) {
                endMatch();
            }
        }, function () {
            // onQuitGameMessage
            let errorMessageValue = "L'avversario ha abbandonato la partita.";
            quitGame({ notFromClick: true, errorMessage: errorMessageValue });

        }, function () {
            // onConnectionLost
            let errorMessageValue = "Si è verificato un errore nella connessione con il server. Partita terminata.";
            quitGame({ notFromClick: true, errorMessage: errorMessageValue });

        }, function () {
            // onSkipMessage
            gameData.setEnemyWantSkip(true);

            if (gameData.getPlayerWantSkip() && gameData.getEnemyWantSkip()) {
                robyAnimator.quitGame();
                navigationHandler.goToPage($location, $scope, '/aftermatch', true);
            }
        });

        // cosa fare una volta terminata senza intoppi la partita; mostra la schermata aftermatch
        let endMatch = function () {
            scopeService.safeApply($scope, function () {
                $scope.endMatch = true;
            });

            robyAnimator.positionRoby('player');
            robyAnimator.positionRoby('enemy');

            let results = robyAnimator.calculateResults();
            gameData.setCurrentMatchResult(results);
            gameData.addPlayerPoints(results.playerResult.points);
            gameData.addEnemyPoints(results.enemyResult.points);

            robyAnimator.animateAndFinish(function () {
                robyAnimator.quitGame();
                navigationHandler.goToPage($location, $scope, '/aftermatch', true);
            });
        };

        // termina la partita alla pressione sul tasto corrispondente
        $scope.exitGame = function () {
            if (confirm("Sei sicuro di voler abbandonare la partita?")) {
                quitGame({ notFromClick: false });
            }
        };

        $scope.askedForSkip = false;
        $scope.skip = function() {
          rabbit.sendSkipMessage();
          gameData.setPlayerWantSkip(true);
          $scope.askedForSkip = true;

          if (gameData.getPlayerWantSkip() && gameData.getEnemyWantSkip()) {
              robyAnimator.quitGame();
              navigationHandler.goToPage($location, $scope, '/aftermatch');
          }

        };

        // metodo per terminare la partita in modo sicuro, disattivando i timer, interrompendo animazioni e connessioni
        // con il server, tornando alla home, e mostrando eventualmente un messaggio di errore
        let quitGame = function (arguments) {
            if (enemyMatchTimer !== undefined)
                clearInterval(enemyMatchTimer);

            if (playerMatchTimer !== undefined)
                clearInterval(playerMatchTimer);

            if (startCountdownTimer !== undefined)
                clearInterval(startCountdownTimer);

            rabbit.quitGame();
            robyAnimator.quitGame();

            if (arguments.notFromClick === undefined) {
                arguments.notFromClick = true;
            }

            if(arguments.isSessionInvalid !== undefined && arguments.isSessionInvalid === true) {
                navigationHandler.goToPage($location, $scope, '/');
            } else {
                navigationHandler.goToPage($location, $scope, '/home', arguments.notFromClick);
            }
            gameData.clearGameData();

            if (arguments.errorMessage !== undefined)
                alert(arguments.errorMessage);
        };

        // impostazioni audio
        $scope.basePlaying = audioHandler.getBaseState();
        $scope.toggleBase = function () {
            audioHandler.toggleBase();
            $scope.basePlaying = audioHandler.getBaseState();
        };
    });

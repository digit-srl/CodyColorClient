/*
 * Controller Splash Screen, la schermata mostrata non appena si accede al sito
 */
angular.module('codyColor').controller('splashCtrl',
    function ($scope, rabbit, navigationHandler, audioHandler,
              $location, sessionHandler, $routeParams, gameData) {
        console.log("Controller splash ready.");

        // validazione sessione
        navigationHandler.initializeBackBlock($scope);
        sessionHandler.validateSession();

        // tenta subito la connessione al broker
        rabbit.connect();

        let customMatch = $routeParams.custom;
        if (customMatch !== undefined && customMatch.length > 0) {
            gameData.getGeneral().code = customMatch.toString();
            console.log("Custom match!");
            navigationHandler.goToPage($location, $scope, '/custom-mmaking');
        }

        let agaMatch = $routeParams.royale;
        if (agaMatch !== undefined && agaMatch.length > 0) {
            gameData.getGeneral().code = agaMatch.toString();
            console.log("Aga match!");
            navigationHandler.goToPage($location, $scope, '/royale-mmaking');
        }

        $scope.clientVersion = sessionHandler.getClientVersion();

        // vai alla schermata home al click e avvia la base musicale
        $scope.goToHome = function () {
            navigationHandler.goToPage($location, $scope, '/home');
            audioHandler.splashStartBase();
        }
    }
);

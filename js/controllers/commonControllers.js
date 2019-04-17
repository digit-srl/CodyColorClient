/*
 * Controllers: codice responsabile del binding e del collegamento al model delle varie schermate
 */

var app = angular.module('codyColor');


/* 
 * Controller Splash Screen, la schermata mostrata non appena si accede al sito
 */
app.controller('splashCtrl', function($scope, rabbit) {
	console.log("Controller splash ready.");
	rabbit.connect();

});


/* 
 * Controller Home, il menù principale
 */
app.controller('homeCtrl', function($scope, rabbit) {
	console.log("Controller home ready.");

	// perché lo scope? ***È UN SORPRENDENTE STRUMENTO CHE CI SERVIRA' DOPO***
	$scope.connected = rabbit.getConnectionState();
	if(!$scope.connected)
		rabbit.connect();
});


/* 
 * Controller Empty, gestisce le schermate che non necessitano di funzioni specifiche.
 */
app.controller('emptyCtrl', function($scope, rabbit) {
	console.log("Empty controller ready.");
	
	$scope.connected = rabbit.getConnectionState();
	if(!$scope.connected)
		rabbit.connect();
});


// controller partita con avversario casuale
app.controller('pmmakingCtrl', function (/* $scope, $location, $http */) {
	console.log("Controller custom matchmaking ready.");
});

// controller partita con avversario casuale
app.controller('aftermatchCtrl', function (/* $scope, $location, $http */) {
	console.log("Controller aftermatch ready.");
});


// controller componenti di login e registrazione
app.controller('loginCtrl', function (/* $scope, $location, $http */) {
	console.log("Controller login-registration ready.");
});

// controller componente classifica
app.controller('rankingCtrl', function (/* $scope, $location, $http */) {
	console.log("Controller ranking ready.");
});

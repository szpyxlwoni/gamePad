(function(){
    var boardGame = angular.module('boardGame', ['ui.bootstrap', 'ui.router', 'ngMessages', 'ui.validate']);

    boardGame.constant('webUrl', '/html');
    boardGame.constant('serverUrl', '');

	boardGame.config(function($stateProvider, $urlRouterProvider, webUrl, serverUrl, jaipurConfig, accountConfig){
		$urlRouterProvider.otherwise("/index");

		jaipurConfig($stateProvider, webUrl, serverUrl);
		accountConfig($stateProvider, webUrl, serverUrl);
	});

	boardGame.controller('ToastCtrl', function (toastMessage, $scope, $timeout, $uibModalInstance) {
		$scope.toastMessage = toastMessage;
		$timeout(function () {
			$uibModalInstance.close();
		}, 1500);
	});
})();

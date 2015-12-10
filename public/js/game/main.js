(function() {
	angular.module('boardGame').constant("gameConfig", function($stateProvider, webUrl, serverUrl) {
		$stateProvider.state('games', {
            url : '/games',
			views :{
			    'content': {
				    templateUrl : webUrl + '/game-list.html',
					controller : function($scope, $http, $state, $window, $stateParams) {
						$scope.games = [];
						var _ = $window._;
						var gameBoxUrl = "../img/gameBox/";

						$scope.goToGame = function (game) {
							$state.go('rooms', {domain:game.domain});
						}

						$http({
							url : serverUrl + '/games',
							method : 'GET'
						}).success(function (data) {
							_.map(data, function (v) {
								v.headPicture = gameBoxUrl + v.picture;
							});
							$scope.games = data;
						});
					}
				}
			}
		});
		$stateProvider.state('rooms', {
            url : '/rooms/{domain}',
			views :{
			    'content': {
				    templateUrl : webUrl + '/room-list.html',
					controller : function($scope, $http, $state, $window, $stateParams) {
						$scope.rooms = [];
						var _ = $window._;

						$scope.goToRoom = function (room) {
							$state.go($stateParams.domain, {roomId:room.id});
						}

						$http({
							url : serverUrl + '/rooms/jaipur',
							method : 'GET'
						}).success(function (data) {
							$scope.rooms = data;
						});
					}
				}
			}
		});
	});
})()

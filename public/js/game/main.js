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
					controller : function($scope, $http, $state, $cookies, $window, $uibModal, $stateParams) {
						$scope.rooms = [];
						var _ = $window._;

						$scope.goToRoom = function (room) {
							if (!$cookies.get('gamer_token')) {
								$scope.toast('请登录');
								$state.go('login');
								return;
							}
							$state.go('room', {'domain':$stateParams.domain,roomId:room.id});
						}

						$scope.quickJoin = function () {
							if (!$cookies.get('gamer_token')) {
								$scope.toast('请登录');
								$state.go('login');
								return;
							}
						    $state.go('room', {'domain':$stateParams.domain,roomId:0});	
						}

						$scope.createRoom = function () {
							if (!$cookies.get('gamer_token')) {
								$scope.toast('请登录');
								$state.go('login');
								return;
							}
						    $state.go('room', {'domain':$stateParams.domain});	
						}

						$scope.toast = function (message) {
							$uibModal.open({
								animation: true,
                                templateUrl: 'toast.html',
                                controller: 'ToastCtrl',
                                resolve: {
                                	'toastMessage' : function () {
                                		return message;
                                	}
                                }
							});
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
		$stateProvider.state('room', {
            url : '/room/{domain}/{roomId}',
			views :{
			    'content': {
				    templateUrl : webUrl + '/room-one.html',
					controller : function($scope, $http, $state, $cookies, $location, $window, $stateParams) {
						$scope.room = {};
						var _ = $window._;
						var token = $cookies.get('gamer_token');

						ws = io.connect('http://localhost:9000/jaipurServer?roomId=' + $stateParams.roomId + '&token=' + token);

						ws.on('connect', function () {
							ws.emit('join');
						});

						ws.on('return.state', function (data){
							$location.path('/room/' + $stateParams.domain + '/' + data.id);
	                    	$scope.room = data;
	                    	$scope.player = data.players[token];
	                    	$scope.$apply();
	                    	console.log(data);
	                    	if (data.sceneType === 'gaming') {
	                    		$state.go($stateParams.domain, {roomId:data.id});
	                    	}
	                    });

	                    $scope.isHost = function () {
	                    	return token === $scope.room.host;
	                    }

	                    $scope.gameStart = function () {
	                    	ws.emit('start');
	                    }

	                    $scope.ready = function () {
	                    	ws.emit('ready');
	                    }

	                    $scope.exit = function () {
	                    	$state.go('rooms', {'domain':$stateParams.domain});
	                    }
					}
				}
			}
		});
	});
})()

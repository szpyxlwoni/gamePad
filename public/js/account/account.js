(function() {
	angular.module('boardGame').constant("accountConfig", function($stateProvider, webUrl, serverUrl) {
		$stateProvider.state('register', {
            url : '/register',
			views :{
			    'content': {
				    templateUrl : webUrl + '/account/register.html',
					controller : function($scope, $http, $window, $stateParams) {
						$scope.user = {
						};

					    $scope.register = function () {
						    if (!$scope.user.username || !$scope.user.password) {
							    return;
							}
					    	$http({
					    		url : serverUrl + '/register',
					    		method : 'POST',
					    		data : $scope.user
					    	}).success(function (data) {
								console.log(data);
					    	});
					    }
					}
				}
			}
		});
		$stateProvider.state('login', {
            url : '/login',
			views :{
			    'content': {
				    templateUrl : webUrl + '/account/login.html',
					controller : function($scope, $http, $window, $stateParams) {
						$scope.user = {
						};

					    $scope.login = function () {
						    if (!$scope.user.username || !$scope.user.password) {
							    return;
							}
					    	$http({
					    		url : serverUrl + '/login',
					    		method : 'POST',
					    		data : $scope.user
					    	}).success(function (data) {
								console.log(data);
					    	});
					    }
					}
				}
			}
		});
	});
})()

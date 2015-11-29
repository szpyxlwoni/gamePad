(function(){
    var jaipur = angular.module('jaipur', ['ui.bootstrap']);

	jaipur.controller('JaipurCtrl', ['$scope', '$window', '$uibModal', function($scope, $window, $uibModal){
	    var ws = io.connect('http://localhost:3000');
		var _ = $window._;
		var renderer;
	    var oneTexture, twoTexture, threeTexture, fourTexture, fiveTexture, sixTexture, sevenTexture, backTexture, charTexture, backgroundTexture;
		var diamond7, diamond5, gold6, gold5, silver5, leather5, leather3, leather2, leather1, spice5, spice3, spice2, spice1, cloth4, cloth3, cloth2, cloth1, camelTexture, threeSTexture, fourSTexture, fiveSTexture;
	    var cameraOrtho, sceneOrtho;
	    var objects = [];
	    var wWidth = $('.game-content').width();
		var wHeight = $('.game-content').height();
		var signSize = 48;
		var signPos = 250;
		var cardWidth = 80;
		var cardHeight = 130;

		$scope.init = function() {
		    loadAllTexture();
			$scope.player = {};
			$scope.sceneType = 'preparing';
			$scope.isOverCard = false;

			cameraOrtho = new THREE.OrthographicCamera(-wWidth / 2, wWidth / 2, wHeight / 2, - wHeight / 2, 1, 10 );
			cameraOrtho.position.z = 10;
			sceneOrtho = new THREE.Scene();
			sceneGamePad = new THREE.Scene();

		    renderer = new THREE.WebGLRenderer({ alpha: true });
		    renderer.setSize(wWidth, wHeight);
		    renderer.autoClear = false;

		    $('.game-content').append(renderer.domElement);

	        ws.on('connect', function () {
	            ws.emit('login');
	        });

			$('.ready-one').css('top', wHeight / 4);
			$('.ready-one').css('left', wWidth / 2 + 100);
			$('.ready-one').html('等待玩家');
			$('.ready-two').css('top', wHeight * 3 / 4);
			$('.ready-two').css('left', wWidth / 2 + 100);
			$('.ready-two').html('等待玩家');
			$('.this-one').css('top', wHeight / 4);
			$('.this-one').css('left', wWidth / 2 - 200);
			$('.this-two').css('top', wHeight * 3 / 4);
			$('.this-two').css('left', wWidth / 2 - 200);

			addListener();
		}

		ws.on('return.state', function (data){
			$scope.sceneType = data.sceneType;
			$scope.signs = data.signs;
			$scope.player = _.findWhere(data.players, {id:data.playerId});
			$scope.players = data.players;
			$scope.market = data.market;
			$scope.turn = data.turn;
			$scope.cards = data.cards;
			$scope.$apply();
			render();
			checkTurnOver();
		});

	    var render = function() {
			if ($scope.sceneType === 'preparing') {
				_.each($scope.players, function(v){
				    var charInRoom = createSprite(backTexture, 128, 180, sceneOrtho);
					if (v.id === $scope.player.id) {
					    charInRoom.position.set(0, wHeight / 4, 1);
			            $('.ready-one').html(v.state === 'logined' ? '请准备' : '已经准备');
					} else {
					    charInRoom.position.set(0, - wHeight / 4, 1);
			            $('.ready-two').html(v.state === 'logined' ? '请准备' : '已经准备');
					}
				});
				renderer.clear();
				renderer.render( sceneOrtho, cameraOrtho );
			} else if ($scope.sceneType === 'gaming' || $scope.sceneType === 'turnOver') {
				sceneGamePad.children = [];
				objects = [];
				_.each($scope.players, function(value){
					var playerCardGroup = _.partition(value.currentCard, function(v){return v.type === 7});
					_.each(playerCardGroup[1], function(v, i){
						if (value.id === $scope.player.id) {
					        $scope.player.camelNumber = playerCardGroup[0].length;
							$scope.$apply();
						    createCard(v, i, 190, 50);
						} else {
					        createBackCard(i);
						}
					});
				});

				_.each($scope.market, function(v,i) {
					createCard(v, i, -10, 140);
				});

				_.each($scope.cards, function(v,i) {
					createCardArray(i);
				});

				var camelCard = createSprite(sevenTexture, cardWidth, cardHeight, sceneGamePad);
				camelCard.position.set(-130, -150, 1);
				$('.camel-number').css('top', 550);
				$('.camel-number').css('left', 350);
				$('.card-left').css('top', 360);
				$('.card-left').css('left', 350);

				_.each($scope.signs, function(v) {
					createSigns(v);
				});

				renderer.clear();
				renderer.render( sceneGamePad, cameraOrtho );
			}
		}

		$scope.signValue = function() {
			return JSON.stringify($scope.player.award);
		}

	    $scope.ready = function() {
			ws.emit('ready');
	    }

		$scope.chooseOne = function () {
			var selected = _.filter($scope.market, function(v){return v.isSelect === true});
			var camelInMarket = _.filter($scope.market, function(v){return v.type === 7});
			if (selected.length > 1 && selected.length !== camelInMarket.length) {
			    $scope.toast("只能拿取全部骆驼或者一张卡牌");
				return;
			} else if (selected.length === 0) {
				$scope.toast("请选择卡牌");
				return;
			}
	        if (_.reject($scope.player.currentCard.concat(selected), function(v){return v.type === 7}).length > 7) {
			    $scioe.toast("手牌数不能超过7张");
				return;
			}
			ws.emit('getCard', {'market': $scope.market});
		}

		$scope.chooseTwo = function () {
			var playerPartition = _.partition($scope.player.currentCard, function(v){return v.isSelect});
			if (playerPartition[0].length === 0) {
			    $scope.toast("至少选择一张卡牌才能出售");
				return;
			}
			if (_.filter(playerPartition[0], function(v){return v.type === 1}).length === 1) {
			    $scope.toast("钻石不能单张出售");
				return;
			}
			if (_.filter(playerPartition[0], function(v){return v.type === 2}).length === 1) {
			    $scope.toast("黄金不能单张出售");
				return;
			}
			if (_.filter(playerPartition[0], function(v){return v.type === 3}).length === 1) {
			    $scope.toast("白银不能单张出售");
				return;
			}
			if (!_.every(playerPartition[0], function(v){return v.type === playerPartition[0][0].type})) {
			    $scope.toast("只能出售同类物品");
				return;
			}
			ws.emit('sell', {'player': $scope.player});
		}

		$scope.chooseThree = function () {
			var marketPartition = _.partition($scope.market, function (v){return v.isSelect});
			var playerPartition = _.partition($scope.player.currentCard, function(v){return v.isSelect});
			if (marketPartition[0].length < 2) {
			    $scope.toast("至少选择两张牌进行交换");
				return;
			}
			if (!_.every(playerPartition[0], function (v){return !_.findWhere(marketPartition[0], {type:v.type});})) {
				$scope.toast("不能交换同类的卡");
				return;
			}
	        if (_.reject(playerPartition[1].concat(marketPartition[0]), function(v){return v.type === 7}).length > 7) {
				$scope.toast("手牌数不能超过7张");
				return;
			}
			if (marketPartition[0].length === playerPartition[0].length) {
			    ws.emit('exchange', {'player': $scope.player, 'market': $scope.market});
			} else if (marketPartition[0].length > playerPartition[0].length) {
			    if (window.confirm("手牌选择不足，是否使用骆驼")) {
					if ($scope.player.camelNumber >= marketPartition[0].length - playerPartition[0].length) {
			            ws.emit('exchange', {'player': $scope.player, 'market': $scope.market});
					} else {
					    $scope.toast("骆驼数不足");
						return;
					}
				} else {
					return;
				}
			} else {
			    $scope.toast("手牌选中的卡牌不能多于市场中的卡牌");
				return;
			}
		}

		$scope.chooseFour = function () {
			var leftCard = _.reject($scope.player.currentCard, function(v){return v.isSelect === true});
			if (_.reject(leftCard, function(v){return v.type === 7}).length > 6) {
				$scope.toast("请选择弃掉的牌");
			} else {
				ws.emit('turnOver', {'player': $scope.player});
			}
		}

		function checkTurnOver() {
			$scope.isOverCard = false;
			if ($scope.sceneType === 'turnOver' && $scope.turn === $scope.player.id) {
				var count = 0;
				_.each($scope.signs, function(v) {
					if (v.values.length === 0) {
						count++;
						console.log(count);
					}
				});
				if (count >= 3) {
					ws.emit('roundOver', {'players':players, 'market':market});
				} else {
					if ($scope.cards.length === 0 && $scope.market.length < 5) {
						ws.emit('roundOver', {'players':players, 'market':market});
					} else {
						ws.emit('turnOver');
					}
				}
			}
		}

		var loadAllTexture = function () {
		    var loader = new THREE.TextureLoader();
			charTexture = loader.load( "../img/char.png");
			oneTexture = loader.load( "../img/diamond.jpg");
			twoTexture = loader.load( "../img/gold.jpg");
			threeTexture = loader.load( "../img/silver.jpg");
			fourTexture = loader.load( "../img/leather.jpg");
			fiveTexture = loader.load( "../img/spice.jpg");
		    sixTexture = loader.load( "../img/cloth.jpg");
			sevenTexture = loader.load( "../img/camel.jpg");
			backTexture = loader.load( "../img/back.jpg");
			backgroundTexture = loader.load( "../img/background.jpg");
			diamond7 = loader.load("../img/diamond-token.png");
			diamond5 = loader.load("../img/diamond-token.png");
			gold6 = loader.load("../img/gold-token.png");
			gold5 = loader.load("../img/gold-token.png");
			silver5 = loader.load("../img/silver-token.png");
			leather5 = loader.load("../img/leather-token.png");
			leather3 = loader.load("../img/leather-token.png");
			leather2 = loader.load("../img/leather-token.png");
			leather1 = loader.load("../img/leather-token.png");
			spice5 = loader.load("../img/spice-token.png");
			spice3 = loader.load("../img/spice-token.png");
			spice2 = loader.load("../img/spice-token.png");
			spice1 = loader.load("../img/spice-token.png");
			cloth4 = loader.load("../img/cloth-token.png");
			cloth3 = loader.load("../img/cloth-token.png");
			cloth2 = loader.load("../img/cloth-token.png");
			cloth1 = loader.load("../img/cloth-token.png");
			camelSTexture = loader.load("../img/camel-token.png");
			threeSTexture = loader.load("../img/three-token.png");
			fourSTexture = loader.load("../img/four-token.png");
			fiveSTexture = loader.load("../img/five-token.png");
		}

		var addListener = function () {
		    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
		}

		var createSprite = function (texture, width, height, scene) {
			var material = new THREE.SpriteMaterial( { map: texture } );
			
			var sprite = new THREE.Sprite(material);
			sprite.scale.set(width, height, 1);
			scene.add(sprite);

			return sprite;
		}
	    
		function createCard(cardObject, order, height, gap) {
			var newSprite;
			switch(cardObject.type) {
				case 1:
					newSprite = createSprite(oneTexture, cardWidth, cardHeight, sceneGamePad);
					break;
				case 2:
					newSprite = createSprite(twoTexture, cardWidth, cardHeight, sceneGamePad);
					break;
				case 3:
					newSprite = createSprite(threeTexture, cardWidth, cardHeight, sceneGamePad);
					break;
				case 4:
					newSprite = createSprite(fourTexture, cardWidth, cardHeight, sceneGamePad);
					break;
				case 5:
					newSprite = createSprite(fiveTexture, cardWidth, cardHeight, sceneGamePad);
					break;
				case 6:
					newSprite = createSprite(sixTexture, cardWidth, cardHeight, sceneGamePad);
					break;
				case 7:
					newSprite = createSprite(sevenTexture, cardWidth, cardHeight, sceneGamePad);
					break;
			}
			if (cardObject.isSelect) {
				newSprite.position.set(gap / 1440 * wWidth * order, (-height + 50) / 728 * wHeight, 1);
			} else {
				newSprite.position.set(gap / 1440 * wWidth * order, -height / 720 * wHeight, 1);
			}
		    newSprite.userObject = cardObject;
		    objects.push(newSprite);
	    }

	    function createBackCard(order) {
			var newSprite = createSprite(backTexture, cardWidth, cardHeight, sceneGamePad);
		    newSprite.position.set(50 / 1440 * wWidth * order, 200, 1);
	    }

	    function createCardArray(order) {
			var newSprite = createSprite(backTexture, cardWidth, cardHeight, sceneGamePad);
			var cardArrayX = -130;
			var cardArrayY = 50;
		    newSprite.position.set(cardArrayX + order / 3, cardArrayY - order / 3, 1);
	    }

		function createSigns(sign) {
			switch(sign.type) {
				case 1:
					_.each(sign.values, function(v, i) {
						var texture;
					    if (v === 7) {
						    texture = diamond7;
						} else {
						    texture = diamond5;
						}
						var newSprite = createSprite(texture, signSize, signSize, sceneGamePad);
						newSprite.position.set(-signPos - 15 * i, 160, 1);
					});
					break;
				case 2:
					_.each(sign.values, function(v, i) {
						var texture;
					    if (v === 6) {
						    texture = gold6;
						} else {
						    texture = gold5;
						}
						var newSprite = createSprite(texture, signSize, signSize, sceneGamePad);
						newSprite.position.set(-signPos - 15 * i, 100, 1);
					});
					break;
				case 3:
					_.each(sign.values, function(v, i) {
						var texture;
						texture = silver5;
						var newSprite = createSprite(texture, signSize, signSize, sceneGamePad);
						newSprite.position.set(-signPos - 15 * i, 40, 1);
					});
					break;
				case 4:
					_.each(sign.values, function(v, i) {
						var texture;
					    if (v === 5) {
						    texture = leather5;
						} else if (v === 3) {
						    texture = leather3;
						} else if (v === 2) {
						    texture = leather2;
						} else {
						    texture = leather1;
						}
						var newSprite = createSprite(texture, signSize, signSize, sceneGamePad);
						newSprite.position.set(-signPos - 15 * i, -100, 1);
					});
					break;
				case 5:
					_.each(sign.values, function(v, i) {
						var texture;
					    if (v === 5) {
						    texture = spice5;
						} else if (v === 3) {
						    texture = spice3;
						} else if (v === 2) {
						    texture = spice2;
						} else {
						    texture = spice1;
						}
						var newSprite = createSprite(texture, signSize, signSize, sceneGamePad);
						newSprite.position.set(-signPos - 15 * i, -160, 1);
					});
					break;
				case 6:
					_.each(sign.values, function(v, i) {
						var texture;
					    if (v === 4) {
						    texture = cloth4;
						} else if (v === 3) {
						    texture = cloth3;
						} else if (v === 2) {
						    texture = cloth2;
						} else {
						    texture = cloth1;
						}
						var newSprite = createSprite(texture, signSize, signSize, sceneGamePad);
						newSprite.position.set(-signPos - 15 * i, -220, 1);
					});
					break;
				case 8:
					if (sign.values.length > 0) {
					    var newSprite = createSprite(threeSTexture, signSize, signSize, sceneGamePad);
					    newSprite.position.set(-signPos - 120, -30, 1);
					}
					break;
				case 9:
					if (sign.values.length > 0) {
					    var newSprite = createSprite(fourSTexture, signSize, signSize, sceneGamePad);
					    newSprite.position.set(-signPos - 60, -30, 1);
					}
					break;
				case 10:
					if (sign.values.length > 0) {
					    var newSprite = createSprite(fiveSTexture, signSize, signSize, sceneGamePad);
					    newSprite.position.set(-signPos, -30, 1);
					}
					break;
			}
	    }

	    function onDocumentTouchStart(event) {
		    event.preventDefault();
		    event.clientX = event.touches[0].clientX;
		    event.clientY = event.touches[0].clientY;
		    onDocumentMouseDown(event);
	    }

	    function onDocumentMouseDown(event) {
		    event.preventDefault();
			var clicked = false;
			_.map(objects, function(v) {
				if (Math.abs(v.position.x + wWidth / 2 - event.offsetX) < v.scale.x / 2
                    && Math.abs(- v.position.y + wHeight / 2 - event.offsetY) < v.scale.y / 2 && !clicked) {
				    v.userObject.isSelect = !v.userObject.isSelect;
					clicked = true;
					if (v.userObject.type === 7) {
						_.map($scope.market, function(value){
							if (value.type === 7) {
							    value.isSelect = v.userObject.isSelect;
							}
						});
					}
				}
			});
		    render();
	    }

		$scope.toast = function (message) {
			$uibModal.open({
				animation: true,
				templateUrl: 'toast.html',
				controller: 'ToastCtrl',
				windowClass: 'toast',
				backdrop: false,
				resolve:{
			        toastMessage : function() { return angular.copy(message); }
			    }
			});
		}
	}]);

	jaipur.controller('ToastCtrl', function (toastMessage, $scope, $timeout, $uibModalInstance) {
		$scope.toastMessage = toastMessage;
		$timeout(function () {
			$uibModalInstance.close();
		}, 1500);
	});
})();

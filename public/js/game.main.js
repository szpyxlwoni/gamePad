(function(){
    var jaipur = angular.module('jaipur', []);

	jaipur.controller('JaipurCtrl', ['$scope', '$window', function($scope, $window){
	    var ws = io.connect('http://localhost:3000');
		var _ = $window._;
		var renderer;
	    var oneTexture, twoTexture, threeTexture, fourTexture, fiveTexture, sixTexture, sevenTexture, backTexture, charTexture, backgroundTexture;
	    var cameraOrtho, sceneOrtho;
	    var objects = [];
	    var wWidth = window.innerWidth;
		var wHeight = window.innerHeight;
		var cardWPx = 128 / 1440;
		var cardHPx = 180 / 728;

		$scope.init = function() {
		    loadAllTexture();
			$scope.player = {};
			$scope.sceneType = 'preparing';
			$scope.isOverCard = false;

			cameraOrtho = new THREE.OrthographicCamera( - wWidth / 2, wWidth / 2, wHeight / 2, - wHeight / 2, 1, 10 );
			cameraOrtho.position.z = 10;
			sceneOrtho = new THREE.Scene();
			sceneGamePad = new THREE.Scene();

		    renderer = new THREE.WebGLRenderer({ alpha: true });
		    renderer.setSize( window.innerWidth, window.innerHeight );
		    renderer.autoClear = false;

		    document.body.appendChild( renderer.domElement );

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
						    createCard(v, i, 230, 50);
						} else {
					        createBackCard(i);
						}
					});
				});
				_.each($scope.market, function(v,i) {
					createCard(v, i, -10, 140);
				});
				renderer.clear();
				renderer.render( sceneGamePad, cameraOrtho );
			}
		}

	    $scope.ready = function() {
			ws.emit('ready');
	    }

		$scope.chooseOne = function () {
			var selected = _.filter($scope.market, function(v){return v.isSelect === true});
			var camelInMarket = _.filter($scope.market, function(v){return v.type === 7});
			if (selected.length > 1 && selected.length !== camelInMarket.length) {
			    window.alert("只能拿取全部骆驼或者一张卡牌");
				return;
			} else if (selected.length === 0) {
			    window.alert("请选择卡牌");
				return;
			}
			ws.emit('getCard', {'market': $scope.market});
		}

		$scope.chooseTwo = function () {
			var playerPartition = _.partition($scope.player.currentCard, function(v){return v.isSelect});
			if (playerPartition[0].length === 0) {
			    window.alert("至少选择一张卡牌才能出售");
				return;
			}
			if (_.filter(playerPartition[0], function(v){return v.type === 1}).length === 1) {
			    window.alert("钻石不能单张出售");
				return;
			}
			if (_.filter(playerPartition[0], function(v){return v.type === 2}).length === 1) {
			    window.alert("黄金不能单张出售");
				return;
			}
			if (_.filter(playerPartition[0], function(v){return v.type === 3}).length === 1) {
			    window.alert("白银不能单张出售");
				return;
			}
			ws.emit('sell', {'player': $scope.player});
		}

		$scope.chooseThree = function () {
			var marketPartition = _.partition($scope.market, function (v){return v.isSelect});
			var playerPartition = _.partition($scope.player.currentCard, function(v){return v.isSelect});
			if (marketPartition[0].length < 2) {
			    window.alert("至少选择两张牌进行交换");
				return;
			}
			if (!_.every(playerPartition[0], function (v){return !_.findWhere(marketPartition[0], {type:v.type});})) {
				window.alert("不能交换同类的卡");
				return;
			}
			if (marketPartition[0].length === playerPartition[0].length) {
			    ws.emit('exchange', {'player': $scope.player, 'market': $scope.market});
			} else if (marketPartition[0].length > playerPartition[0].length) {
			    if (window.confirm("手牌选择不足，是否使用骆驼")) {
					if ($scope.player.camelNumber >= marketPartition[0].length - playerPartition[0].length) {
			            ws.emit('exchange', {'player': $scope.player, 'market': $scope.market});
					} else {
					    window.alert("骆驼数不足");
						return;
					}
				} else {
					return;
				}
			} else {
			    window.alert("手牌选中的卡牌不能多于市场中的卡牌");
				return;
			}
		}

		$scope.chooseFour = function () {
			var leftCard = _.reject($scope.player.currentCard, function(v){return v.isSelect === true});
			if (_.reject(leftCard, function(v){return v.type === 7}).length > 6) {
				window.alert("请选择弃掉的牌");
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
						if (_.reject($scope.player.currentCard, function(v){return v.type === 7}).length > 6) {
							window.alert("手牌超过上限，请弃牌");
							$scope.isOverCard = true;
							$scope.$apply();
						} else {
							ws.emit('turnOver');
						}
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
		}

		var addListener = function () {
		    window.addEventListener( 'resize', onWindowResize, false );
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
					newSprite = createSprite(oneTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
					break;
				case 2:
					newSprite = createSprite(twoTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
					break;
				case 3:
					newSprite = createSprite(threeTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
					break;
				case 4:
					newSprite = createSprite(fourTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
					break;
				case 5:
					newSprite = createSprite(fiveTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
					break;
				case 6:
					newSprite = createSprite(sixTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
					break;
				case 7:
					newSprite = createSprite(sevenTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
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
			var newSprite = createSprite(backTexture, cardWPx * wWidth, cardHPx * wHeight, sceneGamePad);
		    newSprite.position.set(50 / 1440 * wWidth * order, 250 / 728 * wHeight, 1);
	    }

	    function onWindowResize() {
			wWidth = window.innerWidth;
			wHeight = window.innerHeight;

	    	cameraOrtho.left = - wWidth / 2;
	    	cameraOrtho.right = wWidth / 2;
	    	cameraOrtho.top = wHeight / 2;
	    	cameraOrtho.bottom = - wHeight / 2;
	    	cameraOrtho.updateProjectionMatrix();

	    	renderer.setSize(wWidth, wHeight);

			render();
	    }

	    function onDocumentTouchStart( event ) {
		    event.preventDefault();
		    event.clientX = event.touches[0].clientX;
		    event.clientY = event.touches[0].clientY;
		    onDocumentMouseDown( event );
	    }

	    function onDocumentMouseDown( event ) {
		    event.preventDefault();
			var clicked = false;
			_.map(objects, function(v) {
				if (Math.abs(v.position.x + wWidth / 2 - event.clientX) < v.scale.x / 2
                    && Math.abs(- v.position.y + wHeight / 2 - event.clientY) < v.scale.y / 2 && !clicked) {
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
	}]);
})();

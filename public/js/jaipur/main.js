(function() {
	angular.module('boardGame').constant("jaipurConfig", function($stateProvider, webUrl) {
		$stateProvider.state('jaipur', {
            url : '/jaipur',
			views :{
			    'content': {
				    templateUrl : webUrl + '/jaipur/index.html',
					controller : function($scope, $window, $uibModal, $timeout, $stateParams) {
	                    var ws;
		                var _ = $window._;
	                    var oneTexture, twoTexture, threeTexture, fourTexture, fiveTexture, sixTexture, sevenTexture, backTexture, charTexture, backgroundTexture;
		                var diamond7, diamond5, gold6, gold5, silver5, leather5, leather3, leather2, leather1, spice5, spice3, spice2, spice1, cloth4, cloth3, cloth2, cloth1, camelTexture, threeSTexture, fourSTexture, fiveSTexture;
	                    var wWidth = 1600;
		                var wHeight = 900;
		                var signSize = 80;
		                var signPos = 300;
		                var cardWidth = 128
		                var cardHeight = 174;
		                var cardPos = 600;
						var label_info, warnbox, warnTimer;

						var canvas = document.getElementById("jaipur-canvas");
		                var stage = new createjs.Stage(canvas);
						var queue = new createjs.LoadQueue(true);
						queue.on("complete", handleComplete, this);

			            $scope.player = {};
			            $scope.sceneType = 'preparing';
			            $scope.isOverCard = false;

						function handleComplete() {
							ws = io.connect('http://localhost:9000/jaipurServer')

							ws.on('connect', function () {
								ws.emit('join');
							});

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
						}

						function createText(text, xPos, yPos, size, color) {
							var text = new createjs.Text(text, size + "px Microsoft YaHei", color);
							text.x = xPos;
							text.y = yPos;
							stage.addChild(text);
							return text;
						}
						
						var positionSet = function (img, left, top) {
							img.x = left;
							img.y = top;
						}

						function initWarnBox() {
							warnbox = new createjs.Shape();
							warnbox.graphics.beginFill('#000');
							warnbox.graphics.drawRoundRect(wWidth / 2 - 250, wHeight / 2 - 50, 500, 100, 20, 20, 20, 20);
							warnbox.graphics.endFill();
							label_info = new createjs.Text('wrong!', "30px Microsoft YaHei", "#fff");
							label_info.textAlign = 'center';
							label_info.lineWidth = 300;
							label_info.x = wWidth / 2;
							label_info.y = wHeight / 2 - 25;
							warnbox.visible = false;
							label_info.visible = false;
						}

						initWarnBox();

						function warnBox(message) {
							label_info.text = message;
							warnbox.visible = true;
							label_info.visible = true;
							stage.addChild(warnbox);
							stage.addChild(label_info);
							stage.update();
							$timeout.cancel(warnTimer);
							warnTimer = $timeout(function (){
								warnbox.visible = false;
							    label_info.visible = false;
								stage.update();
							}, 2000);
						}

					    var render = function() {
							stage.removeAllChildren();
							stage.removeAllEventListeners();
							var centerOfX = wWidth / 2;
							var quaCenterOfY = wHeight / 4;
							if ($scope.sceneType === 'preparing') {
						        var text1 = createText('等待玩家', centerOfX + 100, quaCenterOfY, 20, "#fff");
								text1.addEventListener("click", function (){
							        ws.emit('ready');
								});
						        var text2 = createText('等待玩家', centerOfX + 100, quaCenterOfY * 3, 20, "#fff");
						        createText('您的位置-----', centerOfX - 250, quaCenterOfY, 20, "#fff");
						        createText('对手的位置---', centerOfX - 250, quaCenterOfY * 3, 20, "#fff");
								_.each($scope.players, function(v){
								    var charInRoom = createSprite('backTexture', cardWidth, cardHeight);
									if (v.id === $scope.player.id) {
									    positionSet(charInRoom, centerOfX - cardWidth / 2, quaCenterOfY - cardHeight / 2);
							            text1.text = (v.state === 'joined') ? '请准备' : '已经准备';
									} else {
									    positionSet(charInRoom, centerOfX - cardWidth / 2, quaCenterOfY * 3 - cardHeight / 2);
							            text2.text = (v.state === 'joined') ? '请准备' : '已经准备';
									}
								});
							} else if ($scope.sceneType === 'gaming' || $scope.sceneType === 'turnOver') {
								if ($scope.player.id === $scope.turn) {
								    createFuncBtn();
								}
								_.each($scope.players, function(value){
									var playerCardGroup = _.partition(value.currentCard, function(v){return v.type === 7});
									if (value.id === $scope.player.id) {
									    _.each(playerCardGroup[1], function(v, i){
									        $scope.player.camelNumber = playerCardGroup[0].length;
											$scope.$apply();
										    createCard(v, i, 600, 50);
									    });
										createCamelCard(playerCardGroup[0]);
									} else {
									    _.each(playerCardGroup[1], function(v, i){
									        createBackCard(i, 50);
										});
										if (playerCardGroup[0].length > 0) {
								            var camelCard = createSprite('sevenTexture', cardWidth, cardHeight);
								            positionSet(camelCard, 1100, 50);
										}
									}
								});

								_.each($scope.market, function(v,i) {
									createCard(v, i, quaCenterOfY + 100, 190);
								});

								_.each($scope.cards, function(v,i) {
									createCardArray(i);
								});

								createText($scope.cards.length, 475, 500, 20, "#fff");

								_.each($scope.signs, function(v) {
									createSigns(v);
								});

							}
						    stage.update();
						}

						function createCamelCard(camels) {
							_.each(camels, function (v, i) {
								var camelCard = createSprite('sevenTexture', cardWidth, cardHeight);
								if (v.isSelect) {
									var border = new createjs.Shape();
									border.graphics.beginFill("#ff0000");
									border.graphics.drawRoundRect(-3, -3, cardWidth + 6, cardHeight + 6, 5, 5, 5, 5);
									var container = new createjs.Container();
									container.x = 1100 + i * 30;;
									container.y = 600;
									container.addChild(border, camelCard);
									stage.addChild(container);
								} else {
								    positionSet(camelCard, 1100 + i * 30, 600);
								}
								camelCard.dataCard = v;
								camelCard.addEventListener('click', function(event){
									event.target.dataCard.isSelect = !event.target.dataCard.isSelect;
									render();
								});
						    });
						}

						function createFuncBtn() {
							var getBtn = createSprite('getBtn', 64, 64);
                            var sellBtn = createSprite('sellBtn', 64, 64);
                            var exchangeBtn = createSprite('exchangeBtn', 64, 64);

							getBtn.addEventListener('mousedown', function (event){
								event.target.image = queue.getResult('getBtnHover');
								stage.update();
							});
							getBtn.addEventListener('pressup', function (event){
								event.target.image = queue.getResult('getBtn');
								stage.update();
								var selected = _.filter($scope.market, function(v){return v.isSelect === true});
								var camelInMarket = _.filter($scope.market, function(v){return v.type === 7});
								if (selected.length > 1 && selected.length !== camelInMarket.length) {
								    warnBox("只能拿取全部骆驼或者一张卡牌");
									return;
								} else if (selected.length === 0) {
								    warnBox("请选择卡牌");
									return;
								}
								if (_.reject($scope.player.currentCard.concat(selected), function(v){return v.type === 7}).length > 7) {
									warnBox("手牌数不能超过7张");
									return;
								}
								ws.emit('getCard', {'market': $scope.market});
							});
							sellBtn.addEventListener('mousedown', function (event){
								event.target.image = queue.getResult('sellBtnHover');
								stage.update();
							});
							sellBtn.addEventListener('pressup', function (event){
								event.target.image = queue.getResult('sellBtn');
								stage.update();
								var playerPartition = _.partition($scope.player.currentCard, function(v){return v.isSelect && v.type !== 7});
								if (playerPartition[0].length === 0) {
									warnBox("至少选择一张卡牌才能出售");
									return;
								}
								if (_.filter(playerPartition[0], function(v){return v.type === 1}).length === 1) {
									warnBox("钻石不能单张出售");
									return;
								}
								if (_.filter(playerPartition[0], function(v){return v.type === 2}).length === 1) {
									warnBox("黄金不能单张出售");
									return;
								}
								if (_.filter(playerPartition[0], function(v){return v.type === 3}).length === 1) {
									warnBox("白银不能单张出售");
									return;
								}
								if (!_.every(playerPartition[0], function(v){return v.type === playerPartition[0][0].type})) {
									warnBox("只能出售同类物品");
									return;
								}
								ws.emit('sell', {'player': $scope.player});
							});
							exchangeBtn.addEventListener('mousedown', function (event){
								event.target.image = queue.getResult('exchangeBtnHover');
								stage.update();
							});
							exchangeBtn.addEventListener('pressup', function (event){
								event.target.image = queue.getResult('exchangeBtn');
								stage.update();
								var marketPartition = _.partition($scope.market, function (v){return v.isSelect});
								var playerPartition = _.partition($scope.player.currentCard, function(v){return v.isSelect});
								if (marketPartition[0].length < 2) {
									warnBox("至少选择两张牌进行交换");
									return;
								}
								if (!_.every(playerPartition[0], function (v){return !_.findWhere(marketPartition[0], {type:v.type});})) {
									warnBox("不能交换同类的卡");
									return;
								}
								if (_.reject(playerPartition[1].concat(marketPartition[0]), function(v){return v.type === 7}).length > 7) {
									warnBox("手牌数不能超过7张");
									return;
								}
								if (marketPartition[0].length === playerPartition[0].length) {
									ws.emit('exchange', {'player': $scope.player, 'market': $scope.market});
								} else {
									warnBox("交换的牌的数目不相等");
									return;
								}
							});

							positionSet(getBtn, 600, 525);
							positionSet(exchangeBtn, 750, 525);
							positionSet(sellBtn, 900, 525);
						}

						$scope.signValue = function() {
							return JSON.stringify($scope.player.award);
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
							queue.loadManifest([
							    {id : 'charTexture', src: "../img/jaipur/char.png"},
								{id : 'oneTexture', src:  "../img/jaipur/diamond.png"},
								{id : 'twoTexture', src:"../img/jaipur/gold.png"},
								{id : 'threeTexture', src:"../img/jaipur/silver.png"},
								{id : 'fourTexture', src:"../img/jaipur/leather.png"},
								{id : 'fiveTexture', src:"../img/jaipur/spice.png"},
								{id : 'sixTexture', src:"../img/jaipur/cloth.png"},
								{id : 'sevenTexture', src:"../img/jaipur/camel.png"},
								{id : 'backTexture', src:"../img/jaipur/back.png"},
								{id : 'backgroundTexture', src:"../img/jaipur/background.jpg"},
								{id : 'diamond7', src:"../img/jaipur/diamond-token.png"},
								{id : 'diamond5', src:"../img/jaipur/diamond-token2.png"},
								{id : 'gold6', src:"../img/jaipur/gold-token.png"},
								{id : 'gold5', src:"../img/jaipur/gold-token2.png"},
								{id : 'silver5', src:"../img/jaipur/silver-token.png"},
								{id : 'leather5', src:"../img/jaipur/leather-token.png"},
								{id : 'leather3', src:"../img/jaipur/leather-token2.png"},
								{id : 'leather2', src:"../img/jaipur/leather-token3.png"},
								{id : 'leather1', src:"../img/jaipur/leather-token4.png"},
								{id : 'spice5', src:"../img/jaipur/spice-token.png"},
								{id : 'spice3', src:"../img/jaipur/spice-token2.png"},
								{id : 'spice2', src:"../img/jaipur/spice-token3.png"},
								{id : 'spice1', src:"../img/jaipur/spice-token4.png"},
								{id : 'cloth4', src:"../img/jaipur/cloth-token.png"},
								{id : 'cloth3', src:"../img/jaipur/cloth-token2.png"},
								{id : 'cloth2', src:"../img/jaipur/cloth-token3.png"},
								{id : 'cloth1', src:"../img/jaipur/cloth-token4.png"},
								{id : 'camelSTexture', src:"../img/jaipur/camel-token.png"},
								{id : 'threeSTexture', src:"../img/jaipur/three-token.png"},
								{id : 'fourSTexture', src:"../img/jaipur/four-token.png"},
								{id : 'fiveSTexture', src:"../img/jaipur/five-token.png"},
								{id : 'getBtn', src:"../img/jaipur/get-btn.png"},
								{id : 'sellBtn', src:"../img/jaipur/sell-btn.png"},
								{id : 'exchangeBtn', src:"../img/jaipur/exchange-btn.png"},
								{id : 'getBtnHover', src:"../img/jaipur/get-btn-hover.png"},
								{id : 'sellBtnHover', src:"../img/jaipur/sell-btn-hover.png"},
								{id : 'exchangeBtnHover', src:"../img/jaipur/exchange-btn-hover.png"}
							]);
						}

						loadAllTexture();

						var createSprite = function (texture, width, height) {
							var img = new createjs.Bitmap(queue.getResult(texture));
							img.scaleX = width / img.image.width;
							img.scaleY = height / img.image.height;
							stage.addChild(img);
							return img;
						}
					    
						function createCard(cardObject, order, height, gap) {
							var newSprite;
							var x = cardPos + gap * order;
							var y;
							switch(cardObject.type) {
								case 1:
									newSprite = createSprite("oneTexture", cardWidth, cardHeight);
									break;
								case 2:
									newSprite = createSprite("twoTexture", cardWidth, cardHeight);
									break;
								case 3:
									newSprite = createSprite("threeTexture", cardWidth, cardHeight);
									break;
								case 4:
									newSprite = createSprite("fourTexture", cardWidth, cardHeight);
									break;
								case 5:
									newSprite = createSprite("fiveTexture", cardWidth, cardHeight);
									break;
								case 6:
									newSprite = createSprite("sixTexture", cardWidth, cardHeight);
									break;
								case 7:
									newSprite = createSprite("sevenTexture", cardWidth, cardHeight);
									break;
							}
							if (cardObject.isSelect) {
								y = height;
								var border = new createjs.Shape();
								border.graphics.beginFill("#ff0000");
								border.graphics.drawRoundRect(-3, -3, cardWidth + 6, cardHeight + 6, 5, 5, 5, 5);
								var container = new createjs.Container();
								container.x = x;
								container.y = y;
								container.addChild(border, newSprite);
								stage.addChild(container);
							} else {
								y = height;
								positionSet(newSprite, x, y);
							}
							newSprite.dataCard = cardObject;

							newSprite.addEventListener('click', function(event){
								event.target.dataCard.isSelect = !event.target.dataCard.isSelect;

								if (event.target.dataCard.type === 7) {
								    _.map($scope.market, function(v) {
									    if (v.type === 7) {
										    v.isSelect = event.target.dataCard.isSelect;
										}
										return v;
									});
								}

								render();
							});
					    }

					    function createBackCard(order, gap) {
							var newSprite = createSprite('backTexture', cardWidth, cardHeight);
						    positionSet(newSprite, cardPos + gap * order, 50);
					    }

					    function createCardArray(order) {
							var newSprite = createSprite('backTexture', cardWidth, cardHeight);
							var cardArrayX = 425;
							var cardArrayY = 300;
						    positionSet(newSprite, cardArrayX - order / 3, cardArrayY - order / 3);
					    }

						function createSigns(sign) {
							var gap = 18;
							var yStart = 200;
							var gapInY = 90;
							switch(sign.type) {
								case 1:
									_.each(sign.values, function(v, i) {
										var texture;
									    if (v === 7) {
										    texture = 'diamond7';
										} else {
										    texture = 'diamond5';
										}
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, yStart);
									});
									break;
								case 2:
									_.each(sign.values, function(v, i) {
										var texture;
									    if (v === 6) {
										    texture = 'gold6';
										} else {
										    texture = 'gold5';
										}
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, yStart + gapInY);
									});
									break;
								case 3:
									_.each(sign.values, function(v, i) {
										var texture;
										texture = 'silver5';
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, yStart + gapInY * 2);
									});
									break;
								case 4:
									_.each(sign.values, function(v, i) {
										var texture;
									    if (v === 5) {
										    texture = 'leather5';
										} else if (v === 3) {
										    texture = 'leather3';
										} else if (v === 2) {
										    texture = 'leather2';
										} else {
										    texture = 'leather1';
										}
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, yStart + gapInY * 4);
									});
									break;
								case 5:
									_.each(sign.values, function(v, i) {
										var texture;
									    if (v === 5) {
										    texture = 'spice5';
										} else if (v === 3) {
										    texture = 'spice3';
										} else if (v === 2) {
										    texture = 'spice2';
										} else {
										    texture = 'spice1';
										}
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, yStart + gapInY * 5);
									});
									break;
								case 6:
									_.each(sign.values, function(v, i) {
										var texture;
									    if (v === 4) {
										    texture = 'cloth4';
										} else if (v === 3) {
										    texture = 'cloth3';
										} else if (v === 2) {
										    texture = 'cloth2';
										} else {
										    texture = 'cloth1';
										}
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, yStart + gapInY * 6);
									});
									break;
								case 7:
									var newSprite = createSprite('camelSTexture', signSize, signSize);
									positionSet(newSprite, signPos - 240, yStart + gapInY * 3);
									break;
								case 8:
									if (sign.values.length > 0) {
										var newSprite = createSprite('threeSTexture', signSize, signSize);
										positionSet(newSprite, signPos - 160, yStart + gapInY * 3);
									}
									break;
								case 9:
									if (sign.values.length > 0) {
										var newSprite = createSprite('fourSTexture', signSize, signSize);
										positionSet(newSprite, signPos - 80, yStart + gapInY * 3);
									}
									break;
								case 10:
									if (sign.values.length > 0) {
										var newSprite = createSprite('fiveSTexture', signSize, signSize);
										positionSet(newSprite, signPos, yStart + gapInY * 3);
									}
									break;
							}
					    }
					}
				}
			}
		});
	});
})()

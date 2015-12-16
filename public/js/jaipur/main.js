(function() {
	angular.module('boardGame').constant("jaipurConfig", function($stateProvider, webUrl) {
		$stateProvider.state('jaipur', {
            url : '/jaipur/{roomId}',
			views :{
			    'content': {
				    templateUrl : webUrl + '/jaipur/index.html',
					controller : function($scope, $state, $window, $cookies, $uibModal, $timeout, $stateParams, $location) {
	                    var ws;
		                var _ = $window._;
	                    var oneTexture, twoTexture, threeTexture, fourTexture, fiveTexture, sixTexture, sevenTexture, backTexture, charTexture, backgroundTexture;
		                var diamond7, diamond5, gold6, gold5, silver5, leather5, leather3, leather2, leather1, spice5, spice3, spice2, spice1, cloth4, cloth3, cloth2, cloth1, camelTexture, threeSTexture, fourSTexture, fiveSTexture;
	                    var wWidth = 1600;
		                var wHeight = 900;
		                var signSize = 90;
		                var signPos = 400;
		                var cardWidth = 128
		                var cardHeight = 174;
		                var cardPos = 700;
						var label_info, warnbox, warnTimer, confirmBox, confirm_info, label_ok, buttonok;
						var token = $cookies.get('gamer_token');

						var canvas = document.getElementById("jaipur-canvas");
		                var stage = new createjs.Stage(canvas);
						var queue = new createjs.LoadQueue(true);
						queue.on("complete", handleComplete, this);

			            $scope.player = {};
			            $scope.sceneType = 'preparing';
			            $scope.isOverCard = false;

						function handleComplete() {
							ws = io.connect('http://localhost:9000/jaipurServer?roomId=' + $stateParams.roomId + '&token=' + token);

		                    ws.on('return.state', function (data) {
		                    	$location.path('/jaipur/' + data.id);
								$scope.sceneType = data.sceneType;
								$scope.signs = data.signs;
								$scope.player = data.players[token];
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

						function initConfirmBox() {
							var confirmBack = new createjs.Shape();
							confirmBack.graphics.beginFill('#000');
							confirmBack.alpha = 0.85;
							confirmBack.graphics.drawRoundRect(0, 0, 500, 300, 20, 20, 20, 20);
							confirmBack.graphics.endFill();

							buttonok = new createjs.Shape();
							buttonok.graphics.beginFill('#428BCA');
							buttonok.graphics.setStrokeStyle(2,'round').beginStroke('#357EBD');
							buttonok.graphics.drawRoundRect(167, 200, 170, 50, 5);
							buttonok.cursor = "pointer";

							confirm_info = new createjs.Text("message", "30px Microsoft YaHei", "#FFFFFF");
							confirm_info.x = 250;
							confirm_info.y = 50;
							confirm_info.textAlign = 'center';
							confirm_info.lineWidth = 300;

							label_ok = new createjs.Text("message", "25px Microsoft YaHei", "#FFFFFF");
							label_ok.x = 167 + 85;
							label_ok.y = 200 + 13;
							label_ok.textAlign = 'center';
							label_ok.lineWidth = 100;
							label_ok.lineHeight = 50;
							label_ok.cursor = "pointer";


							confirmBox = new createjs.Container();
							confirmBox.x = wWidth / 2 - 250;
							confirmBox.y = wHeight / 2 - 150;
							confirmBox.addChild(confirmBack, buttonok, confirm_info, label_ok);
						}

						initConfirmBox();

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
							var centerOfX = wWidth / 2;
							var quaCenterOfY = wHeight / 4;
							if ($scope.sceneType === 'gaming' || $scope.sceneType === 'turnOver') {
							    stage.removeAllChildren();
							    stage.removeAllEventListeners();
								if ($scope.player.token === $scope.turn) {
								    createFuncBtn();
								}
								_.each($scope.players, function(value){
									var playerCardGroup = _.partition(value.currentCard, function(v){return v.type === 7});
									if (value.token === $scope.player.token) {
									    _.each(playerCardGroup[1], function(v, i){
									        $scope.player.camelNumber = playerCardGroup[0].length;
											$scope.$apply();
										    createCard(v, i, 600, 60);
									    });
										createCamelCard(playerCardGroup[0]);
									} else {
									    _.each(playerCardGroup[1], function(v, i){
									        createBackCard(i, 60);
										});
										if (playerCardGroup[0].length > 0) {
								            var camelCard = createSprite('sevenTexture', cardWidth, cardHeight);
								            positionSet(camelCard, 1300, 50);
										}
									}
								});

								_.each($scope.market, function(v,i) {
									createCard(v, i, quaCenterOfY + 100, 140);
								});

								_.each($scope.cards, function(v,i) {
									createCardArray(i);
								});

								createText($scope.cards.length, 575, 500, 20, "#fff");

								_.each($scope.signs, function(v) {
									createSigns(v);
								});

							} else if ($scope.sceneType === 'roundOver') {
								var yourScore = 0;
								var rivalScore = 0;
								var winThisRound;
								_.each($scope.players, function(v) {
								    if (v.token === $scope.player.token) {
									    yourScore = v.total;
								        winThisRound = v.winThisRound;
									} else {
									    rivalScore = v.total;
									}
								});
								confirm_info.text = '第一轮结束，您的得分是' + yourScore + ', 对手的得分是' + rivalScore + '     ' + (winThisRound ? '您赢了' : '您输了');
                                label_ok.text = '进入下一轮';
							    buttonok.addEventListener('pressup', function (){
									label_ok.text = '等待对手开始';
									stage.update();
									ws.emit('roundStart');
								});
								stage.addChild(confirmBox);
							} else if ($scope.sceneType === 'gameOver') {
								var yourScore = 0;
								var rivalScore = 0;
								var winThisRound;
								_.each($scope.players, function(v) {
								    if (v.token === $scope.player.token) {
									    yourScore = v.total;
								        winThisRound = v.winThisRound;
									} else {
									    rivalScore = v.total;
									}
								});
								buttonok.removeAllEventListeners();
							    buttonok.addEventListener('pressup', function (){
									confirmBox.visible = false;
									stage.update();
									$state.go('room', {'domain':$state.current.name, 'roomId':$stateParams.roomId});
								});
								confirm_info.text = '游戏结束，您的得分是' + yourScore + ', 对手的得分是' + rivalScore + '     ' + (winThisRound ? '您赢了' : '您输了');
                                label_ok.text = '离开游戏';
								stage.addChild(confirmBox);
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
									container.x = 1200 + i * 30;;
									container.y = 600;
									container.addChild(border, camelCard);
									stage.addChild(container);
								} else {
								    positionSet(camelCard, 1200 + i * 30, 600);
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
								if (!_.every(playerPartition[0], function(v){return v.type === playerPartition[0][0].type})) {
									warnBox("只能出售同类物品");
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

							positionSet(getBtn, cardPos, 525);
							positionSet(exchangeBtn, cardPos + 150, 525);
							positionSet(sellBtn, cardPos + 300, 525);
						}

						$scope.signValue = function() {
							return JSON.stringify($scope.player.award);
						}

						function checkTurnOver() {
							$scope.isOverCard = false;
							if ($scope.sceneType === 'turnOver' && $scope.turn === $scope.player.token) {
								var count = 0;
								_.each($scope.signs, function(v) {
									if (v.values.length === 0) {
										count++;
										console.log(count);
									}
								});
								if (count >= 3) {
									ws.emit('roundOver');
								    confirmBox.visible = true;
								} else {
									if ($scope.cards.length === 0 && $scope.market.length < 5) {
									    ws.emit('roundOver', {'players': $scope.players, 'market': $scope.market});
								        confirmBox.visible = true;
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
							var cardArrayX = 525;
							var cardArrayY = 300;
						    positionSet(newSprite, cardArrayX - order / 3, cardArrayY - order / 3);
					    }

						function createSigns(sign) {
							var gap = 30;
							var yStart = 190;
							var gapInY = 95;
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
										positionSet(newSprite, signPos - (sign.values.length - 1) * gap + gap * i, yStart);
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
										positionSet(newSprite, signPos - (sign.values.length - 1) * gap + gap * i, yStart + gapInY);
									});
									break;
								case 3:
									_.each(sign.values, function(v, i) {
										var texture;
										texture = 'silver5';
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - (sign.values.length - 1) * gap + gap * i, yStart + gapInY * 2);
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
										positionSet(newSprite, signPos - (sign.values.length - 1) * gap + gap * i, yStart + gapInY * 4);
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
										positionSet(newSprite, signPos - (sign.values.length - 1) * gap + gap * i, yStart + gapInY * 5);
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
										positionSet(newSprite, signPos - (sign.values.length - 1) * gap + gap * i, yStart + gapInY * 6);
									});
									break;
								case 7:
									var newSprite = createSprite('camelSTexture', signSize, signSize);
									positionSet(newSprite, signPos - 300, yStart + gapInY * 3);
									break;
								case 8:
									if (sign.values.length > 0) {
										var newSprite = createSprite('threeSTexture', signSize, signSize);
										positionSet(newSprite, signPos - 200, yStart + gapInY * 3);
									}
									break;
								case 9:
									if (sign.values.length > 0) {
										var newSprite = createSprite('fourSTexture', signSize, signSize);
										positionSet(newSprite, signPos - 100, yStart + gapInY * 3);
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

(function() {
	angular.module('boardGame').constant("jaipurConfig", function($stateProvider, webUrl) {
		$stateProvider.state('jaipur', {
            url : '/jaipur',
			views :{
			    'content': {
				    templateUrl : webUrl + '/jaipur/index.html',
					controller : function($scope, $window, $uibModal, $stateParams) {
	                    var ws = io.connect('http://localhost:9000/jaipurServer');
		                var _ = $window._;
		                var renderer;
	                    var oneTexture, twoTexture, threeTexture, fourTexture, fiveTexture, sixTexture, sevenTexture, backTexture, charTexture, backgroundTexture;
		                var diamond7, diamond5, gold6, gold5, silver5, leather5, leather3, leather2, leather1, spice5, spice3, spice2, spice1, cloth4, cloth3, cloth2, cloth1, camelTexture, threeSTexture, fourSTexture, fiveSTexture;
	                    var wWidth = $('.jaipur-content').width();
		                var wHeight = $('.jaipur-content').height();
		                var signSize = 70;
		                var signPos = 300;
		                var cardWidth = 124;
		                var cardHeight = 172;
		                var cardPos = 550;

			            $scope.player = {};
			            $scope.sceneType = 'preparing';
			            $scope.isOverCard = false;

	                    ws.on('connect', function () {
	                        ws.emit('join');
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

						var positionSet = function (img, left, top) {
							$(img).css('left', left);
							$(img).css('top', top);
						}

					    var render = function() {
							if ($scope.sceneType === 'preparing') {
								$('.jaipur-content img').remove();
								_.each($scope.players, function(v){
								    var charInRoom = createSprite(backTexture, cardWidth, cardHeight);
									if (v.id === $scope.player.id) {
									    positionSet(charInRoom, wWidth / 2 - cardWidth / 2, wHeight / 4 - cardHeight / 2);
							            $('.ready-one').html(v.state === 'joined' ? '请准备' : '已经准备');
									} else {
									    positionSet(charInRoom, wWidth / 2 - cardWidth / 2, wHeight * 3 / 4 - cardHeight / 2);
							            $('.ready-two').html(v.state === 'joined' ? '请准备' : '已经准备');
									}
								});
							} else if ($scope.sceneType === 'gaming' || $scope.sceneType === 'turnOver') {
								$('.jaipur-content img').remove();
								_.each($scope.players, function(value){
									var playerCardGroup = _.partition(value.currentCard, function(v){return v.type === 7});
									_.each(playerCardGroup[1], function(v, i){
										if (value.id === $scope.player.id) {
									        $scope.player.camelNumber = playerCardGroup[0].length;
											$scope.$apply();
										    createCard(v, i, 650, 50);
										} else {
									        createBackCard(i, 100);
										}
									});
								});

								_.each($scope.market, function(v,i) {
									createCard(v, i, 350, 140);
								});

								_.each($scope.cards, function(v,i) {
									createCardArray(i);
								});

								var camelCard = createSprite(sevenTexture, cardWidth, cardHeight);
								positionSet(camelCard, 400, 550, 1);
								$('.camel-number').css('top', 750);
								$('.camel-number').css('left', 450);
								$('.card-left').css('top', 500);
								$('.card-left').css('left', 450);

								_.each($scope.signs, function(v) {
									createSigns(v);
								});
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
							    $scope.toast("手牌数不能超过7张");
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
							charTexture = "../img/char.png";
							oneTexture = "../img/diamond.png";
							twoTexture = "../img/gold.png";
							threeTexture = "../img/silver.png";
							fourTexture = "../img/leather.png";
							fiveTexture = "../img/spice.png";
						    sixTexture = "../img/cloth.png";
							sevenTexture = "../img/camel.png";
							backTexture = "../img/back.png";
							backgroundTexture = "../img/background.jpg";
							diamond7 = "../img/diamond-token.png";
							diamond5 = "../img/diamond-token2.png";
							gold6 = "../img/gold-token.png";
							gold5 = "../img/gold-token2.png";
							silver5 = "../img/silver-token.png";
							leather5 = "../img/leather-token.png";
							leather3 = "../img/leather-token2.png";
							leather2 = "../img/leather-token3.png";
							leather1 = "../img/leather-token4.png";
							spice5 = "../img/spice-token.png";
							spice3 = "../img/spice-token2.png";
							spice2 = "../img/spice-token3.png";
							spice1 = "../img/spice-token4.png";
							cloth4 = "../img/cloth-token.png";
							cloth3 = "../img/cloth-token2.png";
							cloth2 = "../img/cloth-token3.png";
							cloth1 = "../img/cloth-token4.png";
							camelSTexture = "../img/camel-token.png";
							threeSTexture = "../img/three-token.png";
							fourSTexture = "../img/four-token.png";
							fiveSTexture = "../img/five-token.png";
						}

						loadAllTexture();

						var createSprite = function (texture, width, height) {
							var img = document.createElement('img');
							img.src = texture;
							$('.jaipur-content').append(img);
							$(img).css('position', 'absolute');
							$(img).css('width', width);
							$(img).css('height', height);
							return img;
						}
					    
						function createCard(cardObject, order, height, gap) {
							var newSprite;
							var x = cardPos + gap * order;
							var y;
							switch(cardObject.type) {
								case 1:
									newSprite = createSprite(oneTexture, cardWidth, cardHeight);
									break;
								case 2:
									newSprite = createSprite(twoTexture, cardWidth, cardHeight);
									break;
								case 3:
									newSprite = createSprite(threeTexture, cardWidth, cardHeight);
									break;
								case 4:
									newSprite = createSprite(fourTexture, cardWidth, cardHeight);
									break;
								case 5:
									newSprite = createSprite(fiveTexture, cardWidth, cardHeight);
									break;
								case 6:
									newSprite = createSprite(sixTexture, cardWidth, cardHeight);
									break;
								case 7:
									newSprite = createSprite(sevenTexture, cardWidth, cardHeight);
									break;
							}
							if (cardObject.isSelect) {
								y = height - 50;
								positionSet(newSprite, x, y);
							} else {
								y = height;
								positionSet(newSprite, x, y);
							}
							newSprite.dataCard = cardObject;

							$(newSprite).click(function(event){
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
							var newSprite = createSprite(backTexture, cardWidth, cardHeight);
						    positionSet(newSprite, cardPos + gap * order, 50);
					    }

					    function createCardArray(order) {
							var newSprite = createSprite(backTexture, cardWidth, cardHeight);
							var cardArrayX = 400;
							var cardArrayY = 300;
						    positionSet(newSprite, cardArrayX - order / 3, cardArrayY - order / 3);
					    }

						function createSigns(sign) {
							var gap = 18;
							switch(sign.type) {
								case 1:
									_.each(sign.values, function(v, i) {
										var texture;
									    if (v === 7) {
										    texture = diamond7;
										} else {
										    texture = diamond5;
										}
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, 200);
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
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, 280);
									});
									break;
								case 3:
									_.each(sign.values, function(v, i) {
										var texture;
										texture = silver5;
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, 360);
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
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, 520);
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
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, 600);
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
										var newSprite = createSprite(texture, signSize, signSize);
										positionSet(newSprite, signPos - gap * i, 680);
									});
									break;
								case 8:
									if (sign.values.length > 0) {
										var newSprite = createSprite(threeSTexture, signSize, signSize);
										positionSet(newSprite, signPos - 160, 440);
									}
									break;
								case 9:
									if (sign.values.length > 0) {
										var newSprite = createSprite(fourSTexture, signSize, signSize);
										positionSet(newSprite, signPos - 80, 440);
									}
									break;
								case 10:
									if (sign.values.length > 0) {
										var newSprite = createSprite(fiveSTexture, signSize, signSize);
										positionSet(newSprite, signPos, 440);
									}
									break;
							}
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
					}
				}
			}
		});
	});
})()

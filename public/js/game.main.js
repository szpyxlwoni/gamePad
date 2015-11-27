$(document).ready(function(){
	var renderer, loader, material;
	var cameraOrtho, sceneOrtho;

	var player1, player2, readyBtn1, readyBtn2;
	var objects = [];
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	var sceneType = 'ready';
	var mouse;
	var raycaster;
	var player, players = [], market, otherPlayer, turn, signs, cardLeft, cards;
	var oneTexture, twoTexture, threeTexture, fourTexture, fiveTexture, sixTexture, sevenTexture, backTexture;

	var ws = io.connect('http://localhost:3000');

	ws.on('connect', function () {
	        ws.emit('login');
	});
	init();
	animate();

	function init() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		mouse = new THREE.Vector2();
		raycaster = new THREE.Raycaster();

		cameraOrtho = new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
		cameraOrtho.position.z = 10;
		sceneOrtho = new THREE.Scene();
		sceneGamePad = new THREE.Scene();
		loader = new THREE.TextureLoader();

		loader.load( "../img/char.png", createHUDSprites );
		oneTexture = loader.load( "../img/diamond.png");
		twoTexture = loader.load( "../img/gold.png");
		threeTexture = loader.load( "../img/silver.png");
	        fourTexture = loader.load( "../img/leather.png");
		fiveTexture = loader.load( "../img/spice.png");
		sixTexture = loader.load( "../img/cloth.png");
		sevenTexture = loader.load( "../img/camel.png");
		backTexture = loader.load( "../img/back.png");

		renderer = new THREE.WebGLRenderer();
		renderer.setClearColor(0xffffff);
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.autoClear = false;

		document.body.appendChild( renderer.domElement );

		window.addEventListener( 'resize', onWindowResize, false );
		renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	}

	function createHUDSprites ( texture ) {
		material = new THREE.SpriteMaterial( { map: texture } );
		var height = window.innerHeight / 2 - 100;
		var width = material.map.image.width / material.map.image.height * height;
		
		player1 = new THREE.Sprite( material );
		player1.scale.set( width, height, 1 );
		sceneOrtho.add(player1);
		
		player2 = new THREE.Sprite( material );
		player2.scale.set( width, height, 1 );
		sceneOrtho.add(player2);

		$('.ready-one').css('left', window.innerWidth / 2 + width / 2 + 50);
		$('.ready-one').css('top', window.innerHeight / 2 + window.innerHeight / 4);
		$('.ready-two').css('left', window.innerWidth / 2 + width / 2 + 50);
		$('.ready-two').css('top', window.innerHeight / 2 - window.innerHeight / 4);

		updateHUDSprites();
	}

	function createCard(cardObject, order, height) {
		var cardMaterial;
		switch(cardObject.type) {
			case 1:
			    cardMaterial = new THREE.SpriteMaterial( { map: oneTexture } );
			    break;
			case 2:
			    cardMaterial = new THREE.SpriteMaterial( { map: twoTexture } );
			    break;
			case 3:
			    cardMaterial = new THREE.SpriteMaterial( { map: threeTexture } );
			    break;
			case 4:
			    cardMaterial = new THREE.SpriteMaterial( { map: fourTexture } );
			    break;
			case 5:
			    cardMaterial = new THREE.SpriteMaterial( { map: fiveTexture } );
		            break;
			case 6:
			    cardMaterial = new THREE.SpriteMaterial( { map: sixTexture } );
			    break;
			case 7:
			    cardMaterial = new THREE.SpriteMaterial( { map: sevenTexture } );
			    break;
		}
		var card = new THREE.Sprite(cardMaterial);
		card.scale.set(128, 180, 1);
		if (cardObject.isSelect) {
		    card.position.set(140 * order - 280, -height + 100, 1);
		} else {
		    card.position.set(140 * order - 280, -height, 1);
		}
		card.userObject = cardObject;
		sceneGamePad.add(card);
		objects.push(card);
	}

	function createBackCard(order) {
	    material = new THREE.SpriteMaterial( { map: backTexture } );
		var card = new THREE.Sprite(material);
		card.scale.set(128, 180, 1);
		card.position.set(140 * order - 280, 200, 1);
		sceneGamePad.add(card);
	}

	function onDocumentTouchStart( event ) {
		event.preventDefault();
		event.clientX = event.touches[0].clientX;
		event.clientY = event.touches[0].clientY;
		onDocumentMouseDown( event );
	}

	function onDocumentMouseDown( event ) {
		event.preventDefault();
		mouse.x = ( event.clientX / renderer.domElement.width) * 2 - 1;
		mouse.y = - ( event.clientY / renderer.domElement.height) * 2 + 1;
		raycaster.setFromCamera( mouse, cameraOrtho );
		var intersects = raycaster.intersectObjects(objects);
		if ( intersects.length > 0 ) {
			var object = intersects[0].object;
			if (Math.abs(object.position.x + renderer.domElement.width / 2 - event.clientX) < object.scale.x / 2
					&& Math.abs(- object.position.y + renderer.domElement.height / 2 - event.clientY) < object.scale.y / 2) {
			    object.userObject.isSelect = !object.userObject.isSelect;
			}
		}
		render();
	}

	function updateHUDSprites () {
		var imageHeight = window.innerHeight / 4;

		var height = window.innerHeight / 2 - 100;
		var width = material.map.image.width / material.map.image.height * height;

		player1.scale.set(width, height, 1);
		player2.scale.set(width, height, 1);
		player1.position.set(0, imageHeight, 1);
		player2.position.set(0, -imageHeight, 1);
		$('.ready-one').css('left', window.innerWidth / 2 + width / 2 + 50);
		$('.ready-one').css('top', window.innerHeight / 2 + window.innerHeight / 4);
		$('.ready-two').css('left', window.innerWidth / 2 + width / 2 + 50);
		$('.ready-two').css('top', window.innerHeight / 2 - window.innerHeight / 4);
		$('.this-one').css('top', window.innerHeight / 2 + window.innerHeight / 4);
		$('.this-two').css('top', window.innerHeight / 2 - window.innerHeight / 4);
		$('.this-one').css('left', window.innerWidth / 2 - width / 2 - 100);
		$('.this-two').css('left', window.innerWidth / 2 - width / 2 - 100);
	}

	function onWindowResize() {
		var width = window.innerWidth;
		var height = window.innerHeight;

		cameraOrtho.left = - width / 2;
		cameraOrtho.right = width / 2;
		cameraOrtho.top = height / 2;
		cameraOrtho.bottom = - height / 2;
		cameraOrtho.updateProjectionMatrix();

		updateHUDSprites();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function animate() {
		render();
	}

	function checkTurnOver() {
		if (sceneType === 'turnOver' && turn === player.id) {
			var count = 0;
			_.each(signs, function(v) {
					if (v.values.length === 0) {
					    count++;
						console.log(count);
					}
			});
			if (count >= 3) {
			    ws.emit('roundOver', {'players':players, 'market':market});
			} else {
				if (cards.length === 0 && market.length < 5) {
			        ws.emit('roundOver', {'players':players, 'market':market});
				} else {
					if (_.reject(player.currentCard, function(v){return v.type === 7}).length > 6) {
						window.alert("手牌超过上限，请弃牌");
						sceneType = 'dropCard';
						render();
					} else {
			            ws.emit('turnOver', {'players':players, 'market':market});
					}
				}
			}
		}
	}

	function render() {
		if (sceneType === 'ready') {
		    renderer.clear();
		    renderer.render( sceneOrtho, cameraOrtho );
	            $('.ready-one').html('等待玩家');
	            $('.ready-two').html('等待玩家');
		    _.map(players, function(v){
		        if (v.id === 1) {
			    if (v.state === 'logined') {
			        $('.ready-one').html('请准备');
			    } else if (v.state === 'ready') {
			        $('.ready-one').html('已经准备');
			    }
			} else if (v.id === 2) {
			    if (v.state === 'logined') {
			        $('.ready-two').html('请准备');
			    } else if (v.state === 'ready') {
			        $('.ready-two').html('已经准备');
			    }
			}
		    });
		    $('.ready').css('display', 'block');
			$('.player-info').css('display', 'none');
		} else if (sceneType === 'gaming' || sceneType === 'gaining' || sceneType === 'selling' || sceneType == 'turnOver' || sceneType === 'dropCard') {
		    sceneGamePad.children = [];
			objects = [];
			var playerCardGroup = _.partition(player.currentCard, function(v){return v.type === 7});
			player.camelNumber = playerCardGroup[0].length;
		    _.each(playerCardGroup[1], function(v,i){
		        createCard(v,i, 200);
		    });
		    _.each(market, function(v,i) {
			    createCard(v, i, 0);
		    });
			var otherCardGroup = _.partition(otherPlayer.currentCard, function(v){return v.type === 7});
		    _.each(otherCardGroup[1], function(v,i){
			    createBackCard(i);
	        });
		    renderer.clear();
		    renderer.render( sceneGamePad, cameraOrtho );
			$('.camel-number span').html(playerCardGroup[0].length);
			$('.diamond span').html(JSON.stringify(_.findWhere(player.signs, {type:1}).values));
			$('.gold span').html(JSON.stringify(_.findWhere(player.signs, {type:2}).values));
			$('.silver span').html(JSON.stringify(_.findWhere(player.signs, {type:3}).values));
			$('.leathear span').html(JSON.stringify(_.findWhere(player.signs, {type:4}).values));
			$('.spice span').html(JSON.stringify(_.findWhere(player.signs, {type:5}).values));
			$('.cloth span').html(JSON.stringify(_.findWhere(player.signs, {type:6}).values));
			$('.threeSign span').html(JSON.stringify(_.findWhere(player.signs, {type:8}).values));
			$('.fourSign span').html(JSON.stringify(_.findWhere(player.signs, {type:9}).values));
			$('.fiveSign span').html(JSON.stringify(_.findWhere(player.signs, {type:10}).values));
			$('.win span').html(player.winSign);
            $('.gaming').css('display', 'none');
            $('.gaining').css('display', 'none');
			$('.message-info').css('display', 'none');
			$('.drop-card').css('display', 'none');
			if (sceneType === 'gaming' && turn === player.id) {
				$('.gaming').css('display', 'block');
			} else if (sceneType === 'gaining' && turn === player.id) {
				$('.gaining').css('display', 'block');
			} else {
                $('.message-info').css('display', 'block');
			}
			$('.ready').css('display', 'none');
			$('.player-info').css('display', 'block');
			$('.card-left').css('display', 'block');
			$('.card-left span').html(cards.length);
			if (sceneType === 'dropCard') {
		        $('.gaining').css('display', 'none');
		        $('.gaming').css('display', 'none');
		        $('.message-info').css('display', 'none');
				$('.drop-card').css('display', 'block');
			}
		} else if (sceneType === 'gameOver') {
			if (player.winSign === 2) {
				window.alert("你赢了");
			} else {
				window.alert("你输了");
			}
		}
	}	

	$('.ready-one').click(function(){
		if (player.id == 1) {
		    ws.emit('ready');
		}
	});

	$('.ready-two').click(function(){
		if (player.id == 2) {
		    ws.emit('ready');
		}
	});

	$('.choose-one').click(function(){
			sceneType = 'gaining';
			render();
	});

	$('.cancel').click(function(){
			sceneType = 'gaming';
			render();
	});

	$('.drop-card').click(function(){
        var leftCard = _.reject(player.currentCard, function(v){return v.isSelect === true})
		if (_.reject(leftCard, function(v){return v.type === 7}).length > 6) {
			window.alert("请选择弃掉的牌");
	    } else {
			_.map(players, function(v){
				if (v.id === player.id) {
				    player.currentCard = leftCard;
				    return player;
				}
			});
			ws.emit('turnOver', {'players':players, 'market':market});
		}
	});

	$('.choose-two').click(function(){
			var playerPartition = _.partition(player.currentCard, function(v){return v.isSelect});
			var awardType = 0;
			if (playerPartition[0].length === 0) {
			    window.alert("请选择卡牌出售");
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
			for (var i = 0; i < playerPartition[0].length; i++) {
			    var sign = _.findWhere(signs, {type:playerPartition[0][i].type});
				if (sign.values.length > 0) {
			        _.map(player.signs, function (v){
			    		if (v.type === playerPartition[0][i].type) {
			    		    v.values.push(sign.values.shift());
			    			return v;
			    		}
			    	});
				}
			}
			if (playerPartition[0].length >=5) {
			    awardType = 10;
			} else if (playerPartition[0].length >= 4) {
			    awardType = 9;
			} else if (playerPartition[0].length >= 3) {
			    awardType = 8;
			}
		    var sign = _.findWhere(signs, {type:awardType});
			if (sign) {
				_.map(player.signs, function (v){
					if (v.type === awardType) {
						v.values.push(sign.values.shift());
						return v;
					}
				});
			}
			player.currentCard = playerPartition[1];
			_.map(players, function(v){
				if (v.id === player.id) {
				    return player;
				}
			});
			ws.emit('sell', {'players':players, 'market':market, 'signs':signs});
	});

	$('.choose-three').click(function(){
			var marketPartition = _.partition(market, function (v){return v.isSelect});
			var playerPartition = _.partition(player.currentCard, function(v){return v.isSelect});
			if (marketPartition[0].length < 2) {
			    window.alert("至少选择两张牌进行交换");
				return;
			}
			if (marketPartition[0].length === playerPartition[0].length) {
				_.each(players, function(v){
					if (v.id === player.id) {
						v.currentCard = marketPartition[0].concat(playerPartition[1]);
					}
				});
				market = marketPartition[1].concat(playerPartition[0]);
			} else if (marketPartition[0].length > playerPartition[0].length) {
			    if (window.confirm("手牌选择不足，是否使用骆驼")) {
					if (player.camelNumber >= marketPartition[0].length - playerPartition[0].length) {
					    var camelInEx;
						_.each(players, function(v){
							if (v.id === player.id) {
							    var cardPartition = _.partition(v.currentCard, function(value){return value.type === 7});
								var camelPartition = _.partition(cardPartition[0], function(value,i){return i < marketPartition[0].length - playerPartition[0].length});
								v.currentCard = marketPartition[0].concat(_.reject(playerPartition[1], function(value){return value.type === 7})).concat(camelPartition[1]);
								camelInEx = camelPartition[0];
							}
						});
						market = marketPartition[1].concat(playerPartition[0]).concat(camelInEx);
					} else {
					    window.alert("骆驼数不足");
						return;
					}
				}
			} else {
			    window.alert("手牌选中的卡牌不能多于市场中的卡牌");
				return;
			}
			ws.emit('exchange', {'players':players, 'market':market});
	});

	$('.choose-four').click(function(){
			var index = _.findIndex(market, {isSelect:true});
			var selected = _.filter(market, function(v){return v.isSelect === true});
			if (selected.length > 1) {
			    window.alert("选择了太多卡牌");
				return;
			} else if (selected.length === 0) {
			    window.alert("为选择卡牌");
				return;
			}
			_.each(players, function(v){
				if (v.id === player.id) {
				    v.currentCard.push(market[index]);
				}
			});
			market = _.filter(market, function(v){
				return v.isSelect === false;
			});
			ws.emit('getOne', {'players':players, 'market':market});
	});

	$('.choose-five').click(function(){
			var camelPartition = _.partition(market, function (v){return v.type === 7});
			if (camelPartition[0].length === 0) {
			    window.alert("市场中没有骆驼");
				return;
			}
			_.each(players, function(v){
				if (v.id === player.id) {
				    v.currentCard = v.currentCard.concat(camelPartition[0]);
				}
			});
			market = camelPartition[1];
			ws.emit('getAllCamel', {'players':players, 'market':market});
	});

	ws.on('return.state', function (data){
		sceneType = data.sceneType;
		signs = data.signs;
		player = _.findWhere(data.players, {id:data.playerId});
		otherPlayer = _.find(data.players, function(v){return v.id != data.playerId});
		players = data.players;
		market = data.market;
		turn = data.turn;
		cards = data.cards;
		if (data.playerId === 1) {
		    $('.this-one').css('display','block');
		} else if (data.playerId === 2) {
		    $('.this-two').css('display','block');
		}
		render();
		checkTurnOver();
	});
});

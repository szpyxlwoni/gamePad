var _ = require('underscore');
var userService = require('../services/user');

var rooms = {};
var clients = [];
var lostClients = [];

for (var i = 0; i < 1024; i++) {
	rooms[i] = {
		id: i + 1,
		players: {},
		lostPlayers: {},
		state: 'end',
		sceneType: 'preparing'
	};
}

var players = [];
var playerNumber = 0;
var playerPosition = [0, 0];
var returnValue = {
	sceneType: 'ready',
	players: []
};
var cards = [];
var signs = [];
var market = [];

var Card = function(name, type) {
	this.name = name;
	this.type = type;
}

var Sign = function(name, type, values) {
	this.name = name;
	this.type = type;
	this.values = values;
}

var Player = function(token, state, socketId) {
	this.token = token;
	this.state = state;
	this.socketId = socketId;
	this.signs = [];
	this.winSign = 0;
	this.mostCamel = 0;
	this.goods = 0;
	this.award = [];
	this.total = 0;
}

function initCards(roomId) {
	var cards = [];
	for (var i = 0; i < 6; i++) {
		cards.push(new Card("黄金", 2));
		cards.push(new Card("白银", 3));
		cards.push(new Card("钻石", 1));
	}
	for (var i = 0; i < 8; i++) {
		cards.push(new Card("香料", 4));
		cards.push(new Card("丝绸", 5));
	}
	for (var i = 0; i < 10; i++) {
		cards.push(new Card("布匹", 6));
	}
	for (var i = 0; i < 8; i++) {
		cards.push(new Card("骆驼", 7));
	}
	cards = _.shuffle(cards);
	rooms[roomId - 1].cards = cards;
}

function initSigns(roomId) {
	var signs = [];
	signs.push(new Sign("钻石", 1, [5, 5, 5, 7, 7]));
	signs.push(new Sign("黄金", 2, [5, 5, 5, 6, 6]));
	signs.push(new Sign("白银", 3, [5, 5, 5, 5, 5]));
	signs.push(new Sign("布匹", 6, [1]));//, 1, 1, 1, 1, 1, 2, 3, 4]));
	signs.push(new Sign("香料", 5, [1]));//, 1, 2, 2, 3, 3, 5]));
	signs.push(new Sign("丝绸", 4, [1]));//, 1, 2, 2, 3, 3, 5]));
	signs.push(new Sign("3张牌的奖励", 8, _.shuffle([3, 3, 2, 2, 2, 1, 1])));
	signs.push(new Sign("4张牌的奖励", 9, _.shuffle([4, 4, 5, 5, 6, 6])));
	signs.push(new Sign("5张牌的奖励", 10, _.shuffle([8, 8, 9, 10, 10])));
	signs.push(new Sign("最多骆驼的奖励", 7, 5));
	rooms[roomId - 1].signs = signs;
}

function connect(io) {

	function offline(roomId, token) {
		var roomData = rooms[roomId - 1];
		if (roomData.lostPlayers[token]) {
			console.log('player ' + token + ' is offline');
			delete roomData.lostPlayers[token];
			delete roomData.players[token];
			roomData.sceneType = 'preparing';
			roomData.turn = undefined;
			roomData.state = 'open';
			if (_.size(roomData.players) === 0) {
				roomData.state = 'end';
			}
			rooms[roomId - 1] = roomData;
			io.in(roomId).emit('return.state', roomData);
		}
	}

	return function(socket) {
		var roomId = socket.handshake.query.roomId;
		var token = socket.handshake.query.token;
		if (roomId && roomId != 0 && _.size(rooms[roomId - 1].players) === 0) {
			rooms[roomId - 1].host = token;
		}
		if (!roomId) {
			roomId = _.findWhere(rooms, {
				state: 'end'
			}).id;
			rooms[roomId - 1].host = token;
		}
		if (roomId == 0) {
			var openedRoom = _.filter(rooms, function(v){return v.state === 'open'});
			if (openedRoom.length === 0) {
			    roomId = _.findWhere(rooms, {
				    state: 'end'
			    }).id;
			    rooms[roomId - 1].host = token;
			} else {
				roomId = _.sample(openedRoom).id;
			}
		}
		rooms[roomId - 1].state = 'open';
		if (!token || token === 'undefined' || rooms[roomId - 1].players.length === 2) {
			return;
		}

		socket.join(roomId);
		delete rooms[roomId - 1].lostPlayers[token];
		console.log('player ' + token + ' join the room' + roomId);
		if (!rooms[roomId - 1].players[token]) {
			var player = new Player(token, 'joined', socket.id);
		    userService.getUserFromToken(token, function(user) {
				player.name = user.name;
			    rooms[roomId - 1].players[token] = player;
		        io.in(roomId).emit('return.state', rooms[roomId - 1]);
			});
		} else {
		    io.in(roomId).emit('return.state', rooms[roomId - 1]);
		}

		socket.on('start', function() {
			var roomData = rooms[roomId - 1];
			if (_.size(roomData.players) === 2 && ! _.findWhere(roomData.players, {
				state: 'joined'
			})) {
				roomData.sceneType = 'gaming';
				roomData.state = 'gaming';
				initCards(roomId);
				initSigns(roomId);
				_.map(roomData.players, function(v) {
					roomData.players[v.token].currentCard = [];
					for (var i = 0; i < 5; i++) {
						roomData.players[v.token].currentCard.push({
							type: roomData.cards.pop().type,
							isSelect: false
						});
					}
				});
				roomData.market = [{
					type: 7,
					isSelect: false
				},
				{
					type: 7,
					isSelect: false
				},
				{
					type: 7,
					isSelect: false
				},
				{
					type: roomData.cards.pop().type,
					isSelect: false
				},
				{
					type: roomData.cards.pop().type,
					isSelect: false
				}];
				roomData.turn = _.sample(roomData.players).token;
			}
			rooms[roomId - 1] = roomData;
			io. in (roomId).emit('return.state', roomData);
		});

		socket.on('ready', function() {
			console.log('player ' + token + ' ready');
			var roomData = rooms[roomId - 1];
			roomData.players[token].state = roomData.players[token].state  === 'ready' ? 'joined': 'ready';
			rooms[roomId - 1] = roomData;
			io.in(roomId).emit('return.state', roomData);
		});

		function unselectAllCard(value) {
			_.map(value.market, function(v) {
				v.isSelect = false;
				return v
			});
			_.map(value.players[token].currentCard, function(v) {
				v.isSelect = false;
				return v
			});
		}

		socket.on('sell', function(msg) {
			var roomData = rooms[roomId - 1];
			if (roomData.sceneType !== 'gaming' || roomData.turn !== token) {
				return;
			}
			console.log('player ' + token + ' sell');
			console.log(msg);
			var updatedPlayer = msg.player;
			var awardType = 0;
			var playerPartition = _.partition(updatedPlayer.currentCard, function(v) {
				return v.isSelect === true && v.type !== 7
			});
			for (var i = 0; i < playerPartition[0].length; i++) {
				var sign = _.findWhere(roomData.signs, {
					type: playerPartition[0][i].type
				});
				if (sign.values.length > 0) {
					var one = sign.values.pop()
					updatedPlayer.goods += one;
					updatedPlayer.total += one;
				}
			}
			if (playerPartition[0].length >= 5) {
				awardType = 10;
			} else if (playerPartition[0].length >= 4) {
				awardType = 9;
			} else if (playerPartition[0].length >= 3) {
				awardType = 8;
			}
			var sign = _.findWhere(signs, {
				type: awardType
			});
			if (sign) {
				var value = sign.values.pop()
				updatedPlayer.award.push(value);
				updatedPlayer.total += value;
			}
			updatedPlayer.currentCard = playerPartition[1];
			roomData.players[token] = updatedPlayer;

			roomData.sceneType = 'turnOver';
			rooms[roomId - 1] = roomData;
			io.in(roomId).emit('return.state', roomData);
		});

		socket.on('getCard', function(msg) {
			var roomData = rooms[roomId - 1];
			if (roomData.sceneType !== 'gaming' || roomData.turn !== token) {
				return;
			}
			console.log('player ' + token + ' get');
			console.log(msg);
			var selected = _.partition(msg.market, function(v) {
				return v.isSelect === true
			});
			var camelInMarket = _.filter(msg.market, function(v) {
				return v.type === 7
			});
			if (selected[0].length === 0 || selected[0].length > 1 && selected[0].length !== camelInMarket.length) {
				return;
			}
			_.map(roomData.players, function(v) {
				if (v.token === token) {
					v.currentCard = v.currentCard.concat(selected[0]);
					return v;
				}
			});
			roomData.market = selected[1];
			if (roomData.market.length < 5) {
				var length = roomData.market.length;
				for (var i = 0; i < 5 - length; i++) {
					var oneCard = roomData.cards.pop();
					if (oneCard) {
						roomData.market.push({
							type: oneCard.type,
							isSelect: false
						});
					}
				}
			}
			roomData.sceneType = 'turnOver';
			rooms[roomId - 1] = roomData;
			io.in(roomId).emit('return.state', roomData);
		});

		socket.on('exchange', function(msg) {
			var roomData = rooms[roomId - 1];
			if (roomData.sceneType !== 'gaming' || roomData.turn !== token) {
				return;
			}
			console.log('player ' + token + ' exchange');
			console.log(msg);
			var marketPartition = _.partition(msg.market, function(v) {
				return v.isSelect
			});
			var playerPartition = _.partition(msg.player.currentCard, function(v) {
				return v.isSelect
			});
			if (marketPartition[0].length === playerPartition[0].length) {
			    roomData.players[token].currentCard = playerPartition[1].concat(marketPartition[0]);
				roomData.market = marketPartition[1].concat(playerPartition[0]);
			} else {
				return;
			}
			roomData.sceneType = 'turnOver';
			rooms[roomId - 1] = roomData;
			io.in(roomId).emit('return.state', roomData);
		});

		socket.on('turnOver', function(msg) {
			var roomData = rooms[roomId - 1];
			if (roomData.sceneType !== 'turnOver') {
				return;
			}
			console.log('player ' + token + ' turnOver');
			roomData.sceneType = 'gaming';
			roomData.turn = _.reject(roomData.players, function(v){ return v.token === roomData.turn})[0].token;
			unselectAllCard(roomData);
			rooms[roomId - 1] = roomData;
			io.in(roomId).emit('return.state', roomData);
		});

		function initGame() {
			var roomData = rooms[roomId - 1];
			roomData.sceneType = 'gaming';
			initCards(roomId);
			initSigns(roomId);
			_.map(roomData.players, function(v) {
				roomData.players[v.token].currentCard = [];
				roomData.players[v.token].total = 0;
				roomData.players[v.token].goods = 0;
				roomData.players[v.token].award = 0;
				for (var i = 0; i < 5; i++) {
					roomData.players[v.token].currentCard.push({
						type: roomData.cards.pop().type,
						isSelect: false
					});
				}
			});
			roomData.market = [{
				type: 7,
				isSelect: false
			},
			{
				type: 7,
				isSelect: false
			},
			{
				type: 7,
				isSelect: false
			},
			{
				type: roomData.cards.pop().type,
				isSelect: false
			},
			{
				type: roomData.cards.pop().type,
				isSelect: false
			}];
			rooms[roomId - 1] = roomData;
		}

		socket.on('roundOver', function(msg) {
			var roomData = rooms[roomId - 1];
			var sumSelf = {};
			var sumRival = {};
			console.log('roundOver');
			roomData.sceneType = 'roundOver';
			_.each(roomData.players, function(v) {
				var camel = _.reduce(v.currentCard, function(mem, value) {
					if (value.type === 7) {
						mem++;
					}
					return mem;
				}, 0);
				if (v.token === token) {
				    sumSelf = {total:v.total, camel:camel};
				} else {
			        sumRival = {total:v.total, camel:camel, token:v.token};
				}
			});
			if (sumSelf.camel > sumRival.camel) {
			    sumSelf.total += 5;
			} else if (sumSelf.camel < sumRival.camel) {
				sumRival.total += 5;
			}
			if (sumSelf.total > sumRival.total) {
				roomData.players[token].winSign += 1;
				roomData.players[token].winThisRound = true;
				if (roomData.players[token].winSign === 2) {
					roomData.sceneType = 'gameOver';
				}
				roomData.turn = roomData.players[sumRival.token].token;
			} else if (sumSelf.total < sumRival.total) {
				roomData.players[sumRival.token].winSign += 1;
				roomData.players[sumRival.token].winThisRound = true;
				if (roomData.players[sumRival.token].winSign === 2) {
					roomData.sceneType = 'gameOver';
				}
				roomData.turn = roomData.players[token].token;
			} else {
				if (roomData.players[token].award.length > roomData.players[sumRival.token].award.length) {
					roomData.players[token].winSign += 1;
					roomData.players[token].winThisRound = true;
					if (roomData.players[token].winSign === 2) {
						roomData.sceneType = 'gameOver';
					}
				    roomData.turn = roomData.players[sumRival.token].token;
				} else {
					roomData.players[sumRival.token].winSign += 1;
					roomData.players[sumRival.token].winThisRound = true;
					if (roomData.players[sumRival.token].winSign === 2) {
						roomData.sceneType = 'gameOver';
					}
					roomData.turn = roomData.players[token].token;
				}
			}
			roomData.players[token].total = sumSelf.total;
			roomData.players[sumRival.token].total = sumRival.total;
			_.map(roomData.players, function (v){v.state = 'joined';return v});
			rooms[roomId - 1] = roomData;
			io.in(roomId).emit('return.state', roomData);
		});

		socket.on('roundStart', function() {
			console.log('roundStart');
			rooms[roomId - 1].players[token].state = 'ready';
			if (_.size(rooms[roomId - 1].players) === 2 && ! _.findWhere(rooms[roomId - 1].players, {state: 'joined'})) {
				rooms[roomId - 1].sceneType = 'gaming';
				initGame();
			    io.in(roomId).emit('return.state', rooms[roomId -1]);
			}
		});

		socket.on('disconnect', function() {
			console.log('player ' + token + ' disconnect');
			rooms[roomId - 1].lostPlayers[token] = 1;
			if (rooms[roomId - 1].state === 'open') {
			    offline(roomId, token);
			} else {
				setTimeout(function() {
					offline(roomId, token);
					_.map(rooms[roomId - 1].players, function(v) {
						v.state = 'joined';
					});
				}, 10000);
			}
		});

		socket.on('close', function() {
			console.log('player ' + token + ' exit');
			rooms[roomId - 1].lostPlayers[token] = 1;
			offline(roomId, token);
		});
	}
}

exports.connect = connect;
exports.rooms = rooms;

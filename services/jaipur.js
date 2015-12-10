var _ = require('underscore');
var cookieUtil = require('../util/cookie-util');
var userService = require('../services/user');

var rooms = {};
var clients = [];
var lostClients = [];

for (var i = 0; i < 1024; i++) {
	rooms[i] = {
        id: i + 1, 
		players:{},
		lostPlayers: {},
		state: 'end',
		sceneType: 'preparing'
	};
}

var players = [];
var playerNumber = 0;
var playerPosition = [0, 0];
var returnValue = {sceneType:'ready', players:[]};
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
	signs.push(new Sign("钻石", 1, [5,5,5,7,7]));
	signs.push(new Sign("黄金", 2, [5,5,5,6,6]));	
	signs.push(new Sign("白银", 3, [5,5,5,5,5]));
	signs.push(new Sign("布匹", 6, [1,1,1,1,1,1,2,3,4]));	
	signs.push(new Sign("香料", 5, [1,1,2,2,3,3,5]));	
	signs.push(new Sign("丝绸", 4, [1,1,2,2,3,3,5]));
	signs.push(new Sign("3张牌的奖励", 8, _.shuffle([3,3,2,2,2,1,1])));
	signs.push(new Sign("4张牌的奖励", 9, _.shuffle([4,4,5,5,6,6])));
	signs.push(new Sign("5张牌的奖励", 10, _.shuffle([8,8,9,10,10])));
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
          _.map(roomData.players, function(v) {
	          v.state = 'joined';
          });
          roomData.sceneType = 'preparing';
	      roomData.turn = undefined;
		  rooms[roomId - 1] = roomData;
		  console.log(roomData);
          io.in(roomId).emit('return.state', roomData);
	  }
}

return function (socket) {
	var roomId = socket.handshake.query.roomId;
	if (!roomId) {
		roomId = _.findWhere(rooms, {state:'end'}).id;
	}
    rooms[roomId - 1].state = 'open';
	var token = socket.handshake.query.token;
	if (!token || token === 'undefined' || rooms[roomId - 1].players.length === 2) {
		return;
	}

	socket.join(roomId);
	delete rooms[roomId - 1].lostPlayers[token];
	console.log('player ' + token + ' join the room' + roomId);
	if (!rooms[roomId - 1].players[token]) {
	    rooms[roomId - 1].players[token] = new Player(token, 'joined', socket.id);
	}
    io.in(roomId).emit('return.state', rooms[roomId - 1]);

	socket.on('start', function () {
		var roomData = rooms[roomId - 1];
		if (_.size(roomData.players) === 2 && !_.findWhere(roomData.players, {state:'joined'})) {
			roomData.sceneType = 'gaming';
			initCards(roomId);
			initSigns(roomId);
			_.map(roomData.players, function (v){
				roomData.players[v.token].currentCard = [];
			    for (var i = 0; i < 5; i++) {
			        roomData.players[v.token].currentCard.push({type:roomData.cards.pop().type, isSelect:false});
		        }
			});
			roomData.market = [{type:7, isSelect:false},{type:7, isSelect:false},{type:7, isSelect:false},{type:roomData.cards.pop().type, isSelect:false},{type:roomData.cards.pop().type, isSelect:false}];
		    roomData.turn = _.sample(roomData.players).token;
	    }
		rooms[roomId - 1] = roomData;
		console.log(roomData);
	    io.in(roomId).emit('return.state', roomData);
	});

	socket.on('ready', function (){
		console.log('player ' + token + ' ready');
		var roomData = rooms[roomId - 1];
		_.map(roomData.players, function(v){
			if (v.token === token) {
			    v.state = v.state === 'ready' ? 'joined' : 'ready';
		    }
		});
		rooms[roomId - 1] = roomData;
	    io.in(roomId).emit('return.state', roomData);
    });

  function unselectAllCard(value) {
	  _.map(value.market, function(v){v.isSelect = false;return v});
	  _.map(value.players[0].currentCard, function(v){v.isSelect = false;return v});
	  _.map(value.players[1].currentCard, function(v){v.isSelect = false;return v});
  }

  socket.on('sell', function(msg){
	  var roomData = rooms[roomId - 1];
	  if (roomData.sceneType !== 'gaming' || roomData.turn !== token) {
	      return;
	  }
	  console.log('player ' + id + ' sell');
	  console.log(msg);
	  var updatedPlayer = msg.player;
	  var awardType = 0;
	  var playerPartition = _.partition(updatedPlayer.currentCard, function(v){return v.isSelect === true && v.type !== 7});
	  for (var i = 0; i < playerPartition[0].length; i++) {
	      var sign = _.findWhere(signs, {type:playerPartition[0][i].type});
		  if (sign.values.length > 0) {
		      var one = sign.values.pop()
		      updatedPlayer.goods += one;
		      updatedPlayer.total += one;
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
          var value = sign.values.pop()
		  updatedPlayer.award.push(value);
		  updatedPlayer.total += value;
	  }
	  updatedPlayer.currentCard = playerPartition[1];
	  _.map(players, function (v) {
		  if (v.id === updatedPlayer.id) {
			  v.currentCard = updatedPlayer.currentCard;
			  v.goods = updatedPlayer.goods;
			  v.award = updatedPlayer.award;
			  v.total = updatedPlayer.total;
		  }
		  return v;
	  });

	  returnValue.sceneType = 'turnOver';
	  returnValue.players = players;
	  returnValue.signs = signs;
	  unselectAllCard(returnValue);
      broadcast(returnValue);
  });

  socket.on('getCard', function(msg){
	  var roomData = rooms[roomId - 1];
	  if (roomData.sceneType !== 'gaming' || roomData.turn !== token) {
	      return;
	  }
	  console.log('player ' + token + ' get');
	  console.log(msg);
	  var selected = _.partition(msg.market, function(v){return v.isSelect === true});
	  var camelInMarket = _.filter(msg.market, function(v){return v.type === 7});
	  if (selected[0].length === 0 || selected[0].length > 1 && selected[0].length !== camelInMarket.length) {
	      return;
	  }
      _.map(players, function(v){
		  if (v.id === id) {
			  v.currentCard = v.currentCard.concat(selected[0]);
			  return v;
		  }
	  });
	  market = selected[1];
	  if (market.length < 5) {
	      var length = market.length;
	      for (var i = 0; i < 5 - length; i++) {
		      var oneCard = cards.pop();
			  if (oneCard) {
		          market.push({type:oneCard.type, isSelect:false});
			  }
		  }
	  }
	  returnValue.sceneType = 'turnOver';
	  returnValue.market = market;
	  returnValue.players = players;
	  unselectAllCard(returnValue);
      broadcast(returnValue);
  });

  socket.on('exchange', function(msg){
	  if (returnValue.sceneType !== 'gaming' || returnValue.turn !== id) {
	      return;
	  }
	  console.log('player ' + id + ' exchange');
	  console.log(msg);
	  var marketPartition = _.partition(msg.market, function (v){return v.isSelect});
	  var playerPartition = _.partition(msg.player.currentCard, function(v){return v.isSelect});
	  if (marketPartition[0].length === playerPartition[0].length) {
		  _.each(players, function(v){
			  if (v.id === msg.player.id) {
				  v.currentCard = playerPartition[1].concat(marketPartition[0]);
				  return v;
			  }
		  });
		  market = marketPartition[1].concat(playerPartition[0]);
	  } else {
	      return;
	  }
	  returnValue.sceneType = 'turnOver';
	  returnValue.market = market;
	  returnValue.players = players;
	  unselectAllCard(returnValue);
      broadcast(returnValue);
  });

  socket.on('turnOver', function(msg){
	  if (returnValue.sceneType !== 'turnOver') {
	      return;
	  }
	  console.log('player ' + id + ' turnOver');
	  if (msg && msg.player) {
		  var leftCard = _.reject(msg.player.currentCard, function(v){return v.isSelect === true});
		  _.map(players, function(v){
			  if (v.id === msg.player.id) {
				  v.currentCard = leftCard;
				  return v;
			  }
		  });
	  }
	  returnValue.sceneType = 'gaming';
	  returnValue.turn = returnValue.turn % 2 + 1;
	  returnValue.players = players;
	  returnValue.market = market;
	  unselectAllCard(returnValue);
      broadcast(returnValue);
  });

  function initGame() {
	  initCards();
	  initSigns();
	  players[0].currentCard = [];
	  players[0].total = 0;
	  players[0].goods = 0;
	  players[0].award = [];
	  players[1].currentCard = [];
	  players[1].total = 0;
	  players[1].goods = 0;
	  players[1].award = [];
	  for (var i = 0; i < 5; i++) {
	      players[0].currentCard.push({type:cards.pop().type, isSelect:false});
		  players[1].currentCard.push({type:cards.pop().type, isSelect:false});
	  }
	  market = [{type:7, isSelect:false},{type:7, isSelect:false},{type:7, isSelect:false},{type:cards.pop().type, isSelect:false},{type:cards.pop().type, isSelect:false}];
  }
  
  socket.on('roundOver', function(msg){
	  console.log('roundOver');
	  returnValue.sceneType = 'roundOver';
	  var sum0 = msg.players[0].total;
	  var sum1 = msg.players[1].total;
	  var camel0 = _.reduce(msg.players[0].currentCard, function (mem,v){if (v.type === 7){mem++;}return mem;}, 0);
	  var camel1 = _.reduce(msg.players[1].currentCard, function (mem,v){if (v.type === 7){mem++;}return mem;}, 0);
	  if (camel0 > camel1) {
	      sum0 += 5;
          msg.players[0].total += 5;
	  } else if (camel1 < camel0) {
	      sum1 += 5;
          msg.players[1].total += 5;
	  }
	  if (sum0 > sum1) {
	      msg.players[0].winSign += 1;
	      msg.players[0].winThisRound = true;
		  if (msg.players[0].winSign === 2) {
			  returnValue.sceneType = 'gameOver';
		  }
	      returnValue.turn = msg.players[1].id;
	  } else if (sum0 < sum1) {
		  msg.players[1].winSign += 1;
	      msg.players[1].winThisRound = true;
		  if (msg.players[1].winSign === 2) {
			  returnValue.sceneType = 'gameOver';
		  }
	      returnValue.turn = msg.players[0].id;
	  } else {
		  if (msg.players[0].award.length > msg.players[1].award.length) {
			  msg.players[0].winSign += 1;
	          msg.players[0].winThisRound = true;
			  if (msg.players[0].winSign === 2) {
				  returnValue.sceneType = 'gameOver';
			  }
			  returnValue.turn = msg.players[1].id;
		  } else {
		      msg.players[1].winSign += 1;
	          msg.players[1].winThisRound = true;
			  if (msg.players[1].winSign === 2) {
				  returnValue.sceneType = 'gameOver';
			  }
			  returnValue.turn = msg.players[0].id;
		  }
	  }
	  players = msg.players;
	  returnValue.players = players;
	  returnValue.players[0].state = 'joined';
	  returnValue.players[1].state = 'joined';
      broadcast(returnValue);
  });

  socket.on('roundStart', function(){
	  console.log('roundStart');
	  _.map(returnValue.players, function (v) {
		  if (v.id === id) {
			  v.state = 'ready';
		  }
		  return v;
	  });
	  if (returnValue.players.length === 2 && !_.findWhere(returnValue.players, {state:'joined'})) {
	      returnValue.sceneType = 'gaming';
	      initGame();
		  returnValue.signs = signs;
		  returnValue.cards = cards;
		  returnValue.players = players;
		  returnValue.market = market;
	  }
      broadcast(returnValue);
  });


  socket.on('disconnect', function(){
      console.log('player ' + token + ' disconnect');
	  rooms[roomId - 1].lostPlayers[token] = 1;
	  if (rooms[roomId - 1].sceneType === 'preparing'){
	      offline(roomId, token);
	  } else {
	      setTimeout(function(){
		      offline(roomId, token);
	      }, 10000);
	  }
  });

  socket.on('close', function(){
      console.log('bbb');
  });
}
}

exports.connect = connect;
exports.rooms = _.reject(rooms, function(v) {return v.state === 'end';});

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var _ = require('underscore');

var players = [];
var playerNumber = 0;
var playerPosition = [0, 0];
var returnValue = {sceneType:'ready', players:[]};
var cards = [];
var signs = [];
var market = [];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendfile(__dirname + '/html/index.html');
});

var Card = function(name, type) {
    this.name = name;
    this.type = type;
}

var Sign = function(name, type, values) {
	this.name = name;
	this.type = type;
	this.values = values;
}

var Player = function(id, state, socketId) {
	this.id = id;
	this.state = state;
	this.socketId = socketId;
	this.signs = [];
	this.winSign = 0;
	this.mostCamel = 0;
	this.signs.push(new Sign("钻石", 1, []));
	this.signs.push(new Sign("黄金", 2, []));
	this.signs.push(new Sign("白银", 3, []));
	this.signs.push(new Sign("皮革", 4, []));
	this.signs.push(new Sign("香料", 5, []));
	this.signs.push(new Sign("布匹", 6, []));
	this.signs.push(new Sign("3张牌的奖励", 8, []));
	this.signs.push(new Sign("4张牌的奖励", 9, []));
	this.signs.push(new Sign("5张牌的奖励", 10, []));
}

function zeroSign(player) {
	player.signs = [];
	player.signs.push(new Sign("钻石", 1, []));
	player.signs.push(new Sign("黄金", 2, []));
	player.signs.push(new Sign("白银", 3, []));
	player.signs.push(new Sign("皮革", 4, []));
	player.signs.push(new Sign("香料", 5, []));
	player.signs.push(new Sign("布匹", 6, []));
	player.signs.push(new Sign("3张牌的奖励", 8, []));
	player.signs.push(new Sign("4张牌的奖励", 9, []));
	player.signs.push(new Sign("5张牌的奖励", 10, []));
}

function initCards() {
	cards = [];
	for (var i = 0; i < 6; i++) {
		cards.push(new Card("黄金", 2));
		cards.push(new Card("白银", 3));
		cards.push(new Card("钻石", 1));
	}
	for (var i = 0; i < 8; i++) {
		cards.push(new Card("香料", 5));
		cards.push(new Card("布匹", 6));
	}
	for (var i = 0; i < 10; i++) {
		cards.push(new Card("皮革", 4));
	}
	for (var i = 0; i < 8; i++) {
		cards.push(new Card("骆驼", 7));
	}
	cards = _.shuffle(cards);
}

function initSigns() {
	signs = [];
	signs.push(new Sign("钻石", 1, [7,7,5,5,5]));
	signs.push(new Sign("黄金", 2, [6,6,5,5,5]));	
	signs.push(new Sign("白银", 3, [5,5,5,5,5]));
	signs.push(new Sign("皮革", 4, [4,3,2,1,1,1,1,1,1]));	
	signs.push(new Sign("香料", 5, [5,3,3,2,2,1,1]));	
	signs.push(new Sign("布匹", 6, [5,3,3,2,2,1,1]));
	signs.push(new Sign("3张牌的奖励", 8, _.shuffle([3,3,2,2,2,1,1])));
	signs.push(new Sign("4张牌的奖励", 9, _.shuffle([4,4,5,5,6,6])));
	signs.push(new Sign("5张牌的奖励", 10, _.shuffle([8,8,9,10,10])));
	signs.push(new Sign("最多骆驼的奖励", 7, 5));
}

var broadcast = function(msg){
	_.each(players, function(v){
	    var socket = _.findWhere(io.sockets.sockets, {id:v.socketId});
	        if (socket) {
		    msg.playerId = v.id;
		    socket.emit('return.state', msg);
		}
	});
};

io.on('connection', function(socket){
  var position = _.findIndex(playerPosition, function (v){
	  return v == 0;
  });
  var id = position + 1;

  if (position == -1) {
      return;
  }
  socket.on('login', function(msg){
      console.log('player ' + id + ' connected');
      playerNumber++;
      playerPosition[position] = 1;
      players.push(new Player(id, 'logined', socket.id));
      returnValue.sceneType = 'preparing';
      returnValue.players = players;
      broadcast(returnValue);
  });

  socket.on('ready', function (){
      console.log('player ' + id + ' ready');
      _.map(players, function(v){
	      if (v.id === id) {
	          v.state = 'ready';
	      }
      });
      if (players.length === 2 && !_.findWhere(players, {state:'logined'})) {
          returnValue.sceneType = 'gaming';
		  initCards();
		  initSigns();
		  returnValue.cards = cards;
		  returnValue.players[0].currentCard = [];
		  returnValue.players[1].currentCard = [];
		  for (var i = 0; i < 5; i++) {
			  returnValue.players[0].currentCard.push({type:cards.pop().type, isSelect:false});
			  returnValue.players[1].currentCard.push({type:cards.pop().type, isSelect:false});
		  }
		  market = [{type:7, isSelect:false},{type:7, isSelect:false},{type:7, isSelect:false},{type:cards.pop().type, isSelect:false},{type:cards.pop().type, isSelect:false}];
		  returnValue.market = market;
		  returnValue.signs = signs;
		  returnValue.turn = _.sample(players).id;
      }
      returnValue.players = players;
      broadcast(returnValue);
  });

  function updateCurrentCardFromPlayers(one) {
	  _.map(players, function (v) {
	      if (v.id === one.id) {
		      v.currentCard = one.currentCard;
		  }
		  return v;
	  });
  }

  function unselectAllCard(value) {
	  _.map(value.market, function(v){v.isSelect = false;return v});
	  _.map(value.players[0].currentCard, function(v){v.isSelect = false;return v});
	  _.map(value.players[1].currentCard, function(v){v.isSelect = false;return v});
  }

  socket.on('sell', function(msg){
	  console.log('player ' + id + ' sell');
	  console.log(msg);
	  var updatedPlayer = msg.player;
	  var awardType = 0;
	  var playerPartition = _.partition(updatedPlayer.currentCard, function(v){return v.isSelect === true});
	  for (var i = 0; i < playerPartition[0].length; i++) {
	      var sign = _.findWhere(signs, {type:playerPartition[0][i].type});
		  if (sign.values.length > 0) {
		      _.map(updatedPlayer.signs, function (v){
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
		  _.map(updatedPlayer.signs, function (v){
			  if (v.type === awardType) {
				  v.values.push(sign.values.shift());
				  return v;
			  }
		  });
	  }
	  updatedPlayer.currentCard = playerPartition[1];
	  updateCurrentCardFromPlayers(updatedPlayer);

	  returnValue.sceneType = 'turnOver';
	  returnValue.players = players;
	  returnValue.signs = signs;
	  unselectAllCard(returnValue);
      broadcast(returnValue);
  });

  socket.on('getCard', function(msg){
	  console.log('player ' + id + ' get');
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
		      market.push({type:cards.pop().type, isSelect:false});
		  }
	  }
	  returnValue.sceneType = 'turnOver';
	  returnValue.market = market;
	  returnValue.players = players;
	  unselectAllCard(returnValue);
      broadcast(returnValue);
  });

  socket.on('exchange', function(msg){
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
	  } else if (marketPartition[0].length >= playerPartition[0].length) {
	      var camelInEx;
		  _.each(players, function(v){
			  if (v.id === msg.player.id) {
				  var cardPartition = _.partition(v.currentCard, function(value){return value.type === 7});
				  var camelPartition = _.partition(cardPartition[0], function(value,i){return i < marketPartition[0].length - playerPartition[0].length});
				  v.currentCard = marketPartition[0].concat(_.reject(playerPartition[1], function(value){return value.type === 7})).concat(camelPartition[1]);
				  camelInEx = camelPartition[0];
				  return v;
			  }
		  });
		  market = marketPartition[1].concat(playerPartition[0]).concat(camelInEx);
	  }
	  returnValue.sceneType = 'turnOver';
	  returnValue.market = market;
	  returnValue.players = players;
	  unselectAllCard(returnValue);
      broadcast(returnValue);
  });

  socket.on('turnOver', function(msg){
	  console.log('player ' + id + ' turnOver');
	  if (msg && msg.player) {
		  var leftCard = _.reject(msg.player.currentCard, function(v){return v.isSelect === true});
		  _.map(players, function(v){
			  if (v.id === msg.player.id) {
				  player.currentCard = leftCard;
				  return player;
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
  
  socket.on('roundOver', function(msg){
	  console.log('roundOver');
	  console.log(msg);
	  returnValue.sceneType = 'gaming';
	  var sum0 = _.reduce(msg.players[0].signs, function(mem, v){
		  mem += _.reduce(v.values, function(aMem, value){aMem += value;return aMem;}, 0);
		  return mem;
	  }, 0);
	  var sum1 = _.reduce(msg.players[1].signs, function(mem, v){
		  mem += _.reduce(v.values, function(aMem, value){aMem += value;return aMem;}, 0);
		  return mem;
	  }, 0);
	  var camel0 = _.reduce(msg.players[0].currentCard, function (mem,v){if (v.type === 7){mem++;}return mem;}, 0);
	  var camel1 = _.reduce(msg.players[1].currentCard, function (mem,v){if (v.type === 7){mem++;}return mem;}, 0);
	  if (camel0 > camel1) {
	      sum0 += 5;
	  } else if (camel1 < camel0) {
	      sum1 += 5;
	  }
	  if (sum0 > sum1) {
	      msg.players[0].winSign += 1;
		  if (msg.players[0].winSign === 2) {
			  returnValue.sceneType = 'gameOver';
		  }
	      returnValue.turn = msg.players[1].id;
	  } else if (sum0 < sum1) {
		  msg.players[1].winSign += 1;
		  if (msg.players[1].winSign === 2) {
			  returnValue.sceneType = 'gameOver';
		  }
	      returnValue.turn = msg.players[0].id;
	  }
	  returnValue.players = msg.players;
	  initCards();
	  initSigns();
	  returnValue.cards = cards;
	  returnValue.players[0].currentCard = [];
	  zeroSign(returnValue.players[0]);
	  returnValue.players[1].currentCard = [];
	  zeroSign(returnValue.players[1]);
	  for (var i = 0; i < 5; i++) {
	      returnValue.players[0].currentCard.push({type:cards.pop().type, isSelect:false});
		  returnValue.players[1].currentCard.push({type:cards.pop().type, isSelect:false});
	  }
	  returnValue.market = [{type:7, isSelect:false},{type:7, isSelect:false},{type:7, isSelect:false},{type:cards.pop().type, isSelect:false},{type:cards.pop().type, isSelect:false}];
	  returnValue.signs = signs;
      broadcast(returnValue);
  });

  socket.on('disconnect', function(){
      console.log('player ' + id + ' disconnect');
      playerPosition[position] = 0;
      playerNumber--;
      players = _.filter(players, function(v){
	      return v.id != id;
      });
      _.map(players, function(v) {
	      v.state = 'logined';
      });
      returnValue.sceneType = 'preparing';
      returnValue.players = players;
	  returnValue.turn = undefined;
      broadcast(returnValue);
  });

  socket.on('close', function(){
      console.log('bbb');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

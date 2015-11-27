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
	signs.push(new Sign("皮革", 4, [4]));//,3,2,1,1,1,1,1,1]));	
	signs.push(new Sign("香料", 5, [5]));//,3,3,2,2,1,1]));	
	signs.push(new Sign("布匹", 6, [5]));//,3,3,2,2,1,1]));
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
      returnValue.sceneType = 'ready';
      returnValue.players = players;
      broadcast(returnValue);
  });

  socket.on('ready', function (){
      console.log('player ' + id + ' ready');
      _.map(players, function(v){
	      if (v.id == id) {
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
		  returnValue.market = [{type:7, isSelect:false},{type:7, isSelect:false},{type:7, isSelect:false},{type:cards.pop().type, isSelect:false},{type:cards.pop().type, isSelect:false}];
		  returnValue.signs = signs;
		  returnValue.turn = _.sample(players).id;
      }
      returnValue.players = players;
      broadcast(returnValue);
  });

  socket.on('sell', function(msg){
	  console.log('player ' + id + ' sell');
	  console.log(msg);
	  returnValue.sceneType = 'turnOver';
	  returnValue.market = msg.market;
	  returnValue.players = msg.players;
	  returnValue.signs = msg.signs;
	  _.map(returnValue.market, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[0].currentCard, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[1].currentCard, function(v){v.isSelect = false;return v});
      broadcast(returnValue);
  });

  socket.on('getOne', function(msg){
	  console.log('player ' + id + ' get one');
	  console.log(msg);
	  returnValue.sceneType = 'turnOver';
      msg.market.push({type:cards.pop().type, isSelect:false})
	  returnValue.market = msg.market;
	  returnValue.players = msg.players;
	  _.map(returnValue.market, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[0].currentCard, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[1].currentCard, function(v){v.isSelect = false;return v});
      broadcast(returnValue);
  });

  socket.on('exchange', function(msg){
	  console.log('player ' + id + ' exchange');
	  console.log(msg);
	  returnValue.sceneType = 'turnOver';
	  returnValue.market = msg.market;
	  returnValue.players = msg.players;
	  _.map(returnValue.market, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[0].currentCard, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[1].currentCard, function(v){v.isSelect = false;return v});
      broadcast(returnValue);
  });

  socket.on('getAllCamel', function(msg){
	  console.log('player ' + id + ' get all camel');
	  console.log(msg);
	  returnValue.sceneType = 'turnOver';
	  returnValue.market = msg.market;
	  if (returnValue.market.length < 5) {
	      var length = returnValue.market.length;
	      for (var i = 0; i < 5 - length; i++) {
		      returnValue.market.push({type:cards.pop().type, isSelect:false})
		  }
	  }
	  returnValue.players = msg.players;
	  _.map(returnValue.market, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[0].currentCard, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[1].currentCard, function(v){v.isSelect = false;return v});
      broadcast(returnValue);
  });

  socket.on('turnOver', function(msg){
	  console.log('player ' + id + ' turnOver');
	  console.log(msg);
	  returnValue.sceneType = 'gaming';
	  returnValue.turn = returnValue.turn % 2 + 1;
	  returnValue.market = msg.market;
	  returnValue.players = msg.players;
	  _.map(returnValue.market, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[0].currentCard, function(v){v.isSelect = false;return v});
	  _.map(returnValue.players[1].currentCard, function(v){v.isSelect = false;return v});
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
      returnValue.sceneType = 'ready';
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

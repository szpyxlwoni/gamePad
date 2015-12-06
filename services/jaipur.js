var _ = require('underscore');

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

var Player = function(id, state, socketId) {
	this.id = id;
	this.state = state;
	this.socketId = socketId;
	this.signs = [];
	this.winSign = 0;
	this.mostCamel = 0;
	this.goods = 0;
	this.award = [];
}

function zeroSign(player) {
	this.goods = 0;
	this.award = [];
}

function initCards() {
	cards = [];
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
}

function initSigns() {
	signs = [];
	signs.push(new Sign("钻石", 1, [7,7,5,5,5]));
	signs.push(new Sign("黄金", 2, [6,6,5,5,5]));	
	signs.push(new Sign("白银", 3, [5,5,5,5,5]));
	signs.push(new Sign("布匹", 6, [4,3,2,1,1,1,1,1,1]));	
	signs.push(new Sign("香料", 5, [5,3,3,2,2,1,1]));	
	signs.push(new Sign("丝绸", 4, [5,3,3,2,2,1,1]));
	signs.push(new Sign("3张牌的奖励", 8, _.shuffle([3,3,2,2,2,1,1])));
	signs.push(new Sign("4张牌的奖励", 9, _.shuffle([4,4,5,5,6,6])));
	signs.push(new Sign("5张牌的奖励", 10, _.shuffle([8,8,9,10,10])));
	signs.push(new Sign("最多骆驼的奖励", 7, 5));
}

function connect(io) {
var broadcast = function(msg){
	_.each(players, function(v){
	    var socket = _.findWhere(io.sockets, {id:v.socketId});
		if (socket) {
		    msg.playerId = v.id;
		    socket.emit('return.state', msg);
		}
	});
};
 return function (socket) {
	var position = _.findIndex(playerPosition, function (v){
	    return v == 0;
	});
	var id = position + 1;
	if (position == -1) {
		return;
	}
	socket.on('join', function(msg){
		console.log('player ' + id + ' join');
	    playerNumber++;
		playerPosition[position] = 1;
		players.push(new Player(id, 'joined', socket.id));
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
		if (players.length === 2 && !_.findWhere(players, {state:'joined'})) {
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
	  var playerPartition = _.partition(updatedPlayer.currentCard, function(v){return v.isSelect === true && v.type !== 7});
	  for (var i = 0; i < playerPartition[0].length; i++) {
	      var sign = _.findWhere(signs, {type:playerPartition[0][i].type});
		  if (sign.values.length > 0) {
		      updatedPlayer.goods += sign.values.shift();
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
          var value = sign.values.shift()
		  updatedPlayer.award.push(value);
	  }
	  updatedPlayer.currentCard = playerPartition[1];
	  _.map(players, function (v) {
		  if (v.id === updatedPlayer.id) {
			  v.currentCard = updatedPlayer.currentCard;
			  v.goods = updatedPlayer.goods;
			  v.award = updatedPlayer.award;
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
	      v.state = 'joined';
      });
      returnValue.sceneType = 'preparing';
      returnValue.players = players;
	  returnValue.turn = undefined;
      broadcast(returnValue);
  });

  socket.on('close', function(){
      console.log('bbb');
  });
}
}

exports.connect = connect;

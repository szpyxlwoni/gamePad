var express = require('express');
var _ = require('underscore');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io').listen(9000);

var jaipurServer = io.of('/jaipurServer');
var jaipurService = require('./services/jaipur');
var userService = require('./services/user');
var gameService = require('./services/game');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
	if (req.cookies && req.cookies.gamer_token) {
		var token = req.cookies.gamer_token;
		userService.getUserFromToken(token, function(user) {
			req.user = user;
		});
	}
	next();
});

app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/html/index.html');
});

app.get('/games', function(req, res) {
	gameService.getGames(function(err, result) {
		if (err) {
			res.status(500).send(err.message);
		} else {
			res.json(result);
		}
	});
});

app.get('/rooms/:domain', function(req, res) {
	if (req.params.domain === 'jaipur') {
		return res.json(_.reject(jaipurService.rooms, function (v) {return v.state === 'end'}));
	}
	res.json({});
});

app.get('/room/:domain/:roomId', function(req, res) {
	if (req.params.domain === 'jaipur') {
		var roomData = jaipurService.rooms[(parseInt(req.params.roomId) - 1)];
		return res.json(roomData);
	}
	res.json({});
});

app.post('/register', function(req, res) {
	if (!req.body) return res.sendStatus(400);
	var user = req.body;
	userService.addUser(user, function(errMessage, state, result) {
		if (state === 0) {
			res.status(500).send(errMessage);
		} else if (state === 1) {
			res.json({
				state: 1,
				token: result
			});
		} else if (state === 2) {
			res.json({
				state: 2
			});
		}
	});
});

app.post('/login', function(req, res) {
	if (!req.body) return res.sendStatus(400);
	userService.login(req.body, function(errMessage, state, result) {
		if (state === 0) {
			res.status(500).send(errMessage);
		} else if (state === 1) {
			res.json({
				state: 1,
				token: result
			});
		} else {
			res.json({
				'state': state
			});
		}
	});
});

jaipurServer.on('connect', jaipurService.connect(jaipurServer));

http.listen(3000, function() {
	console.log('listening on *:3000');
});


var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io').listen(9000);

var jaipurServer = io.of('/jaipurServer');
var jaipurService = require('./services/jaipur');
var userMapper = require('./mappers/userMapper');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

app.get('/', function(req, res){
    res.sendfile(__dirname + '/public/html/index.html');
});

app.post('/register', function(req, res){
	if (!req.body) return res.sendStatus(400);
	if (!req.body) {
	    return res.sendStatus(500);
	}
	var user = req.body;
	userMapper.addUser(user, res);
});

jaipurServer.on('connect', jaipurService.connect(jaipurServer));

http.listen(3000, function(){
    console.log('listening on *:3000');
});

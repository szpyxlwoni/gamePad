var async = require('async');
var crypto = require('crypto');
var md5 = crypto.createHash('md5');
var userMapper = require('../mappers/userMapper');

function addUser(user, resultCallback) {
	async.waterfall([
		function (callback) {
		    return userMapper.getUser(user, callback);
		},
		function (result, callback) {
		    if (result) return resultCallback(null, 2);

			user.password = md5.update(user.password).digest('hex');
			return userMapper.addUser(user, callback);
		},
		function (user, callback) {
		    return userMapper.getSession({userId:user.id}, callback);
		},
		function (session, callback) {
		    if (session.token) return resultCallback(null, 1, session.token);

			session.token = crypto.randomBytes(16).toString('hex');
			console.log(session);
		    return userMapper.addSession(session, function(err, newSession) {
				if (err) return callback(err.message);

				return resultCallback(null, 1, newSession.token);
			});
		}
	], function (err, result) {
	    return resultCallback(err.message, 0);
	});
}

function getUserFromToken(token, resultCallback) {
    async.waterfall([
		function (callback) {
		    userMapper.getSession({'token':token}, callback);
		},
		function (session, callback) {
		    if (!session.userId) return resultCallback(null, 2);

			userMapper.getUserFromId(session.userId, function(err, user){
				if (err) return callback(err);

				resultCallback(user);
			});
		}
	], function (err, result) {
	    return resultCallback(err.message, 0);
	});
}

function login(user, resultCallback) {
    async.waterfall([
		function (callback) {
		    userMapper.getUser(user, callback);
		},
		function (dbUser, callback) {
		console.log(dbUser);
		    if (!dbUser) return resultCallback(null, 2);
		    if (dbUser.credential !== md5.update(user.password).digest('hex')) return resultCallback(null, 3);

			userMapper.getSession({'userId':dbUser.id}, function(err, session){
				console.log(dbUser.id);
				if (err) return callback(err);

				resultCallback(null, 1, session.token);
			});
		}
	], function (err, result) {
	    return resultCallback(err.message, 0);
	});
}

exports.addUser = addUser;
exports.getUserFromToken = getUserFromToken;
exports.login = login;

var async = require('async');
var pool = require('./connect');

var getUserFromPrincipalSQL = 'SELECT COUNT(1) AS count FROM user WHERE principal = ?';

function addUser(user, response) {
	async.waterfall([
		function (callback) {
	        pool.query(getUserFromPrincipalSQL, [user.username], function(err, res) {
		        if (err) callback(err);

				callback(null, res[0].count);
	        });
		},
		function (resultCount, callback) {
		    if (resultCount > 0) {
			    return response.json({state : 2});
			}
			pool.query('INSERT INTO user(name, principal, credential) VALUES(?, ?, ?)', [user.username, user.username, user.password], function (err, res) {
				if (err) callback(err);

				return response.json({state : 1});
			});
		}
	], function (err, result) {
	    response.status(500).send(err.message);
	});
}

exports.addUser = addUser;

var pool = require('./connect');

var insertSQL = 'insert into t_user(name) values("conan"),("fens.me")';
var selectSQL = 'select * from t_user limit 10';
var deleteSQL = 'delete from t_user';
var updateSQL = 'update t_user set name="conan update"  where name="conan"';

function addUser(user, response) {
	pool.query('SELECT COUNT(1) AS count FROM user WHERE principal = ?', [user.username], function(err, res) {
		if (err) return response.status(500).send(err.message);
		if (res[0].count > 0) return response.json({state : 2});
	    pool.query('INSERT INTO user(name, principal, credential) VALUES(?, ?, ?)', [user.username, user.username, user.password], function (err, res) {
		    if (err) return response.status(500).send(err.message);

		    return response.json({state : 1});
	    });
	});
}

function getUserFromName(user, response) {
	pool.query('SELECT name, principal, credential FROM user WHERE principal = "' + user.username + '"', function(err, res) {
		if (err) {
		    return response.sendStatus(500);
		}

		response.json({state:1});
	});
}

exports.addUser = addUser;

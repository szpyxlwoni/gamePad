var pool = require('./connect');

function addUser(user, callback) {
    pool.query('INSERT INTO user(name, principal, credential) VALUES(?, ?, ?)',
	    [user.username, user.username, user.password], function (err, res) {
		if (err) return callback(err);

		user.id = res.insertId;
		return callback(null, user);
	});
}

var selectUser = "SELECT id, name, principal, credential, state, room_id as roomId FROM user"

function getUser(user, callback) {
	pool.query(selectUser + " WHERE principal = ?", [user.username], function(err, res) {
		if (err) return callback(err);

		return callback(null, res[0]);
    });
}

function getUserFromId(userId, callback) {
	pool.query(selectUser + " WHERE id = ?", [userId], function(err, res) {
		if (err) return callback(err);

		return callback(null, res[0]);
    });
}

function updateUser(user, callback) {
	var updateSQL = "UPDATE user SET";
	var queryArray = [];
	var queryStr = []
	var query = "";
	if (user.name) {
		queryStr.push("name = ?");
		queryArray.push(user.name);
	}
	if (user.username) {
		queryStr.push("principal = ?");
		queryArray.push(user.username);
	}
	if (user.password) {
		queryStr.push("cridential = ?");
		queryArray.push(user.password);
	}
	if (user.state) {
		queryStr.push("state = ?");
		queryArray.push(user.state);
	}
	if (user.roomId) {
		queryStr.push("roomId = ?");
		queryArray.push(user.roomId);
	}
	if (queryStr.length > 1) {
		query = queryStr.join(",");
	} else if (queryArray.length === 1) {
		query = queryStr[0];
	}
	pool.query(updateSQL + query + " WHERE id = " + user.id, queryArray, function(err, res) {
		if (err) return callback(err);

		return callback(null, res);
    });
}

function getSession(session, callback) {
	var selectSQL = "SELECT token, user_id as userId, create_time as createTime FROM session";
	var queryArray = [];
	var queryStr = []
	var query = "";
	if (session.userId) {
		queryStr.push("user_id = ?");
		queryArray.push(session.userId);
	}
	if (session.token) {
		queryStr.push("token = ?");
		queryArray.push(session.token);
	}
	if (queryStr.length > 1) {
		query = " WHERE " + queryStr.join(" AND ");
	} else if (queryArray.length === 1) {
		query = " WHERE " + queryStr[0];
	}
	pool.query(selectSQL + query, queryArray, function(err, res) {
		if (err) return callback(err);

		if (res.length > 0) {
		    return callback(null, res[0]);
		} else {
		    return callback(null, session);
		}
    });
}

function addSession(session, callback) {
	var insertSQL = "INSERT INTO session(token, user_id, create_time) VALUES(?, ?, now())";
	pool.query(insertSQL, [session.token, session.userId], function(err, res) {
			console.log(err);
		if (err) return callback(err);

		return callback(null, session);
    });
}

exports.addUser = addUser;
exports.getUser = getUser;
exports.getSession = getSession;
exports.addSession = addSession;
exports.getUserFromId = getUserFromId;

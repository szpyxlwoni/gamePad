var pool = require('./connect');

function getGames(callback) {
	pool.query('SELECT * FROM game', function(err, games) {
		if (err) callback(err);

		callback(null, games);
	});
}

exports.getGames = getGames;

var mysql = require('mysql');

var pool  = mysql.createPool({
	connectionLimit : 10,
	host            : 'localhost',
	user            : 'gamer',
	password        : '1qaz!QAZ',
	database        : 'gamePad'
});

pool.config.queryFormat = function (query, values) {
	if (!values) return query;
	    return query.replace(/\:(\w+)/g, function (txt, key) {
	if (values.hasOwnProperty(key)) {
	    return this.escape(values[key]);
	}
        return txt;
    }.bind(this));
};

module.exports = pool;

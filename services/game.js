var gameMapper = require('../mappers/gameMapper');

var getGames = function (callback) {
    gameMapper.getGames(callback);
}

exports.getGames = getGames;

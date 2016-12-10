const config = require('../config.json');

module.exports = (userId, nameStream) => {

    return `${userId}-${nameStream}_${new Date().toISOString()}`;
};
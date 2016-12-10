const config = require('../config.json');

module.exports = (userId, nameStream) => {

    return `${config.dirname}${userId}/${nameStream}/data`;
};
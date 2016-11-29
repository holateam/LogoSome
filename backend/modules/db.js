const mongoose = require('mongoose');
const config = require('../config.json');
const log = require('winston');

mongoose.connect(config.mongoose.urli, (err) => {
    if (err) {
        log.error(`Error: ${err.toString()}`);
    } else {
        log.info(`Connection db hola ${config.mongoose.urli}`);
    }
});

module.exports.db = mongoose.connection;




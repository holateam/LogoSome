const mongoose = require('mongoose');
const config = require('../config.json');


mongoose.connect(config.mongoose.urli, (err) => {
    if (err) {
        console.log(`Error: ${err.toString()}`);
    } else {
        console.log(`Connection db hola ${config.mongoose.urli}`);
    }
});

module.exports.db = mongoose.connection;




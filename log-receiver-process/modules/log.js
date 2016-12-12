const winston = require('winston');

module.exports = (module) => {
    return makeLogger(module.filename);
};

function makeLogger (path) {
    // if(path.match(/log-receiver-process.js$/)){
    if(true){
        let transports = [
            new winston.transports.Console({
                timestamp: true,
                colorize: true,
                level: 'debug'
            }),
            new winston.transports.File({filename:'debug.log', leve: 'debug'})
        ];
        return new winston.Logger({transports: transports});
    } else {
        return new winston.Logger({transports:[]});
    }
}
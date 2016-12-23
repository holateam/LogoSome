'use strict';


const logger = require('winston');

let infoLogger = new logger.Logger({
    levels: {
        info: 0
    },
    transports: [
        new (logger.transports.File)({
            filename: __dirname + '/../logs/info.log',
            level: 'info',
            json: false,
            formatter: formatter
        }),
        new (logger.transports.Console)({
            level: 'info'
        })
    ]
});

let debugLogger = new logger.Logger({
    levels: {
        debug: 0
    },
    transports: [
        new (logger.transports.File)({
            filename: __dirname + '/../logs/debug.log',
            level: 'debug',
            json: false,
            formatter: formatter
        }),
        new (logger.transports.Console)({
            level: 'debug'
        })
    ]
});

let errorLogger = new logger.Logger({
    levels: {
        error: 2
    },
    transports: [
        new (logger.transports.File)({
            filename: __dirname + '/../logs/error.log',
            level: 'error',
            json: false,
            formatter: formatter
        }),
        new (logger.transports.Console)({
            level: 'error'
        })
    ]
});

function formatter(options) {
    return new Date().toString() + ' '+ options.level.toUpperCase() +' >>> '+ (undefined !== options.message ? options.message : '') +
        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta, null, 2) : '' );
}

module.exports = {
    error: ()=> function(){
        errorLogger.error.apply(this, arguments);
    },
    info: function() {
        infoLogger.info.apply(this, arguments);
    },
    debug: function() {
        debugLogger.debug.apply(this, arguments);
    }
};
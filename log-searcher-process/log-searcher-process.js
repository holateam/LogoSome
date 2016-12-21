// searchInFiles(5000, filesGetter, undefined, "*", 0, 100, f)
// function searchInFiles(heartbeatInterval, filenameGetterFunc,
//                        startFromLogfile?null, filter, skipLinesCount, limit, updatesHandler) {
//     //... X:
//     function gotoNextFile() {
//         filename = filenameGetterFunc(filename);
//         if (filename == undefined)
//             return updatesHandler(true, ...); // end of search
//
//         searchInFile(heartbeatInterval, filename, filter, skipLinesCount, limit~,
//             function(fileFinished, loglines, lastlineindex) {
//                 updatesHandler(false, filename, loglines, lastlineindex);
//                 limit -= loglines.length;
//                 if (fileFinished) {
//                     gotoNextFile();
//                 }
//             })
//     }
//
//
//     gotoNextFile();
//     //...
//     return {
//         stop: function() {
//             //...
//         }
//     }
// }
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const logSearcher = require("./modules/logSearcher.js");
const log = require("./modules/logger.js");
const config = require("./config.json");


let runSearcherProcess = (port) => {
    http.listen(port, () => {
        logger.info(`server is running on port ${port}`);
    });

    app.use(express.static(__dirname + '/'));

    io.on('connection', (socket) => {
        log.info(`connection have been established: socket id: ${socket.id}`);

        let searcherInstance = {};
        let callBack = (messageForAggregator) => {
            log.debug('return from searcher instance: ', messageForAggregator);
            return () => socket.emit("logs", (messageForAggregator));
        };

        socket.on('getLogs', (params) => {
            params.cb = callBack;
            params.logger = log;
            log.info(`user: ${params.userId} start new searcher for ${params.streamId}`);
            searcherInstance = new logSearcher(params);
            searcherInstance.getOlderLogs(params.limit);
            searcherInstance.liveModeOn();
        });

        socket.on('moreLogs', (params) => {
            if (params.direction == "older") {
                searcherInstance.getOlderLogs(params.limit);
            } else if (params.direction == "newer") {
                searcherInstance.getNewerLogs(params.limit);
            }
        });

        socket.on("live", (params) => {
            if (params.live) {
                searcherInstance.liveModeOn();
            } else {
                searcherInstance.liveModeOff();
            }
        });
    });
};

runSearcherProcess(config.searcher.port);


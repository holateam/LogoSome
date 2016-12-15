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
const mainSearcher = require("mainSearcher.js");
const config = require("config.json");

const options = {
    port: 4000,
};

let runSearcherProcess = (port) => {
    http.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });

    app.use(express.static(__dirname + '/'));

    io.on('connection', (socket) => {
        console.log('connection have been established');
        let searcherInstance = {};
        let callBack = (messageForAggregator) => {
             return () => socket.emit("logs", (messageForAggregator));
        };

        socket.on('getLogs', (params) => {
            params.cb = callBack;
            params.receiver = getReceiverAdress();
            searcherInstance = new mainSearcher(params);
        });
    });
};

let getReceiverAdress = () => {
    return config.receiver;
};

runSearcherProcess(options.port);


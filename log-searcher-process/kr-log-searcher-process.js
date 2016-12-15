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

options = {
    port: 4000,
};

let runSearcherProcess = (port) => {
    http.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });

    app.use(express.static(__dirname + '/'));

    io.on('connection', (socket) => {
        console.log('connection have been established');

        let callBack = () => {
            return socket.emit("logs", (pararms));
        };

        socket.on('getLogsWithNewFilter', (params) => {
            params.cb = callBack;
            createSearcherInstancePairWithParams(params);
        });
    });
};

let createSearcherPairWithParams = (params) => {
    let searchersArr = [];
    let newerDirectionSearcher = createSearcherInsatanceWithParams(params, "newer");
    let olderDirectionSearcher = createSearcherInsatanceWithParams(params, "older");
    arr.push(newerDirectionSearcher);
    arr.push(olderDirectionSearcher);
    runSearcherInstances(searchersArr);
};

let createSearcherInsatanceWithParams = (params, stringDirection) => {
    let searcherInstance = {};
    searcherInstance.params = params;
    searcherInstance.params.direction = stringDirection;

    return searcherInstance;
};

let runSearcherInstances = (instancesArr) => {
    instancesArr.forEach((instance) => run(instance));
};

function runInstance(instance, host, port) {
    const socket = require('socket.io-client')(`http://${host}:${port}`);
    socket.connect(RECEIVER_PORT, RECEIVER_PORT);

    socket.on('connect', () => {
        socket.emit("getLogs", params);

        socket.on("receiver heart beat", (res) => {
            params.cb();

            if (res.noMoreLogs) {
                searchInFiles(instance, params);
            }
        });
    });

    return socket;
}

runSearcherProcess(options.port);


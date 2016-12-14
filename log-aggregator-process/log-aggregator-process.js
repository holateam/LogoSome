let express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const REQUEST = require('request');
const CONFIG = require('./config.json');

io.on('connection', function (socket) {
    let agregator = null;

    socket.on('init', function (data) {
        console.log(data);
        REQUEST
            .post({
                url: `http://${CONFIG.backend.host}:${CONFIG.backend.port}/service/api/v1/getUser`,
                form: {
                    token: data.token
                }
            })
            .on('response', function (response) {
                if (response.statusCode == 200) {
                    response.setEncoding('utf8');
                    response.on('data', (result) => {
                        let userInfo = JSON.parse(result);
                        // let aresult = JSON.parse(result);
                        agregator = createAggregator(userInfo.data._id, userInfo.data.streams, data.filter, 100, 2000, "older", function (logsForSend, direction) {
                            io.emit("Logs", logsForSend, direction);
                        });
                    });
                }
            });
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('pauseLive', function () {

    });

    socket.on('resumeLive', function () {

    });

    socket.on("getFilteredLogs", function (filter) {
        console.log("get filtered logs" + filter);
    });

    socket.on("getMoreNewLogs", function () {
        console.log("get new logs");
    });

    socket.on("getLogs", function (direction) {
        console.log("getLogs!", direction);
        agregator.getLogs(direction);
    });

});


http.listen(3006, function () {
    console.log('listening on *:3006');
});


function createAggregator(_id, watchedFiles, filters, limit, heartbeatInterval, direction, callback) {
    console.log(_id, watchedFiles, filters, limit, heartbeatInterval, direction);
    const TIMESTAMP_LENGTH = 24;
    let buffersForOldLogs = [];
    let buffersForNewLogs = [];
    let timestampsForOld = [];
    let timestampsForNew = [];
    let minTimestamp;
    let maxTimestamp;
    let readyToLive = [];
    let searchers = [];

    watchedFiles.forEach((streamId, streamIndex) => {
        searchers[streamIndex] = require("socket.io-client")("http://localhost:4000");

        searchers[streamIndex].emit("getLogs", {
            _id,
            streamId,
            streamIndex,
            filters,
            direction,
            limit,
            heartbeatInterval
        });

        searchers[streamIndex].on("logs", function ({streamIndex, direction, lastTimestamp, noMoreLogs, logs}) {
            if (logs && logs.length > 0) {
                let buffer = direction == "older" ? buffersForOldLogs : buffersForNewLogs;
                if (!buffer[streamIndex]) {
                    buffer[streamIndex] = [];
                }
                buffer[streamIndex].push(...logs);
            }
            if (direction == "older") {
                if (noMoreLogs || lastTimestamp)
                    timestampsForOld[streamIndex] = noMoreLogs ? 0 : lastTimestamp;

                if (timestampsForOld.length == watchedFiles.length) {
                    srez(direction);
                }
            } else if (direction == "newer") {
                if (noMoreLogs || lastLine)
                    timestampsForNew[streamIndex] = noMoreLogs ? new Date(Date.now() + 86400000).getTime() : lastTimestamp;
                if (noMoreLogs) {
                    readyToLive[streamIndex] = true;
                    startLiveMode();
                }
                if (timestampsForNew.length == watchedFiles.length) {
                    srez(direction);
                }
            }
        });
    });

    function startLiveMode() {
        let startLive = readyToLive.reduce((prev, cur) => {
            return prev && cur;
        }, true);

        if (startLive) {
            searchers.forEach(function (searcher, streamIndex) {
                searcher.emit('live', {id, streamId: watchedFiles[streamIndex], streamIndex, filters})
            })
        }
    }

    function srez(direction) {
        if (direction == "older") {
            let newMinTimestamp = timestampsForOld.reduce((prev, cur) => {
                return prev > cur ? prev : cur
            });
            if (!minTimestamp || newMinTimestamp < minTimestamp) {
                minTimestamp = newMinTimestamp;
                let indexesOfNextAfterMinTimestamp = buffersForOldLogs.map(bufferOfOneFile => {
                    return bufferOfOneFile.findIndex(nextAfterMinTimestamp)
                });
                let logsFromBuffer = buffersForOldLogs.map((bufferOfOneFile, bufferIndex) => {
                    let index = indexesOfNextAfterMinTimestamp[bufferIndex] !== -1 ? indexesOfNextAfterMinTimestamp[bufferIndex] : Number.MAX_VALUE;
                    return bufferOfOneFile.splice(0, index);
                });
                let logsForSend = [];
                logsFromBuffer.forEach(function (buff) {
                    logsForSend.push(...buff);
                });
                logsForSend.sort(timestampComparator);
                callback(logsForSend, direction);
            }
        } else if (direction == "newer") {
            let newMaxTimestamp = timestampsForNew.reduce((prev, cur) => {
                return prev < cur ? prev : cur
            });
            if (!maxTimestamp || newMaxTimestamp > maxTimestamp) {
                maxTimestamp = newMaxTimestamp;
                let indexesOfNextAfterMaxTimestamp = buffersForNewLogs.map(bufferOfOneFile => {
                    return bufferOfOneFile.findIndex(nextAfterMaxTimestamp)
                });
                let logsFromBuffer = buffersForOldLogs.map((bufferOfOneFile, bufferIndex) => {
                    let index = indexesOfNextAfterMinTimestamp[bufferIndex] !== -1 ? indexesOfNextAfterMinTimestamp[bufferIndex] : Number.MAX_VALUE;
                    return bufferOfOneFile.splice(0, index);
                });
                let logsForSend = [];
                logsFromBuffer.forEach(function (buff) {
                    logsForSend.push(...buff);
                });
                logsForSend.sort(timestampComparator);
                callback(logsForSend, direction);
            }
        }
    }

    function nextAfterMaxTimestamp(log) {
        return logToTimestamp(log) > maxTimestamp;
    }

    function nextAfterMinTimestamp(log) {
        return logToTimestamp(log) < minTimestamp;
    }

    function logToTimestamp(log) {
        return +new Date(log.substr(0, TIMESTAMP_LENGTH))
    }

    function timestampComparator(firstLog, secondLog) {
        if (logToTimestamp(firstLog) < logToTimestamp(secondLog)) {
            return -1;
        } else if (logToTimestamp(firstLog) > logToTimestamp(secondLog)) {
            return 1;
        } else {
            return 0;
        }
    }

    return {
        getLogs: function (direction) {
            searchers.forEach(function (searcher) {
                if (searcher) {
                    searcher.emit("moreLogs", {id, direction});
                }
            })
        },
        live: function (status) {
            searchers.forEach(function (searcher) {
                if (searcher) {
                    searcher.emit("live", status);
                }
            })
        }
    }
}


const log = require('./log')(module);
const tcp = require('net');
const request = require('request');
const saveInFile = require('./saveInFile');
const generationDirnameStr = require('./generationDirnameStr');
const generationNameFileStr = require('./generationNameFileStr');
const config = require('../config.json');


module.exports = function logProcessor(user) {

    let bufferArrays = createBufferArrays(user);
    let userId = user._id;
    let host = user.host;
    let port = user.port;
    let maxSizeFile = 100;
    let liveListenersLogs = [];

    this.searchInBufferNewLogs = (userId, streamId, filters,
                                  bufferName, startLineNumber, directionPast, limit, callback) => {
        let arrayLogs = [];

        if (bufferArrays[streamId].namefile && bufferArrays[streamId].bufferArray.length
            && (bufferArrays[streamId].namefile === bufferName || !bufferName)) {
            let countLine = startLine = (startLineNumber) ? (startLineNumber + 1) : 0;
            for (; countLine < bufferArrays[streamId].bufferArray.length; countLine++) {
                if (arrayLogs.length !== limit) {
                    if (bufferArrays[streamId].bufferArray[countLine].indexOf(filters)) {
                        arrayLogs.push(bufferArrays[streamId].bufferArray[countLine]);
                    }
                } else {
                    break;
                }
            }

            callback(
                {
                    err: false,
                    data: {
                        streamId: streamId,
                        bufferName: bufferArrays[streamId].namefile,
                        startLineNumber: startLine,
                        finishLineNumber: countLine - 1,
                        lastTimestamp: getTimestamp(bufferArrays[streamId].bufferArray[countLine - 1]),
                        noMoreLogs: (countLine >= bufferArrays[streamId].bufferArray.length),
                        direction: directionPast,
                        logs: arrayLogs
                    }
                }
            );

        } else {
            callback({err: true, data: {}});
        }


    };
    this.searchInBufferOldLogs = (userId, streamId, filters,
                                  bufferName, startLineNumber, directionPast, limit, callback) => {

        let arrayLogs = [];

        if (bufferArrays[streamId].namefile && bufferArrays[streamId].bufferArray.length
            && (bufferArrays[streamId].namefile === bufferName || !bufferName)) {
            let countLine = startLine = (startLineNumber) ? (startLineNumber - 1) : bufferArrays[streamId].bufferArray.length - 1;
            for (; countLine >= 0; countLine--) {
                if (arrayLogs.length !== limit) {
                    if (bufferArrays[streamId].bufferArray[countLine].indexOf(filters)) {
                        arrayLogs.push(bufferArrays[streamId].bufferArray[countLine]);
                    }
                } else {
                    break;
                }
            }

            callback(
                {
                    err: false,
                    data: {
                        streamId: streamId,
                        bufferName: bufferArrays[streamId].namefile,
                        startLineNumber: startLine,
                        finishLineNumber: countLine + 1,
                        lastTimestamp: "",//getTimestamp(bufferArrays[streamId].bufferArray[countLine]),
                        noMoreLogs: (countLine <= 0),
                        direction: directionPast,
                        logs: arrayLogs
                    }
                }
            );

        } else {
            callback({err: true, data: {}});
        }


    };
    this.live = (streamId, filter, live, callback) => {
        return liveListenersLogs.push({
            streamId: streamId,
            filter: filter,
            callback: callback
        });
    };
    this.liveOff = (streamId, liveListenerId, callback) => {
        liveListenersLogs[liveListenerId] = null;
        callback({err: false, live: false});
    };

    runServerTCP(host, port);

    function runServerTCP(host, port) {
        let server = tcp.createServer();
        server.on('connection', socket => {
            socket.on('data', data => {
                saveLogs(data);
            });
        });

        server.listen(port, host, () => {
            log.info(`Server TCP user run: ${host}:${port}`);
        });
    }

    function saveLogs(data) {

        data.toString().split('\n').forEach(line => {

            let nameStream = line.toString().split(' ')[3];

            if (!bufferArrays[nameStream]) {
                bufferArrays[nameStream] = {
                    namefile: `${generationDirnameStr(userId, nameStream)}${generationNameFileStr(userId, nameStream)}`,
                    bufferArray: []
                };
            }

            if (line != "") {
                if (!bufferArrays[nameStream].namefile) {
                    bufferArrays[nameStream].namefile = `${generationDirnameStr(userId, nameStream)}${generationNameFileStr(userId, nameStream)}`;
                }
                let log = new Date().toISOString() + ' ' + parseToString(line);
                bufferArrays[nameStream].bufferArray.push(log);
                if (liveListenersLogs.length) {
                    liveListenersLogs.forEach(listener => {
                        if (listener.streamId == nameStream) {
                            listener.callback({
                                streamId: nameStream,
                                bufferName: bufferArrays[nameStream].namefile,
                                finishLineNumber: bufferArrays[nameStream].bufferArray.length,
                                lastTimestamp: getTimestamp(log),
                                logs: log
                            });
                        }
                    });
                }
            }

            if (bufferArrays[nameStream].bufferArray.length >= maxSizeFile) {
                let buffer = JSON.parse(JSON.stringify(bufferArrays[nameStream].bufferArray));
                let nameFile = bufferArrays[nameStream].namefile;
                bufferArrays[nameStream] = false;

                saveInFile(userId, nameStream, nameFile, buffer, (address) => {

                    request
                        .post({
                            url: `http://${config.backend.host}:${config.backend.port}/service/api/v1/saveTheInfoOfFile`,
                            form: {
                                userId: userId,
                                nameStream: nameStream,
                                namefile: address,
                                linesNumber: buffer.length
                            }
                        })
                        .on('response', function (response) {
                            if (response.statusCode == 200) {
                                response.setEncoding('utf8');
                                response.on('data', (result) => {
                                });
                            }
                        });
                });
            }


        });
    }

    function createBufferArrays(user) {
        return user.streams.map(i => i.name).reduce((total, currentV, index, arr) => {
            total[arr[index]] = {
                namefile: false,
                bufferArray: []
            };
            return total;
        }, {});
    }

    function getTimestamp(log) {
        return Date.parse(log.substr(0, log.indexOf(' ')));
    }

    function parseToString(line) {
        let n = 0;
        for (let i = 0; i < line.length; i++) {
            if (n != 2) {
                if (line[i] == ' ') {
                    n++;
                }
            } else {
                n = i;
                break;
            }
        }
        return line.substring(n, line.length);
    }

};
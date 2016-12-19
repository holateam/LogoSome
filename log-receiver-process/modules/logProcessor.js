const log = require('./log')(module);
const tcp = require('net');
const request = require('request');
const saveInFile = require('./saveInFile');
const generationDirnameStr = require('./generationDirnameStr');
const generationNameFileStr = require('./generationNameFileStr');
const config = require('../config.json');


module.exports = function logProcessor(user) {
    let bufferArrays = {};
    let userId = user._id;
    let host = user.host;
    let port = user.port;
    let limit = 10;
    let liveListenersLogs = [];

    this.searchInBuffer = (userId, streamId, streamIndex, filters,
                           bufferName, startLineNumber, direction, limit, callback) => {
        let countLine = startLineNumber;
        let arrayLogs = [];
        let namefile = (bufferArrays[streamId]) ? bufferArrays[streamId].namefile : false;

        if ((namefile) && (namefile == bufferName || bufferName == "")) {
            if (direction == 'newer') {
                for (let i = startLineNumber + 1; i < bufferArrays[streamId].bufferArray.length; i++) {
                    if (arrayLogs.length !== limit) {
                        countLine++;
                        if (bufferArrays[streamId].bufferArray[i].indexOf(filters)) {
                            arrayLogs.push(bufferArrays[streamId].bufferArray[i]);
                        }
                    } else {
                        break;
                    }
                }
            } else {
                for (let i = startLineNumber - 1; i >= 0; i--) {
                    if (arrayLogs.length !== limit) {
                        countLine--;
                        if (bufferArrays[streamId].bufferArray[i].indexOf(filters)) {
                            arrayLogs.push(bufferArrays[streamId].bufferArray[i]);
                        }
                    } else {
                        break;
                    }
                }
            }

            callback(
                {
                    err: false,
                    data: {
                        streamId: streamId,
                        streamIndex: streamIndex,
                        bufferName: namefile,
                        startLineNumber: startLineNumber,
                        finishLineNumber: countLine,
                        lastTimestamp: getTimestamp(arrayLogs[arrayLogs.length - 1]),
                        noMoreLogs: (arrayLogs.length - 1 == countLine || countLine == 0),
                        direction: direction,
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
    this.liveOff = (streamId, liveListenerId, cb) => {
        liveListenersLogs[liveListenerId] = null;
        cb({err: false, live: false});
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
            let nameFile = '';
            if (!bufferArrays[nameStream]) {
                bufferArrays[nameStream] = {
                    namefile: `${generationDirnameStr(userId, nameStream)}${generationNameFileStr(userId, nameStream)}`,
                    bufferArray: []
                };
            }

            if (line != "") {
                let log = new Date().toISOString() + ' ' + parseToString(line);

                console.log('Line: ' + line);
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

            if (bufferArrays[nameStream].bufferArray.length >= limit) {
                let buffer = JSON.parse(JSON.stringify(bufferArrays[nameStream].bufferArray));
                nameFile = bufferArrays[nameStream].namefile;
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
                                    console.log(JSON.stringify(result));
                                });
                            }
                        });
                });

            }


        });
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
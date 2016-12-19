'use strict';

const request = require('request');
const config = require('../config.json');
const Searcher = require('./fileSearcher.js');



class LogSearcher {
    constructor(params) {
        this.userId = params.userId;
        this.streamId = params.streamId;
        this.streamIdx = params.streamIndex;
        this.filters = params.filters;
        this.heartbeatInterval = params.heartbeatInterval;
        this.cb = params.cb;
        this.receiver = require("socket.io-client")(`http://${config.receiver.host}:${config.receiver.port}`);
        this.files = [];
        this.reverseSearcherInfo = {};
        this.forwardSearcherInfo = {};
        this.reverseFileSearcher = null;
        this.forwardFileSearcher = null;

        this.receiver.on ("oldLogs", (info)=> {
            if (!info.err) {
                if (!this.forwardSearcherInfo.bufferName) {
                    this.forwardSearcherInfo.bufferName = info.data.bufferName;
                    this.forwardSearcherInfo.lastReadLineIdx = info.data.startLineNumber;
                }
                this.reverseSearcherInfo.bufferName = info.data.bufferName;
                this.reverseSearcherInfo.limit -= info.data.logs.length;
                this.reverseSearcherInfo.lastReadLineIdx = info.data.finishLineNumber;
                this.packageAndSendLogs(info.data.logs, info.data.lastTimestamp, 'older', false);
                if (info.data.noMoreLogs && this.reverseSearcherInfo.limit > 0) {
                    this.getFilesList()
                        .then(()=> {
                            this.reverseSearcherInfo.fileIdx = this.files.length - 1;
                            this.createNewReverseFileSearcher();
                            this.reverseFileSearcher.getLogs(this.reverseSearcherInfo.limit);
                        })
                        .catch((err)=> {
                            console.log(`error: ${err}`);
                        });
                }
            } else {
                this.getFilesList()
                    .then(()=> {
                        this.initSearchInCurrentFileOnSpecificLine('reverseDirection');
                    })
                    .catch((err)=> {
                        console.log(`error: ${err}`);
                    });
            }
        });

        this.receiver.on ("newLogs", (info)=> {
            if (!info.err) {
                this.forwardSearcherInfo.bufferName = info.data.bufferName;
                this.forwardSearcherInfo.limit -= info.data.logs.length;
                this.forwardSearcherInfo.lastReadLineIdx = info.data.finishLineNumber;
                this.packageAndSendLogs(info.data.logs, info.data.lastTimestamp, 'newer', info.data.noMoreLogs);
            } else {
                this.getFilesList()
                    .then(()=> {
                        this.initSearchInCurrentFileOnSpecificLine();
                    })
                    .catch((err)=> {
                        console.log(`error: ${err}`);
                    });
            }
        });

        this.receiver.on ("liveLogs", (data)=> {
            this.forwardSearcherInfo.bufferName = data.bufferName;
            this.forwardSearcherInfo.lastReadLineIdx = data.finishLineNumber;
            this.packageAndSendLogs(data.logs, data.lastTimestamp, 'newer');
        });

    }



    getOlderLogs (limit) {
        this.reverseSearcherInfo.limit = limit;
        if (this.reverseFileSearcher) {
            this.reverseFileSearcher.getLogs(this.reverseSearcherInfo.limit);
        } else {
            this.receiver.emit("getLogs", {
                userId: this.userId,
                streamId: this.streamId,
                bufferName: this.reverseSearcherInfo.bufferName,
                filters: this.filters,
                limit: limit,
                direction: 'older',
                startLineNumber: this.reverseSearcherInfo.lastReadLineIdx});
        }

    }

    getNewerLogs (limit) {
        this.forwardSearcherInfo.limit = limit;
        if (this.forwardFileSearcher) {
            this.forwardFileSearcher.getLogs(this.forwardSearcherInfo.limit);
        } else {
            this.receiver.emit("getLogs", {
                userId: this.userId,
                streamId: this.streamId,
                bufferName: this.forwardSearcherInfo.bufferName,
                filters: this.filters,
                limit: limit,
                direction: 'newer',
                startLineNumber: this.forwardSearcherInfo.lastReadLineIdx});
        }
    }

    liveModeOn () {
        this.receiver.emit("live", {userId: this.userId, filters: this.filters, live: true})
    }

    liveModeOff () {
        this.receiver.emit("live", {userId: this.userId, filters: this.filters, live: false})
    }



    initSearchInCurrentFileOnSpecificLine (reverseDirection) {
        if (reverseDirection) {
            this.reverseSearcherInfo.fileIdx = this.getFileIdxByName(this.reverseSearcherInfo.bufferName);
            let file = this.files[this.reverseSearcherInfo.fileIdx];
            this.createNewReverseFileSearcher();
            this.reverseFileSearcher.startFromSpecifiedLine(file.size - this.reverseSearcherInfo.lastReadLineIdx, this.reverseSearcherInfo.limit);
        } else {
            this.forwardSearcherInfo.fileIdx = this.getFileIdxByName(this.forwardSearcherInfo.bufferName);
            this.createNewForwardFileSearcher();
            this.forwardFileSearcher.startFromSpecifiedLine(this.forwardSearcherInfo.lastReadLineIdx + 1, this.forwardSearcherInfo.limit);
        }
    }

    packageAndSendLogs (logs, timestamp, direction, noMoreLogs) {
        this.cb({streamIndex: this.streamIdx, direction: direction, logs: logs, lastTimestamp: timestamp, noMoreLogs: noMoreLogs});
    }

    processReverseRelevantLogs (fileEnd, logs, timestamp) {
        let noMoreLogs = false;
        this.reverseSearcherInfo.limit -= logs.length;
        if (fileEnd && this.reverseSearcherInfo.limit > 0) {
            this.reverseSearcherInfo.fileIdx--;
            if (this.reverseSearcherInfo.fileIdx < 0) {
                noMoreLogs = true;
            } else {
                this.createNewReverseFileSearcher();
                this.reverseFileSearcher.getLogs(this.reverseSearcherInfo.limit);
            }
        }
        this.packageAndSendLogs(logs, timestamp, "older", noMoreLogs);
    }

    processForwardRelevantLogs (fileEnd, logs, timestamp) {
        this.packageAndSendLogs(logs, timestamp, "newer", false);
        this.forwardSearcherInfo.limit -= logs.length;
        if (fileEnd && this.forwardSearcherInfo.limit > 0) {
            this.forwardSearcherInfo.fileIdx++;
            if (this.forwardSearcherInfo.fileIdx < this.files.length) {
                this.createNewForwardFileSearcher();
                this.forwardFileSearcher.getLogs(this.forwardSearcherInfo.limit);
            } else {
                this.getFilesList()
                    .then(()=> {
                        if (this.forwardSearcherInfo.fileIdx < this.files.length) {
                            this.createNewForwardFileSearcher();
                            this.forwardFileSearcher.getLogs(this.forwardSearcherInfo.limit);
                        } else {
                            this.receiver.emit("getLogs", {
                                userId: this.userId,
                                streamId: this.streamId,
                                bufferName: null,
                                filters: this.filters,
                                limit: this.forwardSearcherInfo.limit,
                                direction: 'newer'});
                        }
                    })
                    .catch((err)=> {
                        console.log(`ERROR: ${err}`);
                    });

            }
        }
    }


    createNewReverseFileSearcher () {
        let cb = this.processReverseRelevantLogs.bind(this);
        this.reverseFileSearcher = new Searcher(this.heartbeatInterval,
            this.files[this.reverseSearcherInfo.fileIdx].filename,
            this.filters,
            true,
            cb)
    }

    createNewForwardFileSearcher () {
        let cb = this.processForwardRelevantLogs.bind(this);
        this.forwardFileSearcher = new Searcher(this.heartbeatInterval,
            this.files[this.forwardSearcherInfo.fileIdx].filename,
            this.filters,
            false,
            cb)
    }

    getFilesList () {
        return sendRequestForFilesList(`http://${config.backend.host}:${config.backend.port}/${config.backend.getFilesListRoute}`, this.userId, this.streamId)
            .then((response)=> {
                this.files = response.data; // TODO check data JSON.parse(response);
            })
            .catch((err)=> {
                console.log(err); // TODO save in error logs
            })
    }

    getFileIdxByName (filename) {
        let idx = this.files.length - 1;
        while (idx >= 0) {
            if (this.files[idx].filename === filename) {
                return idx;
            }
            idx--;
        }
        return -1;
    }
}

function sendRequestForFilesList (uri, userId, streamId) {
    return new Promise((resolve, reject)=> {
        request
            .post({
                    url: uri,
                    form: {
                        userId: userId,
                        nameStream: streamId
                    }},
                (err, httpResponse, body)=> {
                    if (err) {
                        reject(err);
                    }
                    if (httpResponse.statusCode == 200) {
                        resolve(JSON.parse(body));
                    }
                })
    });
}



module.exports = LogSearcher;







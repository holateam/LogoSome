'use strict';
const fs = require('fs');
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
        this.logger = params.logger;
        this.cb = params.cb;
        this.receiver = require("socket.io-client")(`http://${config.receiver.host}:${config.receiver.port}`);
        this.files = [];
        this.reverseSearcherInfo = {bufferName: null, lastReadLineIdx: null};
        this.forwardSearcherInfo = {bufferName: null, lastReadLineIdx: null};
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
                            this.startNewReverseFileSearcher();
                        })
                        .catch((err)=> {
                            this.logger.error(`user id: ${this.userId}, stream id: ${this.streamId} unable to get files list. ${err}`);
                        });
                }
            } else if (info.data.statusCode == "43") {
                this.getFilesList()
                    .then(()=> {
                        this.initSearchInCurrentFileFromSpecificLine('reverseDirection');
                    })
                    .catch((err)=> {
                        this.logger.error(`user id: ${this.userId}, stream id: ${this.streamId} unable to get files list. ${err}`);
                    });
            } else {
                this.cb(info);
            }
        });

        this.receiver.on ("newLogs", (info)=> {
            if (!info.err) {
                this.forwardSearcherInfo.bufferName = info.data.bufferName;
                this.forwardSearcherInfo.limit -= info.data.logs.length;
                this.forwardSearcherInfo.lastReadLineIdx = info.data.finishLineNumber;
                this.packageAndSendLogs(info.data.logs, info.data.lastTimestamp, 'newer', info.data.noMoreLogs);
            } else if (info.data.statusCode == "43"){
                this.getFilesList()
                    .then(()=> {
                        this.initSearchInCurrentFileFromSpecificLine();
                    })
                    .catch((err)=> {
                        this.logger.error(`user id: ${this.userId}, stream id: ${this.streamId} unable to get files list. ${err}`);
                    });
            } else {
                this.cb(info);
            }
        });

        this.receiver.on ("liveLogs", (info)=> {
            if (info.err) {
                this.cb(info);
            } else {
                this.forwardSearcherInfo.bufferName = info.data.bufferName;
                this.forwardSearcherInfo.lastReadLineIdx = info.data.finishLineNumber;
                this.packageAndSendLogs(info.data.logs, info.data.lastTimestamp, 'newer');
            }
        });
    }



    getOlderLogs (limit) {
        this.logger.info(`user: ${this.userId} ask ${limit} older logs for ${this.streamId}`);
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
        this.logger.info(`user: ${this.userId} ask ${limit} newer logs for ${this.streamId}`);
        this.forwardSearcherInfo.limit = limit;
        if (this.forwardFileSearcher) {
            this.logger.debug(`username: ${this.userId} [${this.streamId}]: resume search in file ${this.files[this.reverseSearcherInfo.fileIdx].filename} newer logs`);
            this.forwardFileSearcher.getLogs(this.forwardSearcherInfo.limit);
        } else {
            this.logger.debug(`username: ${this.userId} [${this.streamId}]: ask receiver about search in buffer ${limit} newer logs`);
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
        this.logger.info(`username: ${this.userId} [${this.streamId}]: start live mode`);
        this.receiver.emit("live", {userId: this.userId, filters: this.filters, live: true})
    }

    liveModeOff () {
        this.logger.info(`username: ${this.userId} [${this.streamId}]: stop live mode`);
        this.receiver.emit("live", {userId: this.userId, filters: this.filters, live: false})
    }



    packageAndSendLogs (logs, timestamp, direction, noMoreLogs) {
        this.logger.debug(`username: ${this.userId} [${this.streamId}]: send to aggregator ${logs.length} ${direction} logs`);
        this.cb({ error: false, data: {streamIndex: this.streamIdx, direction: direction, logs: logs, lastTimestamp: timestamp, noMoreLogs: noMoreLogs} });
    }

    sendErrorStatus (code, filename) {
        this.logger.debug(`username: ${this.userId} [${this.streamId}]: send to aggregator error with status code ${code}`);
        let data = {};
        data.statusCode = code;
        data.msg = config.searcher.errorsMsg[code];
        if (filename) {
            data.msg += filename;
        }
        this.cb({error: true, data: data});
    }



    processReverseRelevantLogs (fileEnd, logs, timestamp) {
        let noMoreLogs = this.reverseSearcherInfo.fileIdx > 0;
        this.reverseSearcherInfo.limit -= logs.length;
        this.packageAndSendLogs(logs, timestamp, "older", noMoreLogs);
        if (fileEnd && this.reverseSearcherInfo.limit > 0) {
            this.initSearchOlderLogs();
        }
    }

    processForwardRelevantLogs (fileEnd, logs, timestamp) {
        this.packageAndSendLogs(logs, timestamp, "newer", false);
        this.forwardSearcherInfo.limit -= logs.length;
        if (fileEnd && this.forwardSearcherInfo.limit > 0) {
            this.initSearchNewerLogs();
        }
    }


    startNewReverseFileSearcher (line) {
        this.logger.debug(`username: ${this.userId} [${this.streamId}]: start search ${this.reverseSearcherInfo.limit} older logs in file ${this.files[this.reverseSearcherInfo.fileIdx].filename}`);
        checkFileExistsAsync(this.files[this.reverseSearcherInfo.fileIdx].filename)
            .then((file)=> {
                let cb = this.processReverseRelevantLogs.bind(this);
                this.reverseFileSearcher = new Searcher(this.heartbeatInterval,
                    file,
                    this.filters,
                    true,
                    cb);
                if (line) {
                    this.reverseFileSearcher.startFromSpecifiedLine(line, this.reverseSearcherInfo.limit);
                } else {
                    this.reverseFileSearcher.getLogs(this.reverseSearcherInfo.limit);
                }
            })
            .catch((err)=> {
                this.logger.error(`username: ${this.userId} [${this.streamId}]: on check file exists catch error ${err}`);
                this.sendErrorStatus("32", this.files[this.reverseSearcherInfo.fileIdx].filename);
                this.initSearchOlderLogs();
            })
    }

    startNewForwardFileSearcher (line) {
        this.logger.debug(`username: ${this.userId} [${this.streamId}]: start search ${this.forwardSearcherInfo.limit} newer logs in file ${this.files[this.forwardSearcherInfo.fileIdx].filename}`);
        checkFileExistsAsync(this.files[this.forwardSearcherInfo.fileIdx].filename)
            .then((file)=> {
                let cb = this.processForwardRelevantLogs.bind(this);
                this.forwardFileSearcher = new Searcher(this.heartbeatInterval,
                    file,
                    this.filters,
                    false,
                    cb);
                if (line) {
                    this.forwardFileSearcher.startFromSpecifiedLine(line, this.forwardSearcherInfo.limit);
                } else {
                    this.forwardFileSearcher.getLogs(this.forwardSearcherInfo.limit);
                }
            })
            .catch((err)=> {
                this.logger.error(`username: ${this.userId} [${this.streamId}]: on check file exists catch error ${err}`);
                this.sendErrorStatus("32", this.files[this.forwardSearcherInfo.fileIdx].filename);
                this.initSearchNewerLogs();
            })
    }

    initSearchOlderLogs () {
        this.reverseSearcherInfo.fileIdx--;
        if (this.reverseSearcherInfo.fileIdx < 0) {
            this.packageAndSendLogs([], 0, "older", true);
        } else {
            this.startNewReverseFileSearcher();
        }
    }


    initSearchNewerLogs () {
        this.forwardSearcherInfo.fileIdx++;
        if (this.forwardSearcherInfo.fileIdx < this.files.length) {
            this.startNewReverseFileSearcher();
        } else {
            this.getFilesList()
                .then(()=> {
                    if (this.forwardSearcherInfo.fileIdx < this.files.length) {
                        this.startNewForwardFileSearcher();
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
                    this.logger.error(`user id: ${this.userId}, stream id: ${this.streamId} unable to get files list. ${err}`);
                });
        }
    }

    initSearchInCurrentFileFromSpecificLine (reverseDirection) {
        if (reverseDirection) {
            this.reverseSearcherInfo.fileIdx = this.getFileIdxByName(this.reverseSearcherInfo.bufferName);
            if (this.reverseSearcherInfo.fileIdx < 0) {
                this.sendErrorStatus("32", this.reverseSearcherInfo.bufferName);
                this.logger.error(`username: ${this.userId} [${this.streamId}]: file ${this.reverseSearcherInfo.bufferName} not found in file list`);
                this.reverseSearcherInfo.fileIdx = this.files.length;
                this.initSearchOlderLogs();
            } else {
                let file = this.files[this.reverseSearcherInfo.fileIdx];
                this.startNewReverseFileSearcher(file.size - this.reverseSearcherInfo.lastReadLineIdx);
            }
        } else {
            this.forwardSearcherInfo.fileIdx = this.getFileIdxByName(this.forwardSearcherInfo.bufferName);
            if (this.forwardSearcherInfo.fileIdx < 0) {
                this.sendErrorStatus("32", this.forwardSearcherInfo.bufferName);
                this.logger.error(`username: ${this.userId} [${this.streamId}]: file ${this.forwardSearcherInfo.bufferName} not found in file list`);
                this.forwardSearcherInfo.fileIdx = this.files.length;
                this.initSearchNewerLogs();
            } else {
                this.startNewForwardFileSearcher(this.forwardSearcherInfo.lastReadLineIdx + 1);
            }
        }
    }


    getFilesList () {
        return sendRequestForFilesList(`http://${config.backend.host}:${config.backend.port}/${config.backend.getFilesListRoute}`, this.userId, this.streamId)
            .then((response)=> {
                this.logger.debug(`username: ${this.userId} [${this.streamId}]: get files lists: ${JSON.stringify(response.data, null, 2)} `);
                this.files = response.data;
            })
            .catch((err)=> {
                this.logger.error(`on POST request on http://${config.backend.host}:${config.backend.port}/${config.backend.getFilesListRoute} for user: ${this.userId} [${this.streamId}] catch error: ${JSON.stringify(err)} `);
                this.sendErrorStatus("31");
                throw err;
            })
    }

    getFileIdxByName (filename) {
        let idx = this.files.length - 1;
        while (idx >= 0) {
            if (this.files[idx].filename === filename) {
                this.logger.debug(`username: ${this.userId} [${this.streamId}]: file ${filename} has index ${idx}`);
                return idx;
            }
            idx--;
        }
        this.logger.error(`username: ${this.userId} [${this.streamId}]: can not find ${filename} in files list`);
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

function checkFileExistsAsync(filePath) {
    return new Promise((resolve, reject)=> {
        fs.stat(filePath, (err, stats)=> {
            if (err || !stats.isFile()) {
                reject(err);
            } else {
                resolve({path: filePath, size: stats.size});
            }
        });
    })
        .catch((err)=> {
            return Promise.reject(err);
        })
}




module.exports = LogSearcher;







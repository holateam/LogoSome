'use strict';


const Searcher = require('./js/fileSearcher.js');






class MainSearcher {
    constructor(userName, streamId, streamIdx, filters, heartbeatInterval, files, receiver) {
        this.userName = userName;
        this.streamId = streamId;
        this.streamIdx = streamIdx;
        this.files = files;
        this.filters = filters;
        this.heartbeatInterval = heartbeatInterval;
        this.receiver = require("socket.io-client")(receiver);
        this.reverseFileSearcher = null;
        this.forwardFileSearcher = null;
        this.reverseSearcherInfo = {
            limit: null,
            reverseDirection: true,
            fileIdx: null,
            bufferName: null,
            lastReadLineIdx: null,
            cb: null
        };
        this.forwardSearcherInfo = {
            limit: null,
            reverseDirection: false,
            fileIdx: null,
            bufferName: null,
            lastReadLineIdx: null,
            cb: null
        };

        this.receiver.on('connect', ()=> {
            this.receiver.on("logs", (data)=> {
                let reverseDirection = data.direction === 'older';
                if (reverseDirection) { // if logs were found in reverse direction
                    this.reverseSearcherInfo.bufferName = (this.reverseSearcherInfo.bufferName) ?  this.reverseSearcherInfo.bufferName : data.bufferName;
                    if (this.reverseSearcherInfo.bufferName === data.bufferName) { // if buffer was not changed
                        this.reverseSearcherInfo.limit -= data.logs.length;
                        this.reverseSearcherInfo.fileIdx = this.files.length; // TODO function for return index of passed fileName
                        this.reverseSearcherInfo.lastReadLineIdx = data.lastReadLineIdx;
                        this.packageAndSendLogs(data.logs, data.timestamp, this.reverseSearcherInfo.cb);
                        if (data.noMoreLogs && this.reverseSearcherInfo.limit > 0) { // If there are no logs in buffer but limit is not reach
                            this.reverseSearcherInfo.fileIdx = this.files.length - 1;
                            this.createNewReverseFileSearcher();
                            this.reverseFileSearcher.getLogs();
                        }
                    } else { // if buffer was changed
                        let file = this.files[this.reverseSearcherInfo.fileIdx];// TODO function for return index of passed fileName
                        this.createNewReverseFileSearcher();
                        this.reverseFileSearcher.startFromRelevantLine(file.linesNumber - this.reverseSearcherInfo.lastReadLineIdx);
                    }
                } else { // if logs were found in forward direction
                    this.forwardSearcherInfo.bufferName = (this.forwardSearcherInfo.bufferName) ?  this.forwardSearcherInfo.bufferName : data.bufferName;
                    if (this.forwardSearcherInfo.bufferName === data.bufferName) { // if buffer was not changed
                        this.forwardSearcherInfo.limit -= data.logs.length;
                        this.forwardSearcherInfo.fileIdx++; // TODO function for return index of passed fileName
                        this.forwardSearcherInfo.lastReadLineIdx = data.lastReadLineIdx;
                        this.packageAndSendLogs(data.logs, data.timestamp, this.forwardSearcherInfo.cb);
                        if (data.noMoreLogs && this.forwardSearcherInfo.limit > 0) { // If there are no logs in buffer but limit is not reach
                            //live mode
                        }
                    } else { // if buffer was changed
                        let file = this.files[this.forwardSearcherInfo.fileIdx];// TODO function for return index of passed fileName
                        this.createNewForwardFileSearcher();
                        this.forwardFileSearcher.startFromRelevantLine(this.forwardSearcherInfo.lastReadLineIdx + 1);
                    }
                }

            })
        });
    }

    getOlderLogs (limit, cb) {
        this.reverseSearcherInfo.limit = limit;
        this.reverseSearcherInfo.cb = cb;
        this.receiver.emit("getLogs", {userName: this.userName, streamId: this.streamId, bufferName: this.reverseSearcherInfo.bufferName, filters: this.filters, limit: limit, direction: 'older'});
    }

    getNewerLogs (limit, cb) {
        this.forwardSearcherInfo.limit = limit;
        this.forwardSearcherInfo.cb = cb;
        this.receiver.emit("getLogs", {userName: this.userName, streamId: this.streamId, bufferName: this.forwardSearcherInfo.bufferName, filters: this.filters, limit: limit, direction: 'newer'});
    }

    packageAndSendLogs (logs, timestamp, direction, noMoreLogs, cb) {
        cb({streamIndex: this.streamIdx, direction: direction, logs: logs, lastTimestamp: timestamp, noMoreLogs: noMoreLogs});
    }

    processReverseRelevantLogs (fileEnd, logs, timestamp) {
        let direction = "older";
        let noMoreLogs = false;
        this.reverseSearcherInfo.limit -= logs.length;
        if (fileEnd && this.reverseSearcherInfo.limit > 0) {
            this.reverseSearcherInfo.fileIdx--;
            if (this.reverseSearcherInfo.fileIdx < 0) {
                noMoreLogs = true;
            } else {
                this.createNewReverseFileSearcher();
                this.reverseFileSearcher.getLogs();
            }
        }
        this.packageAndSendLogs(logs, timestamp, direction, noMoreLogs, this.reverseSearcherInfo.cb);
    }

    processForwardRelevantLogs (fileEnd, logs, timestamp) {
        let direction = "newer";
        this.forwardSearcherInfo.limit -= logs.length;
        if (fileEnd && this.forwardSearcherInfo.limit > 0) {
            this.forwardSearcherInfo.fileIdx++;
            if (this.forwardSearcherInfo.fileIdx < this.files.length) {
                this.createNewForwardFileSearcher();
                this.forwardFileSearcher.getLogs();
            } else {
                this.receiver.emit("getLogs", {userName: this.userName, streamId: this.streamId, bufferName: this.forwardSearcherInfo.bufferName, filters: this.filters, limit: this.forwardSearcherInfo.limit, direction: direction});
            }
        }
        this.packageAndSendLogs(logs, timestamp, direction, false, this.forwardSearcherInfo.cb);
    }


    createNewReverseFileSearcher () {
        this.reverseFileSearcher = new Searcher(this.heartbeatInterval,
            this.files[this.reverseSearcherInfo.fileIdx].path,
            this.filters,
            this.reverseSearcherInfo.limit,
            true,
            this.processReverseRelevantLogs)
    }

    createNewForwardFileSearcher () {
        this.forwardFileSearcher = new Searcher(this.heartbeatInterval,
            this.files[this.forwardSearcherInfo.fileIdx].path,
            this.filters,
            this.forwardSearcherInfo.limit,
            false,
            this.processForwardRelevantLogs)
    }
}

module.exports = MainSearcher;
'use strict';


const fileReader = require('./fileReader.js');
const filterHandler = require('./filter.js');

class FileSearcher {
    constructor(heartbeatInterval, file, filter, reverseDirection, cb) {
        this.heartbeatInterval = heartbeatInterval;
        this.filter = filterHandler(filter);
        this.cb = cb;
        this.reverseDirection = !!reverseDirection;
        this.fr = fileReader(file, reverseDirection);
        this.limit = null;
        this.relevantLogs = [];
        this.timeouts = [];
        this.fileEnd = false;
        this.finalTimestamp = null;
        this.pauseSearch = true;
    }

    getLogs (limit) {
        if (limit) {
            this.limit = limit;
        }
        this.pauseSearch = false;
        this.search();
        this.schedulePeriodicallySearcherInfo();
    }

    startFromSpecifiedLine (skippedLinesNumber, limit) {
        return this.fr.readLine()
            .then(()=> {
                skippedLinesNumber--;
                if (skippedLinesNumber) {
                    this.startFromSpecifiedLine(skippedLinesNumber);
                } else {
                    this.getLogs(limit);
                }
            })
    }

    search () {
        if (this.limit > 0 && !this.fileEnd && !this.pauseSearch) {
            this.checkSingleLine()
                .then(()=> {
                    this.search();
                })
                .catch((err)=> {
                    console.log('err: ', err);
                })
        } else {
            this.stop();
        }
    }

    checkSingleLine() {
        return this.fr.readLine()
            .then((line)=> {
                if (line.last) {
                    this.fileEnd = true;
                }
                if (this.filter(line.msg)) {
                    this.relevantLogs.push(line.msg);
                    this.limit--;
                }
                this.finalTimestamp = this.getTimestamp(line.msg);
            })
            .catch((err)=> {
                console.log('err: ', err);
            })
    }

    stop () {
        this.timeouts.forEach((timeout)=> {
            clearTimeout(timeout);
        });
        this.timeouts = [];
        this.transmitLogPortion();
    }

    resume () {
        if (this.limit > 0) {
            this.pauseSearch = false;
            this.search();
            this.schedulePeriodicallySearcherInfo();
        }
    }
    schedulePeriodicallySearcherInfo () {
        let _this = this;
        this.timeouts.push(setTimeout(function nextTick() {
            _this.transmitLogPortion();
            _this.timeouts.push(setTimeout(nextTick, _this.heartbeatInterval));
        }, _this.heartbeatInterval))
    }

    transmitLogPortion () {
        this.cb(this.fileEnd, this.relevantLogs, this.finalTimestamp);
        this.relevantLogs = [];
    }

    getTimestamp(log) {
        return Date.parse(log.substr(0, log.indexOf(' ')));
    }

}

module.exports = FileSearcher;
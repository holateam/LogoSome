'use strict';


const fileReader = require('./fileReader.js');
const filterHandler = require('../../backend/modules/filter.js');

class FileSearcher {
    constructor(heartbeatInterval, filePath, filter, limit, reverseDirection, cb) {
        this.heartbeatInterval = heartbeatInterval;
        this.filter = filterHandler(filter);
        this.limit = limit;
        this.cb = cb;
        this.reverseDirection = !!reverseDirection;
        this.fr = fileReader(filePath, reverseDirection);
        this.relevantLogs = [];
        this.timeouts = [];
        this.fileEnd = false;
        this.finalTimestamp = 0;
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

    startFromSpecifiedLine (skippedLinesNumber) {
        return this.fr.readLine()
            .then(()=> {
                skippedLinesNumber--;
                if (skippedLinesNumber) {
                    this.startFromSpecifiedLine(skippedLinesNumber);
                } else {
                    this.getLogs();
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

    pause () {
        this.pauseSearch = true;
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

'use strict';

const fs = require('fs');


class FileLineReader {

    constructor(file, reverse, chunkSize, separator, encoding) {
        this.reverseDirection = !!reverse;
        this.size = file.size;
        this.filename = file.path;
        this.separator = separator || '\n';
        this.encoding = encoding || 'utf8';
        this.chunkSize = chunkSize || 1024;
        this.pos = (this.reverseDirection) ? Math.max(this.size - this.chunkSize, 0) : 0;
        this.pointer = this.pos;
        this.buffer = null;
        this.savedBuffer = '';
    }


    searchBuffer() {
        if (this.buffer === null) {
            return false;
        }
        let separatorPos = (this.reverseDirection) ? this.buffer.lastIndexOf(this.separator) : this.buffer.indexOf(this.separator);
        let savedBuffer;
        if (!this.reverseDirection && this.pos >= this.size && separatorPos === -1
            || this.reverseDirection && this.pos <= 0 && separatorPos === -1) {
            let lastLine = this.buffer;
            this.buffer = '';
            savedBuffer = this.savedBuffer;
            this.savedBuffer = "";
            return lastLine + savedBuffer;
        }
        if (separatorPos === -1) {
            this.pointer = (this.reverseDirection) ? this.pos - this.chunkSize - 1 : this.pos + this.chunkSize + 1;
            this.pos = this.pointer;
            this.savedBuffer = this.buffer + this.savedBuffer;
            this.buffer = "";
            return false;
        } else {
            let line = (this.reverseDirection) ? this.buffer.substr(separatorPos + this.separator.length) : this.buffer.substr(0, separatorPos);
            this.buffer = (this.reverseDirection) ? this.buffer.substr(0, separatorPos) : this.buffer.substr(separatorPos + this.separator.length);
            savedBuffer = this.savedBuffer;
            this.savedBuffer = "";
            return line + savedBuffer;
        }
    }

    readLine(cb) {
        let _this = this;
        //let chunkSize = 0;
        let line = _this.searchBuffer();
        if (line !== false) {
            let end = (_this.reverseDirection) ? this.pos <= 0 : this.pos >= _this.size;
            cb(line, _this.buffer === '' && end);
        } else {
            let stream = fs.createReadStream(this.filename, {
                start: Math.max(this.pointer, 0),
                end: Math.max(this.pointer + this.chunkSize, 0),
                encoding: this.encoding
            });

            stream.on('error', function (err) {
                throw err;
            });
            stream.on('end', function () {
                if (_this.buffer === null) {
                    cb(null, true);
                } else {
                    _this.readLine(cb);
                }
            });
            stream.on('data', function (data) {
                if (_this.buffer === null) {
                    _this.buffer = '';
                }
                _this.buffer += data;
                //chunkSize += data.length;
            });
        }
    }

}
module.exports = FileLineReader;
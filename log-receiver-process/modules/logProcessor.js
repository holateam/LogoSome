const log = require('./log')(module);
const tcp = require('net');
const request = require('request');
const saveInFile = require('./saveInFile');
const generationDirnameStr = require('./generationDirnameStr');
const generationNameFileStr = require('./generationNameFileStr');
const config = require('../config.json');

module.exports = function logProcessor(user) {
    this.searchInBuffer = (streamId, nameFile, filters, startLineNumber, direction, limit) => {
        return bufferArrays[streamId].bufferArray.filter(log => {
            return log.indexOf(filters);
        });
    };
    let bufferArrays = {};
    let userId = user._id;
    let host = user.host;
    let port = user.port;

    runServerTCP(host, port);

    function runServerTCP(host, port) {
        let server = tcp.createServer();
        server.on('connection', socket => {
            socket.on('data', data => {
                saveLogs(data);
            });
        });

        server.listen(port, host, () => {
            log.info(`Server TCP user run: ${host}:${port} \n`);
        });
    }

    function saveLogs(data) {
        let limit = 10;
        let nameStream = data.toString().split(' ')[3];

        if (!bufferArrays[nameStream]) {
            bufferArrays[nameStream] = {
                namefile: `${generationDirnameStr(userId, nameStream)}${generationNameFileStr(userId, nameStream)}`,
                bufferArray: []
            };
        }

        data.toString().split('\n').forEach(line => {

            if (bufferArrays[nameStream].bufferArray.length >= limit) {
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
                                namefile: address
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

            if (line != "") {
                console.log('Line: ' + line);
                bufferArrays[nameStream].bufferArray.push(new Date().toISOString() + ' ' + parseToString(line));
            }
        });
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
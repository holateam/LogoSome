const log = require('./modules/log')(module);
const request = require('request');
const tcp = require('net');
const config = require('./config.json');
const logProcessor = require('./modules/logProcessor');

let logReceiverProcess = new LogReceiverProcess();
logReceiverProcess.run();


function LogReceiverProcess() {
    this.run = () => {
        let logProcessors = new Map();

        runServerSocketIO(config.receiver.host, config.receiver.port);

        request
            .get(`http://${config.backend.host}:${config.backend.port}/service/api/v1/getUsers`)
            .on('response', function (response) {
                if (response.statusCode == 200) {
                    response.setEncoding('utf8');
                    response.on('data', (result) => {
                        createLogProcessors(JSON.parse(result).data);
                    });
                }
            });

        function createLogProcessors(users) {
            users.forEach(user => {
                logProcessors.set(user._id, new logProcessor(user));
            });
        }

        function runServerSocketIO(host, port) {
            const server = require('http').createServer();
            const io = require('socket.io')(server);

            server.listen(port, host, () => {
                log.info(`Server IO run: ${host}:${port}`);
            });

            io.on('connection', (socket) => {
                let liveListener = {};
                let ip_address = socket.request.connection.remoteAddress;
                log.info(`Connection search-service: ${ip_address}`);

                socket.on('getLogs', (data) => {
                    log.info(`${ip_address} EVENT /getLogs`)
                    if (logProcessors.has(data.userId)) {
                        let directionPast = (data.direction == 'older');
                        if (directionPast) {
                            logProcessors.get(data.userId).searchInBufferOldLogs(data.userId, data.streamId, data.filters,
                                data.bufferName, data.startLineNumber, directionPast, data.limit, (result) => {
                                    socket.emit('oldLogs', result);
                                });
                        } else {
                            logProcessors.get(data.userId).searchInBufferNewLogs(data.userId, data.streamId, data.filters,
                                data.bufferName, data.startLineNumber, directionPast, data.limit, (result) => {
                                    socket.emit('newLogs', result);
                                });
                        }

                    }

                });
                socket.on('Live', (data) => {
                    log.info(`${ip_address} EVENT /Live`)
                    if (logProcessors.has(data.userId)) {
                        if (data.live) {
                            liveListener = logProcessors.get(data.userId).live(data.streamId, data.filter,
                                data.live, (result) => {
                                    socket.emit('liveLogs', result);
                                });
                        } else {
                            logProcessors.get(data.userId).liveOff(data.streamId, liveListener, (result) => {
                                socket.emit('liveLogs', result);
                            })
                        }
                    }
                });
            });
        }

    }

}



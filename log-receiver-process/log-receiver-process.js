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
        // runClientSocket(config.searcher.host, config.searcher.port);

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
                socket.on('getLogs', function (data) {
                    log.info(data);
                    if (logProcessors.has(data.userId)) {
                        logProcessors.get(data.userId).searchInBuffer(data.userId, data.streamId, data.streamIndex, data.filters,
                            data.bufferName, data.startLineNumber, data.direction, data.limit, (result) => {
                               if(data.direction == 'older'){
                                   socket.emit('oldLogs', result);
                               } else {
                                   socket.emit('newLogs', result);
                               }
                            });
                    }

                });
                socket.on('live', (socket) => {

                });
            });
        }

        // function runClientSocket(host, port) {
        //     const socket = require('socket.io-client')(`http://${host}:${port}`);
        //     socket.on('connect', () => {
        //         socket.on('news', (data) => {
        //             console.log(data);
        //             socket.emit('my other event', {my: 'data'});
        //         });
        //     });
        // }

    }

}



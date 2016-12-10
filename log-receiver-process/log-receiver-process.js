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
        runClientSocket(config.searcher.host, config.searcher.port);

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

        function createLogProcessors (users){
            users.forEach(user => {
                logProcessors.set(user._id, new logProcessor(user));
                console.log('послe: '+ JSON.stringify(logProcessors.get(user._id)));
            });
        }


        // function runServersTCP(users) {
        //     users.forEach(user => {
        //         let server = tcp.createServer();
        //         server.on('connection', socket => {
        //             socket.on('data', data => {
        //                 log.info(data.toString() + '\n');
        //                 log.info(user.host + ":" + user.port);
        //             });
        //         });
        //         server.listen(user.port, user.host, () => {
        //             bufferArrays[user.host + ":" + user.port] = {};
        //             log.debug(JSON.stringify(bufferArrays, " ", 4));
        //             log.info(`Server TCP user run: ${user.host}:${user.port} \n`);
        //         });
        //     });
        // }

        function runServerSocketIO(host, port) {
            const server = require('http').createServer();
            const io = require('socket.io')(server);

            server.listen(port, host, () => {
                log.info(`Server io run: ${host}:${port}`);
            });

            io.on('connection', (socket) => {
                socket.emit('news', {hello: 'world'});
                socket.on('getLogs', function (data) {
                    log.info(data);
                    searchInBuffer(userId, streamId, nameFile, startLineNumber, direction, limit, filters, cb);
                });
            });
        }

        function runClientSocket(host, port) {
            const socket = require('socket.io-client')(`http://${host}:${port}`);
            socket.on('connect', () => {
                socket.on('news', (data) => {
                    console.log(data);
                    socket.emit('my other event', {my: 'data'});
                });
            });
        }

    }

}



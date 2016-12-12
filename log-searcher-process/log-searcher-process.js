const request = require('request');
const tcp = require('net');
const config = require('./config.json');
const mainSearcher = require('./mainSearcher');

runServerSocketIO(config.searcher.host, config.searcher.port);


function runServerSocketIO(host, port) {
    const server = require('http').createServer();
    const io = require('socket.io')(server);

    server.listen(port, host, () => {
        console.log(`Server IO run: ${host}:${port}`);
    });

    io.on('connection', (socket) => {

        socket.emit('news', {hello: 'world'});
        socket.on('getLogs', (data) => {
            let filesStream = [];
            console.log(data);
            request
                .post({
                    url: `http://${config.backend.host}:${config.backend.port}/service/api/v1/getFilesStream`,
                    form: {
                        userId: data._id,
                        nameStream: data.streamId,
                    }
                })
                .on('response', function (response) {
                    if (response.statusCode == 200) {
                        response.setEncoding('utf8');
                        response.on('data', (result) => {
                            console.log(JSON.stringify(result));
                            filesStream = JSON.parse(result).data.filesStream;
                        });
                    }
                });
            let logSearcherProcess = new mainSearcher(data._id, data.streamId, data.streamIndex,
                data.filter, data.heartbeatInterval, filesStream, data.direction);
            searchInBuffer(userId, streamId, nameFile, startLineNumber, direction, limit, filters, cb);
        });

        socket.on('moreLogs', (data) => {

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





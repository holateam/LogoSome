const log = require('./modules/log')(module);
const http = require('http');
const tcp = require('net');
const soketIO = require('soket.io-client')('http://localhost:8080');


http.get({
    hostname: 'localhost',
    port: '3000',
    path: '/service/api/v1/getUsers',
    agent: false
}, (res) => {
    if (res.statusCode == 200) {
        res.setEncoding('utf8');
        res.on('data', (result) => {
            runServers(JSON.parse(result).data);
            console.log((users));
        });
    }
});


let runServers = (users) => {
    users.forEach(user => {
        let server = tcp.createServer();
        let
    });
};










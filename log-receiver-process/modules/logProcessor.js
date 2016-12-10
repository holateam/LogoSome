const log = require('./log')(module);
const tcp = require('net');
const saveInFile = require('./saveInFile');
const generationDirnameStr = require('./generationDirnameStr');
const generationNameFileStr = require('./generationNameFileStr');
const config = require('../config.json');

module.exports = function logProcessor(user){
    let bufferArrays = {};
    let userId = user._id;
    let host = user.host;
    let port = user.port;

    runServerTCP(host, port);

    function runServerTCP (host, port){
        let server = tcp.createServer();
        server.on('connection', socket => {
            socket.on('data', data => {
                console.log(host + ":" + port + " -> " + data.toString() + '\n');
                saveLogs(data);
            });
        });

        server.listen(port, host, () => {
            log.info(`Server TCP user run: ${host}:${port} \n`);
        });
    }

    function saveLogs(data){
        let limit = 10;
        let nameStream = data.toString().split(' ')[3];

        if (!bufferArrays[nameStream]) {
            bufferArrays[nameStream] = {
                namefile: `${generationDirnameStr(userId,nameStream)}${generationNameFileStr(userId,nameStream)}`,
                bufferArray: []
            };
        }

        data.toString().split('\n').forEach( line => {
            if(line !=""){
                console.log(line);
                bufferArrays[nameStream].bufferArray.push(new Date().toISOString()+' '+ parseToString(line));
            }
            if(bufferArrays[nameStream].bufferArray.length >= limit) {
                saveInFile(userId, nameStream, bufferArrays[nameStream].namefile, bufferArrays[nameStream].bufferArray, (address) => {
                    console.log('db_query_save_adress: ' + address);
                    // db_query.saveAddressOfFile(userHost, userPort, nameFile, address);
                    // arrayBuffer[nameFile].splice(0, limit);
                });
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
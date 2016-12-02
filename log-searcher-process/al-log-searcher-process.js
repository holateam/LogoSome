// searchInFiles(5000, filesGetter, undefined, "*", 0, 100, f)
// function searchInFiles(heartbeatInterval, filenameGetterFunc,
//                        startFromLogfile?null, filter, skipLinesCount, limit, updatesHandler) {
//     //... X:
//     function gotoNextFile() {
//         filename = filenameGetterFunc(filename);
//         if (filename == undefined)
//             return updatesHandler(true, ...); // end of search
//
//         searchInFile(heartbeatInterval, filename, filter, skipLinesCount, limit~,
//             function(fileFinished, loglines, lastlineindex) {
//                 updatesHandler(false, filename, loglines, lastlineindex);
//                 limit -= loglines.length;
//                 if (fileFinished) {
//                     gotoNextFile();
//                 }
//             })
//     }
//
//
//     gotoNextFile();
//     //...
//     return {
//         stop: function() {
//             //...
//         }
//     }
// }
const http = require('http').Server(function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
const io = require('socket.io')(http);

options = {
    port: 4000
};

let runSearcherProcess = (port) => {
    http.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });

    io.on('connection', (socket) => {
        console.log('connection have been established');

        socket.on('getLogs', (paramsJson) => {
            createSearcherInstanceWithParamsForEachStreamId(paramsJson);
        });
    });
};

runSearcherProcess(options.port);


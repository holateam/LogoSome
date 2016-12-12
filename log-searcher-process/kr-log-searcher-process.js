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
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

options = {
    port: 4000,
};

apiNames = {
    streamId: 'streamId'
};

let runSearcherProcess = (port) => {
    http.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });

    app.use(express.static(__dirname + '/'));

    io.on('connection', (socket) => {
        console.log('connection have been established');

        socket.on('getLogsWithNewFilter', (params) => {
            createSearcherInstancePairWithParams(params);
        });
    });
};

let createSearcherPairWithParams = (params) => {
    return  {
        olderDirectionSearcher: {

        },
        newerDirectionSearcher: {

        }
    };

};



let getParamsForEachSearcherPair = (params) => {
    return params[apiNames.streamId].map( (item) => {
           return {
               if(item) {
                   forEach
               }
           }
    });
};

runSearcherProcess(options.port);


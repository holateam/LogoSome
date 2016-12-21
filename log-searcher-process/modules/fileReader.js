'use strict';

let FileLineReader = require('./fileLineReader.js');


let fileReader = (file, direction, chunkSize, separator, encoding)=> {
    const flr = new FileLineReader(file, direction, chunkSize, separator, encoding);

    return {
        readLine: ()=> {
            return new Promise((resolve)=> {
                flr.readLine((line, last)=> {
                    resolve({msg: line, last: last});
                });
            })
                .catch((err)=> {
                    return Promise.reject(err);
                })
        }
    }
};
module.exports = fileReader;

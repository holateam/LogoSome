'use strict';

let FileLineReader = require('./fileLineReader.js');


let fileReader = (filePath, direction, chankSize, separator, encoding)=> {
    const flr = new FileLineReader(filePath, direction, chankSize, separator, encoding);

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

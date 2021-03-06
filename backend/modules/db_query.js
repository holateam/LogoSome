const Users = require('./userSchema');
const config = require('../config.json');
const bCrypt = require('bcrypt');

module.exports.getFilesStream = (obj) => {
    return new Promise((resolve, reject) => {
        Users.findOne({'_id': obj.userId}, {'_id': 0}).exec((err, user) => {
            if (err)
                reject({err: true, data: 'err db'});
            if (user) {
                let array = [];
                user.streams.forEach(value => {
                    if (value.name === obj.nameStream) {
                        array = value.fileslist;
                    }
                });
                resolve({err: false, data: array});
            } else {
                reject({err: true, data: "Not found user"});
            }
        });
    });
};

module.exports.getUser = (obj) => {
    return new Promise((resolve, reject) => {
        Users.findOne({"sessiontoken": obj.token}, {
            "password": 0, "port": 0,
            "sessiondate": 0
        }).exec((err, user) => {
            if (err) {
                reject({err: true, data: {msg: 'err db '}});
                console.log(err);
            }
            console.log(JSON.stringify(user));
            function createStreamsArray(user) {
                return user.streams.map(value => {
                    return value.name;
                });
            }

            resolve({err: false, data: {_id: user._id, streams: createStreamsArray(user)}});
        })

    });
};

// module.exports.getStreamFiles = (obj) => {
//     return new Promise((resolve, reject) => {
//         Users.findOne({"host": "127.0.0.1", "port": "30000", "streams.name": "log"}, {"streams.$": 1}, (err, user) => {
//            if(err)
//         });
//
//     });
// };

module.exports.getUsers = () => {
    return new Promise((resolve, reject) => {
        Users.find({}, {
            "port": 1, "host": 1,
            "username": 1, "streams": 1
        }).exec((err, res) => {
            if (err) {
                return next(err);
            }
            // if(!authentication){
            //     reject({err: true, data: 'No access'});
            // }
            let array = [];
            res.forEach(user => {
                array.push(user);
            });
            resolve({err: false, data: array});
        });
    });
};

module.exports.cookieSession = (cookie) => {
    let token = getCookie('token', cookie);
    return new Promise((resolve, reject) => {
        Users.findOne({"sessiontoken": token}, {
            "_id": 0, "password": 0,
            "sessiondate": 0
        }).exec((err, user) => {
            if (err) {
                return next(err);
            }
            if (user && token) {
                if (user.sessiontoken == token) {
                    resolve({
                        err: false, data: {
                            username: user.username, email: user.email, host: user.host,
                            port: user.port, streams: user.streams.map(item => item.name)
                        }
                    });
                }
            } else {
                resolve({err: true, data: {'msg': 'Invalid token'}});
            }
        })
    });
};

module.exports.registration = (obj) => {
    return new Promise((resolve, reject) => {
        Users.findOne({'email': obj.email}, (err, user) => {
            if (err) {
                reject({err: true, data: {msg: "Server error, please reload pages"}});
            }
            if (user) {
                resolve({'err': true, data: {'msg': 'Users with this email already exists'}});
            } else {
                let newUser = new Users();
                newUser.email = obj.email;
                newUser.password = createHash(obj.password);
                newUser.username = obj.username;
                newUser.host = '127.0.0.1';
                // newUser.port = 0;
                Users.find({}, (err, users) => {
                    if (err)
                        console.log(err);
                    newUser.port = (users.length !== 0) ? users[users.length - 1].port + 1 : 30000; // users port
                    newUser.save((err) => {
                        if (err) reject({err: true, data: {msg: "Server error, please reload pages"}});
                    });
                    resolve({'err': false, data: {'msg': 'The new user is registered'}});
                });
            }
        });
    });
};

module.exports.login = (obj) => {
    return new Promise((resolve, reject) => {
        Users.findOne({email: obj.email}).exec((err, user) => {
            if (err) {
                return next(err);
            }
            if (user) {
                if ((bCrypt.compareSync(obj.password, user.password))) {
                    let date = new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes).toString();
                    user.sessiontoken = createHash(date);
                    user.sessiondate = date;
                    // user.tokensession = (new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes)).toString();
                    user.save((err) => {
                        if (err) reject({err: true, data: {msg: "Server error, please reload pages"}});
                    });
                    resolve({err: false, data: {token: user.sessiontoken}});
                } else {
                    resolve({err: true, data: {msg: 'Incorrect password'}});
                }
            } else {
                resolve({err: true, data: {msg: 'User is not found'}});
            }
        });
    });
};

module.exports.getNameStreams = (userHost, userPort) => {
    return new Promise((resolve, reject) => {
        User.findOne({host: userHost, port: userPort}, (err, res) => {
            if (err) {
                reject(err);
            }
            let array = [];
            res.streams.forEach(obj => {
                array.push(obj.name);
            });
            resolve(array);
        });
    });
};

module.exports.saveTheInfoOfFile = (userId, nameStream, addressFile, linesNumber) => {
    return new Promise((resolve, reject) => {
        Users.findOne({_id: userId}).exec((err, doc) => {
            if (err) {
                return next(err);
            }
            doc.streams.forEach(stream => {
                if (stream.name == nameStream) {
                    stream.fileslist.push({namefile: addressFile, linesNumber:linesNumber});
                }
            });
            doc.save((err) => {
                if (err) {
                    console.log(err);
                    reject({err: true, data: {msg: 'error writing file information'}})
                }
                resolve({err: false, data: {msg: 'save the info of file'}});
            });
        });
    });

};

// Generates hash using bCrypt
let createHash = (password) => {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

let getCookie = (cookie_name, cookie) => {
    var results = cookie.match('(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
    if (results)
        return ( unescape(results[2]) );
    else
        return null;
};


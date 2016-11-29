const Users = require('./userSchema');
const config = require('../config.json');
const bCrypt = require('bcrypt');


module.exports.getStreamFiles = () => {
  let promise = new Promise ((resolve, reject) => {
      Users.findOne({"host": "127.0.0.1", "port": "30000", "streams.name": "log"},{"streams.$": 1}, (err, user) => {
          console.log(user);
      });

  });
    return promise;
};

module.exports.getUsers = () => {
    let promise = new Promise((resolve, reject) => {
        Users.find({}, (err, res) => {
            if (err) {
                reject(err);
            }
            let array = [];
            res.forEach(user => {
                array.push(user);
            });
            resolve(array);
        });
    });
    return promise;
};

module.exports.cookieSession = (cookie) => {
    let token = getCookie('token', cookie);
    console.log(token);
    let promise = new Promise((resolve, reject) => {
        Users.findOne({"sessiontoken": token}, {
            "_id": 0, "password": 0,
            "sessiondate": 0
        }, (err, user) => {
            if (err) {
                console.log(`Error sign up:  ${err}`);
            }
            if (user) {
                if (user.sessiontoken == token) {
                    resolve({
                        username: user.username, email: user.email, host: user.host,
                        port: user.port, streams: user.streams.map(item => item.name)
                    });
                }
            } else {
                reject({'msg': 'Invalid token'});
            }
        })
    });
    return promise
};

module.exports.signUp = (obj) => {
    let promise = new Promise((resolve, reject) => {
        Users.findOne({'email': obj.email}, (err, user) => {
            if (err) {
                console.log(`Error sign up:  ${err}`);
            }
            if (user) {
                console.log(`User alerady existis`);
                reject({'msg': 'User alerady existis'});
            } else {
                let newUser = new Users();
                newUser.email = obj.email;
                newUser.password = createHash(obj.password);
                newUser.username = obj.username;
                newUser.host = '127.0.0.1';
                // newUser.port = 0;
                Users.find({}).then((line) => {
                    newUser.port = line[line.length - 1].port + 1;
                    newUser.save((err) => {
                        if (err) console.log(`Error save user ${err}`);
                        resolve();
                    })
                });
            }
        })
    });
    return promise;
};

module.exports.signIn = (obj) => {
    let promise = new Promise((resolve, reject) => {
        Users.findOne({email: obj.email}, (err, user) => {
            if (err) reject(err);
            if ((bCrypt.compareSync(obj.password, user.password))) {
                let date = new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes).toString();
                user.sessiontoken = createHash(date);
                user.sessiondate = date;

                // user.tokensession = (new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes)).toString();
                user.save((err) => {
                    console.log("save");
                    if (err) console.log(err);
                });
                resolve({err: false, token: user.sessiontoken});
            } else {
                resolve({err: true});
            }
        });
    });
    return promise;
};

module.exports.getNameStreams = (userHost, userPort) => {
    let promise = new Promise((resolve, reject) => {
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
    return promise;
};

module.exports.saveAddressOfFile = (userHost, userPort, nameStream, addressFile) => {
    console.log("--->  save address file in db: " + addressFile);
    Users.findOne({host: userHost, port: userPort}, (err, doc) => {
        doc.streams.forEach(stream => {
            if (stream.name == nameStream) {
                stream.fileslist.push({namefile: addressFile});
            }
        });
        doc.save((err) => {
            if (err) console.log(err);
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


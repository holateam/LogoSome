const Users = require('./userSchema');
const config = require('../config.json');
const bCrypt = require('bcrypt');




let cookieSession = (cookie) => {
    let token = getCookie('token', cookie);
    let promise = new Promise((resolve, reject) => {
        console.log('token :' + token);
        Users.findOne({"sessiontoken": token}, {
            "_id": 0, "password": 0,
            "sessiondate": 0
        }).exec((err, user) => {
            console.log(user);
            if (err) {
                reject(err);
                console.log(`Error sign up:  ${err}`);
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
                reject({err: true, data: {'msg': 'Invalid token'}});
            }
        })
    });
    return promise
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

cookieSession("sdfsgdg").then(
    (result) => {
        console.log("ok " + result);
    }
);

// let signIn = (obj) => {
//     Users.findOne({email: 'info.tehnokot@gmai1l.com'}).exec(function (err, user) {
//         console.log(err +" " + user);s
//         if(err) {
//             console.log('err: ' + err);
//             return
//         }
//         if(!user) {
//             console.log('Not find user, sorry');
//             return
//         }
//
//         if ((bCrypt.compareSync(obj.password, user.password))) {
//             console.log('user ' + user);
//             return { 'user': user }
//         }
//
//     })
// };
//
// let a = signIn({'email': "sdsdsd"});
//
// console.log(JSON.stringify(a));
//
//
// module.exports.signIn = (obj) => {
//     let promise = new Promise((resolve, reject) => {
//         Users.findOne({email: obj.email}, (err, user) => {
//             console.log('singIn: ' + JSON.stringify(user) + " err: " +  err);
//             if (err) {
//                 reject(err);
//             }
//             if ((bCrypt.compareSync(obj.password, user.password))) {
//                 let date = new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes).toString();
//                 user.sessiontoken = createHash(date);
//                 user.sessiondate = date;
//
//                 // user.tokensession = (new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes)).toString();
//                 user.save((err) => {
//                     if (err) console.log(err);
//                 });
//                 resolve({err: false, token: user.sessiontoken});
//             } else {
//                 resolve({err: true});
//             }
//         });
//     });
//
//     return promise;
// };


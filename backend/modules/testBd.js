const Users = require('./userSchema');
const config = require('../config.json');
const bCrypt = require('bcrypt');

let signIn = (obj) => {
    Users.findOne({email: 'info.tehnokot@gmai1l.com'}).exec(function (err, user) {
        console.log(err +" " + user);
        if(err) {
            console.log('err: ' + err);
            return
        }
        if(!user) {
            console.log('Not find user, sorry');
            return
        }

        if ((bCrypt.compareSync(obj.password, user.password))) {
            console.log('user ' + user);
            return { 'user': user }
        }

    })
};

let a = signIn({'email': "sdsdsd"});

console.log(JSON.stringify(a));


module.exports.signIn = (obj) => {
    let promise = new Promise((resolve, reject) => {
        Users.findOne({email: obj.email}, (err, user) => {
            console.log('singIn: ' + JSON.stringify(user) + " err: " +  err);
            if (err) {
                reject(err);
            }
            if ((bCrypt.compareSync(obj.password, user.password))) {
                let date = new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes).toString();
                user.sessiontoken = createHash(date);
                user.sessiondate = date;

                // user.tokensession = (new Date(new Date().getTime() + 60 * 1000 * config.session.timeMinutes)).toString();
                user.save((err) => {
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
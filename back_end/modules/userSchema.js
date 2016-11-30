const mongoose = require('mongoose');
const db = require('./db');

const Schema = mongoose.Schema;
let UserSchema = new Schema({
    username: String,
    password: String,
    email: String,
    pass: String,
    host: String,
    port: Number,
    sessiontoken: String,
    sessiondate: String,
    streams: [
        {
            name: String,
            fileslist: [{
                namefile: String,
                search: [{}]
            }],

        }
    ]
});

let Users = mongoose.model('users', UserSchema);

module.exports = Users;

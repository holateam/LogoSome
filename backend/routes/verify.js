const express = require('express');
const verifyRouter = express.Router();
const log = require('winston');
const path = require('path');
const db_query = require('../modules/db_query');

verifyRouter.route('/api/v1/signIn').post((req,res, next) =>{
    log.info(`get '/api/v1/signIn' `);
    res.send({name:'alex', host: 'localhost', port: 3000, streamsId: ["log"], token: 'dfdff'});
});
// router.post('/api/v1/signIn', (req, res, next) => {
//     log.info(`get '/api/v1/signIn' `);
//     // db_query.signIn(req.data).then((result) => {
//     //     socket.emit('sign in', result);
//     // }, (err) => {
//     //     console.log(`Error mongoDB ${err}`);
//     // });
//     // log.debag(req);
//     // res.status(200).sendFile(path.join(__dirname, '../public/index.html'));
// });

// router.get('/login', (req, res, next) => {
//     log.info(`get '/login'`);
//     res.status(200).sendFile(path.join(__dirname, '../public/views/login.html'));
// });

// router.get("/404").get((req, res) => {
//     console.log('Error');
// });

module.exports = verifyRouter;
const express = require('express');
const router = express.Router();
const log = require('winston');
const path = require('path');

router.get('/', (req, res, next) => {
    log.info(`get '/' `);
    res.status(200).sendFile(path.join(__dirname, '../public/index.html'));
});

router.get('/login', (req, res, next) => {
    log.info(`get '/login'`);
    res.status(200).sendFile(path.join(__dirname, '../public/views/login.html'));
});

// router.get("/404").get((req, res) => {
//     console.log('Error');
// });

module.exports = router;
const express = require('express');
const router = express.Router();
const path = require('path');
const db_query = require('../modules/db_query');

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', {title: 'Express'});
});


router.get('/login', (req, res, next) => {
    res.render('login');
});

router.get('/register', (req, res, next) => {
    res.render('register');
});

let standardRes = (err, resp) => {
    return err ? {
        success: !err,
        msg: resp
    } : {
        success: !err,
        data: resp
    };
};

router.route('/api/v1/signIn').post((req, res, next) => {
    db_query.signIn(req.body).then((result) => {
        res.json(standardRes(result.err, {token: result.token}));
    }).catch((result) => {
        res.json(standardRes(result.err, {msg: result.msg}))
    });
});

router.route('/api/v1/cookie-session').post((req, res, next) => {
    db_query.cookieSession(req.body.cookie).then((result) => {
        res.json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.json(standardRes(result.err, {data: result.msg}));
    });
});

module.exports = router;

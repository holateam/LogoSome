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

router.route('/api/v1/login').post((req, res, next) => {
    db_query.login(req.body).then((result) => {
        res.status(200).json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.status(500).json(standardRes(result.err, result.data));
    });
});

router.route('/api/v1/registration').post((req, res, next) => {
    db_query.registration(req.body).then((result) => {
        res.status(200).json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.status(500).json(standardRes(result.err, result.data));
    });
});

router.route('/api/v1/cookie-session').post((req, res, next) => {
    db_query.cookieSession(req.body.cookie).then((result) => {
        res.status(200).json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.status(500).json(standardRes(result.err, result.data));
    });
});

module.exports = router;

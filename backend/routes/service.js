const express = require('express');
const router = express.Router();
const path = require('path');
const db_query = require('../modules/db_query');

let standardRes = (err, resp) => {
    return err ? {
        success: !err,
        msg: resp
    } : {
        success: !err,
        data: resp
    };
};

router.route('/api/v1/getUser').post((req, res, next) => {
    db_query.getUser(req.body).then((result) => {
        res.status(200).json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.status(500).json(standardRes(result.err, result.data));
    });
});

router.route('/api/v1/getFilesStream').post((req, res, next) => {
    db_query.getFilesStream(req.body).then((result) => {
        res.status(200).json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.status(500).json(standardRes(result.err, result.data));
    });
});

router.get('/api/v1/getUsers', (req, res, next) => {
    db_query.getUsers().then((result) => {
        res.status(200).json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.status(403).json(standardRes(result.err, result.data));
    });
});

router.route('/api/v1/saveTheInfoOfFile').post((req, res, next) => {
    db_query.saveTheInfoOfFile(req.body.userId, req.body.nameStream, req.body.namefile, req.body.linesNumber).then((result) => {
        res.status(200).json(standardRes(result.err, result.data));
    }).catch((result) => {
        res.status(500).json(standardRes(result.err, result.data));
    });
});

module.exports = router;
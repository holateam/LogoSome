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
        res.json(200, standardRes(result.err, result.data));
    }).catch((result) => {
        res.json(500, standardRes(result.err, result.data));
    });
});

router.route('api/v1/getFilesStream').post((req,res,next) => {
    console.log("DB: " + req.body);
   db_query.getFilesStream(req.body).then((result) => {
      res.json(200, standardRes(result.err, result.data));
   }).catch((result) => {
       res.json(500, standardRes(result.err, result.data));
   });
});

router.get('/api/v1/getUsers', (req, res, next) => {
    db_query.getUsers().then((result) => {
        console.log(JSON.stringify(result));
        res.json(200, standardRes(result.err, result.data));
    }).catch((result) => {
        res.json(403, standardRes(result.err, result.data));
    });

});

router.route('/api/v1/saveTheInfoOfFile').post((req, res, next) => {
    db_query.saveTheInfoOfFile(req.body.userId, req.body.nameStream, req.body.namefile).then((result) => {
        res.json(200, standardRes(result.err, result.data));
    }).catch((result) => {
        res.json(500, standardRes(result.err, result.data));
    });
});

module.exports = router;
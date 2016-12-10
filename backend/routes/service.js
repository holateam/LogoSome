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

router.get('/api/v1/getUsers', (req, res, next) => {
    db_query.getUsers().then((result) => {
        console.log(JSON.stringify(result));
       res.json(200, standardRes(result.err, result.data));
    }).catch((result) => {
        res.json(403, standardRes(result.err, result.data));
    });

});

router.post('/api/v1/saveTheInfoOfFile', (req,res, next) => {
    console.log(JSON.stringify(req));
});

// router.route('/api/v1/cookie-session').post((req, res, next) => {
//     db_query.cookieSession(req.body.cookie).then((result) => {
//         res.json(200, standardRes(result.err, result.data));
//     }).catch((result) => {
//         res.json(500, standardRes(result.err, result.data));
//     });
// });

module.exports = router;
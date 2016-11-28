/**
 * Created by lex on 28.11.16.
 */
const config = require('./config.json');
const express = require('express');
const app = express();
const server =  require('http').createServer(app);





server.listen(config.port, () => {
    console.log(`Web Server running on port ${config.port}`);
});

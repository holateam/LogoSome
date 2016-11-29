/**
 * Created by lex on 28.11.16.
 */
const config = require('./config.json');
const express = require('express');
const app = express();
const server =  require('http').createServer(app);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const routes = require('./routes/index');
const user = require ('.routes/user');

app.use(bodyParser.json({limit: '5mb'}));
app.use('/', routes);
app.use('/login', routes);


app.use(express.static(__dirname + "/public/"));


server.listen(config.port, () => {
    console.log(`Web Server running on port ${config.port}`);
});


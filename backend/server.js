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
const verifyRouter = require ('./routes/verify');

app.use(bodyParser.json({limit: '5mb'}));
app.use('/', routes);
app.use('/api/v1/signIn', verifyRouter);

// app.post('/api/v1/signIn', (req,res) => {
//     console.log("sdfsfsdf");
// });
app.use(express.static(__dirname + "/public/"));


server.listen(config.server.port, () => {
    console.log(`Web Server running on port ${config.port}`);
});


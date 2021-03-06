require("dotenv").config()

const createError = require('http-errors');

const fs = require('fs');
const http = require('http');
const https = require('https');
const privateKey  = fs.readFileSync('cert/localhost+1-key.pem', 'utf8');
const certificate = fs.readFileSync('cert/localhost+1.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const express = require('express')
const cors = require('cors')
const RateLimit = require('express-rate-limit');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const { match } = require('node-match-path')
const bodyParser = require('body-parser');

const limiter = RateLimit({
    windowMs: 1*60*1000, // 1 minutes 
    max: 100, // limit setiap IP selama windowMs
    delayMs: 0, // tidak ada delay, sampai batas maksimal request (MAX)
});

const whitelistCors = process.env.WHITELIST.split(",")

let tempWl = []
for (const key in whitelistCors) {
    if (Object.hasOwnProperty.call(whitelistCors, key)) {
        const ele = whitelistCors[key];
        if (ele.match(/\.\*/g)) {
            tempWl.push(ele)
        }
    }
}

let statusValidIp = false;

const corsOptions = {
    origin: function (origin, callback) {
        if (origin === undefined || origin === null) {
            origin = "undefined"
        }

        origin = origin.replace(/http:\/\/|https:\/\//ig,"")

        if (whitelistCors.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            for (const key in tempWl) {
                if (Object.hasOwnProperty.call(tempWl, key)) {
                    const ele = tempWl[key];
                    let valid = match(ele, origin)
                    if (valid.matches) {
                        statusValidIp = true
                        callback(null, true)
                        break;
                    }
                }
            }
        
            if (statusValidIp == false) {
                console.log("Ini origin nya yah : " + origin)
                callback(new Error('Not allowed by CORS'))
            }
        }
    }
}

const app = express();
app.use(bodyParser.json())
app.use(limiter)
app.use(cors(corsOptions))
app.disable('x-powered-by')

// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

const bookRoter = require(appDir+'/routes/book');

app.use('/', bookRoter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});
  
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? console.log(err) : {};

    // render the error page
    res.status(err.status || 500);
    res.send('Path Not Available');
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

if (process.env.SSL === "true") {
    module.exports = httpsServer;
} else {
    module.exports = httpServer;
}
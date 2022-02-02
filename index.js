const app = require('./bin/app');

app.listen(process.env.PORT, function() {
    console.log("App Running on : "+process.env.PORT)
})
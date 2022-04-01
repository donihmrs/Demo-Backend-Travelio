const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const userModel = require(appDir+'/model/userModel')

const bcrypt = require('bcrypt');
const saltRounds = 17;

const auth = {}

auth.validasi = async (req, res, next) => {
    bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
        // result == true
    });
}

auth.register = async (req, req, next) => {
    bcrypt.hash("M1r34cl3", saltRounds, function(err, hash) {
        console.log(hash)
    });
}

module.exports = auth;
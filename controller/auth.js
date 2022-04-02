const path = require('path');
const appDir = path.dirname(require.main.filename);
const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')
const userModel = require(appDir+'/model/userModel')

const bcrypt = require('bcrypt');
const saltRounds = 7;

const auth = {}

auth.validasi = async (req, res, next) => {
    const data = {}
    const user = req.body.username
    const password = req.body.password
    const company = req.body.company
    const database = req.body.database

    data['username'] = user
    data['company'] = company
    data['database'] = database

    const cekUser = await userModel.getByUser(data)
 
    if(cekUser.status == 200 && cekUser.data.length > 0) {
        bcrypt.compare(password, cekUser.data[0].user_password).then(function(result) {
            if (result) {
                res.status(200).send(cekUser)
            } else {
                const errRes = lib.responseError(400, "Username dan password tidak cocok")
                res.status(400).send(errRes)
            }
        });
    } else {
        res.status(400).send(cekUser)
    }
}

auth.register = async (req, res, next) => {
    bcrypt.hash("M1r34cl3", saltRounds, function(err, hash) {
        console.log(hash)
    });
}

module.exports = auth;
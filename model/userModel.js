const path = require('path');
const appDir = path.dirname(require.main.filename);
const lib = require(appDir+'/controller/lib')
const mysqlConf = require(appDir+'/controller/mysqlConf')

const userModel = {}

userModel.validasi = async (data) => {

}

module.exports = userModel;
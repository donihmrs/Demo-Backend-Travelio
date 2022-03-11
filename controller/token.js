const axios = require("axios")
const jwt = require('jsonwebtoken');
const token = {}

token.generateJwt = () => {
    return jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (parseInt(process.env.EXPIRED_TOKEN) * 60), //3 menit
        data: process.env.USER
    }, process.env.TOKEN);
}

token.verifyJwt = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (token == null) return res.sendStatus(403)

    return jwt.verify(token, process.env.TOKEN, (err) => {
        
        if (err) { 
            console.log(err)
            return res.sendStatus(401)
        }
    
        next()
    })
}

module.exports = token;
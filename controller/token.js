const axios = require("axios")
const jwt = require('jsonwebtoken');
const token = {}

token.tokenApiBe = () => {
    let data = {
        "Identitas":"Login Node dari Middleware LS",
        "Message":"Login Frontend Node"
    }

    return axios.post(process.env.API_BE+"/Api_Investigasi/getAccess", data, {
        headers: {
            'Post_User': process.env.API_USER_BE,
            'user': process.env.USER_BE,
            'Post_Pass': process.env.API_PASS_BE
        }
      }
    ).then(function(res) {
        if (res.data.status === 200) {
            return res.data.data.token
        } else {
            return null
        }
    }).catch(function (error) {
        console.log(error);
        return null
    });
}

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
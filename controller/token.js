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

token.getHrm = async () => {
    const setData = {}
    setData['client_id'] = process.env.CLIENT_ID
    setData['client_secret'] = process.env.CLIENT_SECRET
    setData['grant_type'] = "client_credentials"
    setData['username'] = process.env.CLIENT_USERNAME
    setData['password'] = process.env.CLIENT_PASSWORD
       
    return await axios.post(process.env.URL_API_HRM+"/oauth/issueToken",setData,{
        headers:{
            'content-type': 'application/json'
        }
    })
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.log(error);
        return 0;
      });
}
module.exports = token;
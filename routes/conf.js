const express = require('express');
const router = express.Router();
const axios = require("axios")
const path = require('path');
const appDir = path.dirname(require.main.filename);

const token = require(appDir+'/controller/token')
const lib = require(appDir+'/controller/lib')

router.post('/set',token.verifyJwt, function(req, res, next) {
    try {
        const getPathFile = req.body.path
        const nameFile = req.body.name
        const getTextFile = req.body.text

        const checkPath = getPathFile.substr(getPathFile.length - 1)

        let pathFile = getPathFile
        if (checkPath !== "/") {
            pathFile = getPathFile+"/"
        }

        if (pathFile !== "" && nameFile !== "" && getTextFile !== "") {
            try {
                const textFile = Buffer.from(getTextFile, 'base64').toString('utf-8');
                const writeFile = lib.writeFile(pathFile,nameFile,textFile)
                if (writeFile) {
                    res.status(200).send({
                        status:200,
                        data:{},
                        message:"Success, Save Config is finished for "+nameFile+ " & Path : "+pathFile
                    })
                } else {
                    res.status(400).send({
                        status:400,
                        data:{},
                        message:"Failed, Write file !!!. Please checked"
                    })
                }
            } catch (errFile) {
                console.log(errFile)
                res.status(500).send({
                    status:500,
                    data:{},
                    message:"Error, Please checked code Write File or File on server"
                })
            }
        } else {
            res.status(400).send({
                status:400,
                data:{},
                message:"Failed, Path file , Name file and Text file must be filled"
            })
        }
    } catch(err) {
        console.log(err)
        res.status(500).send({
            status:500,
            data:{},
            message:"Error, Please check code or server"
        })
    }
});

router.post('/restore',token.verifyJwt, function(req, res, next) {
    try {
        const getPathFile = req.body.path
        const nameFile = req.body.name

        const checkPath = getPathFile.substr(getPathFile.length - 1)

        let pathFile = getPathFile
        if (checkPath !== "/") {
            pathFile = getPathFile+"/"
        }

        if (pathFile !== "" && nameFile !== "") {
            try {
                const restoreFile = lib.restoreFile(pathFile,nameFile)
                if (restoreFile) {
                    res.status(200).send({
                        status:200,
                        data:{},
                        message:"Success, Restore Config is finished for "+nameFile+ " & Path : "+pathFile
                    })
                } else {
                    res.status(400).send({
                        status:400,
                        data:{},
                        message:"Failed, Restore file !!!. Please checked"
                    })
                }
            } catch (errFile) {
                console.log(errFile)
                res.status(500).send({
                    status:500,
                    data:{},
                    message:"Error, Please checked code Restore File or File on server"
                })
            }
        } else {
            res.status(400).send({
                status:400,
                data:{},
                message:"Failed, Path file and Name file must be filled"
            })
        }
    } catch(err) {
        console.log(err)
        res.status(500).send({
            status:500,
            data:{},
            message:"Error, Please check code or server"
        })
    }
});

module.exports = router;
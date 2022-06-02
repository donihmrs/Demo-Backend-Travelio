const path = require('path');
const appDir = path.dirname(require.main.filename);
const mongo = require(appDir+'/model/Db')
const axios = require('axios')

const bookModel = {}

bookModel.saveWishlist = async (data) => {
    return await mongo.main()
        .then( async () => {
            const insertData = await mongo.db.collection('wishlist').insertOne({idBrowser:data.id,dataJson:data.book})
            if (insertData) return true
            return false
        })
        .catch(console.error)
        .finally(() => mongo.mongoClient.close())
}

bookModel.delWishlist = async (data) => {
    return await mongo.main()
        .then( async () => {
            const deleteData = await mongo.db.collection('wishlist').deleteMany({idBrowser:data.id,dataJson:data.book})
            if (deleteData) return true
            return false
        })
        .catch(console.error)
        .finally(() => mongo.mongoClient.close())
}

bookModel.checkWishlist = async (data) => {
    return await mongo.main()
        .then( async () => {
            const cek = await mongo.db.collection('wishlist').find({idBrowser:data.id,dataJson:data.book}).toArray()
            if (cek.length > 0) {
                return true
            } else {
                return false
            }
        })
        .catch(console.error)
        .finally(() => mongo.mongoClient.close())
    
}

bookModel.getWishlist = async (data) => {
    return await mongo.main()
        .then( async () => {
            const getData = await mongo.db.collection('wishlist').find({idBrowser:data.id}).toArray()
            return getData
        })
        .catch(console.error)
        
}

bookModel.getApiBook = async (data) => {
    return axios.get("https://www.googleapis.com/books/v1/volumes?q="+data.word)
        .then(res => {
            return res.data
        })
        .catch(err => {
            return false
        })
}

module.exports = bookModel;
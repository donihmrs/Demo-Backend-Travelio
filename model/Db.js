const { MongoClient } = require('mongodb');
const url = 'mongodb://'+process.env.HOST_MONGO;
const dbName = process.env.DB_MONGO

let mongo = {}

mongo.mongoClient = new MongoClient(url);
mongo.main = async () => {
    await mongo.mongoClient.connect()
    mongo.db = mongo.mongoClient.db(dbName)  
    return true
}

module.exports = mongo
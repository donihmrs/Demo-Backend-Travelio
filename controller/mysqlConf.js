const mysqlConf = {}

const mysql = require('mysql2');

mysqlConf.pool = async (db) => {
    return await mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        port:process.env.MYSQL_PORT,
        database: db,
        waitForConnections: true,
        connectionLimit: process.env.MYSQL_CON_LIMIT,
        queueLimit: 0
    });
};

module.exports = mysqlConf;
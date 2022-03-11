const mysqlConf = {}

const mysql = require('mysql2');

mysqlConf.conn = async (db) => {
    return new Promise((resolve, reject) => {
        if (db == undefined) {
          const connectionBackup = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            port:process.env.MYSQL_PORT,
            database: process.env.MYSQL_DB_DEFAULT,
          });
    
          connectionBackup.connect(err => {
            if (err) {
              console.log("Error Connect Default Database "+String(err.sqlMessage))
              reject(err)
            } else {
              console.log("Success Connected Default Database "+process.env.MYSQL_DB_DEFAULT)
              resolve(connectionBackup)
            }
          }) 
        } else {
          const connection = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            port:process.env.MYSQL_PORT,
            database: db,
          });
    
          connection.connect(err => {
            if (err) {
              console.log("Error Connect Database "+String(err.sqlMessage))

              const connectionBackup = mysql.createConnection({
                  host: process.env.MYSQL_HOST,
                  user: process.env.MYSQL_USER,
                  password: process.env.MYSQL_PASSWORD,
                  port:process.env.MYSQL_PORT,
                  database: process.env.MYSQL_DB_DEFAULT,
              });

              connectionBackup.connect(err => {
                if (err) {
                  console.log("Error Connect Default Database "+String(err.sqlMessage))
                  reject(err)
                } else {
                  console.log("Success Connected Default Database "+process.env.MYSQL_DB_DEFAULT)
                  resolve(connectionBackup)
                }
              }) 
              
            } else {
              console.log("Success Connected Database "+db)
              resolve(connection)
            }
          })  
        }
      })
};

module.exports = mysqlConf;
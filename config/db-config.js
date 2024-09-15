const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'user_workspace_db',
    port: 3307
});

db.connect((error) => {
    if(error) throw error;
    console.log('Connected database successfully.');
});

module.exports = {db};
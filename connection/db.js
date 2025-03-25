const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Konfigurasi koneksi ke database MySQL local
const db = mysql.createPool({
  host: process.env.RAILWAY_TCP_PROXY_DOMAIN, // Ganti dengan host MySQL Anda
  user: process.env.MYSQLUSER, // Ganti dengan user MySQL Anda
  password: process.env.MYSQLPASSWORD, // Ganti dengan password MySQL Anda
  database: process.env.MYSQL_DATABASE, // Nama database Anda
  port: process.env.RAILWAY_TCP_PROXY_PORT,
});

// Hosting
// const db = mysql.createPool({
//   host: '6jm0l.h.filess.io', // Ganti dengan host MySQL Anda
//   user: 'DBWaterSensors_shotdigmet', // Ganti dengan user MySQL Anda
//   password: '4c0cf57e452c0606a822bac607af57fbea4859b1', // Ganti dengan password MySQL Anda
//   database: 'DBWaterSensors_shotdigmet', // Nama database Anda
//   port: 3307,
// });

// Cek koneksi
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
  } else {
    console.log('Connected to MySQL database');
    connection.release();
  }
});

module.exports = db.promise(); // Ekspor dalam bentuk promise

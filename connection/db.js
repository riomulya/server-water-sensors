const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// // Konfigurasi koneksi ke database MySQL local
const db = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST, // Ganti dengan host MySQL Anda
  user: process.env.MYSQL_ADDON_USER, // Ganti dengan user MySQL Anda
  password: process.env.MYSQL_ADDON_PASSWORD, // Ganti dengan password MySQL Anda
  database: process.env.MYSQL_ADDON_DB, // Nama database Anda
  port: process.env.MYSQL_ADDON_PORT,
});

// Local;
// const db = mysql.createPool({
//   host: '127.0.0.1', // Ganti dengan host MySQL Anda
//   user: 'root', // Ganti dengan user MySQL Anda
//   password: '', // Ganti dengan password MySQL Anda
//   database: 'db_watersensors', // Nama database Anda
//   port: 3306,
// });

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

const mysql = require('mysql2');

// Konfigurasi koneksi ke database MySQL
// const db = mysql.createPool({
//   host: 'localhost', // Ganti dengan host MySQL Anda
//   user: 'root', // Ganti dengan user MySQL Anda
//   password: '', // Ganti dengan password MySQL Anda
//   database: 'db_watersensors', // Nama database Anda
// });

// Hosting
const db = mysql.createPool({
  host: 'baczd.h.filess.io', // Ganti dengan host MySQL Anda
  user: 'watersensors_tinysport', // Ganti dengan user MySQL Anda
  password: '6eeb9bfec80a161e71774d1ec2665527da29121b', // Ganti dengan password MySQL Anda
  database: 'watersensors_tinysport', // Nama database Anda
});

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

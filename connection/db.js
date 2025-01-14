const mysql = require('mysql2');

// Konfigurasi koneksi ke database MySQL
const db = mysql.createPool({
  host: 'localhost', // Ganti dengan host MySQL Anda
  user: 'root', // Ganti dengan user MySQL Anda
  password: 'root', // Ganti dengan password MySQL Anda
  database: 'db_watersensors', // Nama database Anda
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

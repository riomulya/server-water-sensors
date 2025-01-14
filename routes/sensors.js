const express = require('express');
const router = express.Router();
const db = require('../connection/db'); // Import koneksi database

// Route untuk tabel data_accel_x
router.get('/data_accel_x', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_accel_x');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route untuk tabel data_accel_y
router.get('/data_accel_y', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_accel_y');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route untuk tabel data_accel_z
router.get('/data_accel_z', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_accel_z');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route untuk tabel data_temperature
router.get('/data_temperature', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_temperature');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route untuk tabel data_turbidity
router.get('/data_turbidity', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_turbidity');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/data_ph', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_ph');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/data_lokasi', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_lokasi');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/data_user', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_user');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/data_hasil_prediksi', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_hasil_prediksi');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route untuk mengambil semua data sensor berdasarkan id_lokasi
router.get('/sensors/:id_lokasi', async (req, res) => {
  const { id_lokasi } = req.params;

  try {
    const query = `
            SELECT *
            FROM data_lokasi l
            LEFT JOIN data_accel_x ax ON l.id_lokasi = ax.id_lokasi
            LEFT JOIN data_accel_y ay ON l.id_lokasi = ay.id_lokasi
            LEFT JOIN data_accel_z az ON l.id_lokasi = az.id_lokasi
            LEFT JOIN data_ph ph ON l.id_lokasi = ph.id_lokasi
            LEFT JOIN data_temperature temp ON l.id_lokasi = temp.id_lokasi
            LEFT JOIN data_turbidity turb ON l.id_lokasi = turb.id_lokasi
            WHERE l.id_lokasi = ?
        `;

    const [rows] = await db.query(query, [id_lokasi]);

    if (rows.length > 0) {
      res.json({
        success: true,
        data: rows,
      });
    } else {
      res.json({
        success: false,
        message: `No sensor data found for id_lokasi: ${id_lokasi}`,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;

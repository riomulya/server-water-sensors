const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_accel_z
const getDataAccelZ = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_accel_z');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDataAccelZ = async (req, res) => {
  const { id_lokasi, nilai_accel_z, lat, lon } = req.body;
  const id_accel_z = `id_accel_z_${generateRandomId()}`; // Format ID sesuai dengan sensor
  const tanggal = getCurrentDate(); // Mendapatkan tanggal saat ini

  try {
    const result = await db.query(
      'INSERT INTO data_accel_z (id_accel_z, id_lokasi, nilai_accel_z, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_accel_z, id_lokasi, nilai_accel_z, lat, lon, tanggal]
    );
    res.json({
      success: true,
      message: 'Data inserted successfully',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDataAccelZ = async (req, res) => {
  const { id_accel_z } = req.params;
  const { id_lokasi, nilai_accel_z, lat, lon } = req.body;
  try {
    const result = await db.query(
      'UPDATE data_accel_z SET id_lokasi = ?, nilai_accel_z = ?, lat = ?, lon = ? WHERE id_accel_z = ?',
      [id_lokasi, nilai_accel_z, lat, lon, id_accel_z]
    );
    res.json({
      success: true,
      message: 'Data updated successfully',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDataAccelZ = async (req, res) => {
  const { id_accel_z } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM data_accel_z WHERE id_accel_z = ?',
      [id_accel_z]
    );
    res.json({
      success: true,
      message: 'Data deleted successfully',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDataAccelZ,
  createDataAccelZ,
  updateDataAccelZ,
  deleteDataAccelZ,
};

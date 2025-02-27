const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_accel_z
const getDataAccelZ = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query untuk mengambil data dengan LIMIT dan OFFSET
    const [rows] = await db.query(
      'SELECT * FROM data_accel_z ORDER BY tanggal DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    // Query untuk menghitung total data
    const [totalRows] = await db.query(
      'SELECT COUNT(*) AS total FROM data_accel_z'
    );

    const totalPage = Math.ceil(totalRows[0].total / limit);

    res.json({
      success: true,
      data: rows,
      total: totalRows[0].total, // Total data
      page,
      totalPage,
      limit,
    });
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

const getDataAccelZByIdLokasi = async (req, res) => {
  try {
    const { id_lokasi } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query data berdasarkan id_lokasi dengan pagination
    const [rows] = await db.query(
      'SELECT * FROM data_accel_z WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT ? OFFSET ?',
      [id_lokasi, limit, offset]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan untuk lokasi ini',
      });
    }

    // Query total data berdasarkan id_lokasi
    const [totalRows] = await db.query(
      'SELECT COUNT(*) AS total FROM data_accel_z WHERE id_lokasi = ?',
      [id_lokasi]
    );

    const totalPage = Math.ceil(totalRows[0].total / limit);

    res.json({
      success: true,
      data: rows,
      total: totalRows[0].total,
      page,
      totalPage,
      limit,
      id_lokasi,
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
  getDataAccelZByIdLokasi,
};

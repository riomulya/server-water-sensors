const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_temperature
const getDataTemperature = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query untuk mengambil data dengan LIMIT dan OFFSET
    const [rows] = await db.query(
      'SELECT * FROM data_temperature ORDER BY tanggal DESC LIMIT ? OFFSET ?',
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
      'SELECT COUNT(*) AS total FROM data_temperature'
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

const createDataTemperature = async (req, res) => {
  const { id_lokasi, nilai_temperature, lat, lon } = req.body;
  const id_temperature = `id_temperature_${generateRandomId()}`; // Format ID sesuai dengan sensor
  const tanggal = getCurrentDate(); // Mendapatkan tanggal saat ini

  try {
    const result = await db.query(
      'INSERT INTO data_temperature (id_temperature, id_lokasi, nilai_temperature, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_temperature, id_lokasi, nilai_temperature, lat, lon, tanggal]
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

const updateDataTemperature = async (req, res) => {
  const { id_temperature } = req.params;
  const { id_lokasi, nilai_temperature, lat, lon } = req.body;

  try {
    const result = await db.query(
      'UPDATE data_temperature SET id_lokasi = ?, nilai_temperature = ?, lat = ?, lon = ? WHERE id_temperature = ?',
      [id_lokasi, nilai_temperature, lat, lon, id_temperature]
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

const deleteDataTemperature = async (req, res) => {
  const { id_temperature } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM data_temperature WHERE id_temperature = ?',
      [id_temperature]
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

const getDataTemperatureByIdLokasi = async (req, res) => {
  try {
    const { id_lokasi } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query data berdasarkan id_lokasi dengan pagination
    const [rows] = await db.query(
      'SELECT * FROM data_temperature WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT ? OFFSET ?',
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
      'SELECT COUNT(*) AS total FROM data_temperature WHERE id_lokasi = ?',
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
  getDataTemperature,
  createDataTemperature,
  updateDataTemperature,
  deleteDataTemperature,
  getDataTemperatureByIdLokasi,
};

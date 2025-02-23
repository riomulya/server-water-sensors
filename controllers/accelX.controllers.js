const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_accel_x
const getDataAccelX = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query untuk mengambil data dengan LIMIT dan OFFSET
    const [rows] = await db.query(
      'SELECT * FROM data_accel_x ORDER BY tanggal DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    // Query untuk menghitung total data
    const [totalRows] = await db.query(
      'SELECT COUNT(*) AS total FROM data_accel_x'
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

const getDataAccelXByIdLokasi = async (req, res) => {
  try {
    const { id_lokasi } = req.query;
    if (!id_lokasi) {
      return res
        .status(400)
        .json({ success: false, message: 'id_lokasi parameter is required' });
    }

    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query dengan filter id_lokasi
    const [rows] = await db.query(
      'SELECT * FROM data_accel_x WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT ? OFFSET ?',
      [id_lokasi, limit, offset]
    );

    // Hitung total data per lokasi
    const [totalRows] = await db.query(
      'SELECT COUNT(*) AS total FROM data_accel_x WHERE id_lokasi = ?',
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
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDataAccelX = async (req, res) => {
  const { id_lokasi, nilai_accel_x, lat, lon } = req.body;
  const id_accel_x = `id_accel_x_${generateRandomId()}`; // Format ID sesuai dengan sensor
  const tanggal = getCurrentDate(); // Mendapatkan tanggal saat ini

  try {
    const result = await db.query(
      'INSERT INTO data_accel_x (id_accel_x, id_lokasi, nilai_accel_x, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_accel_x, id_lokasi, nilai_accel_x, lat, lon, tanggal]
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

const updateDataAccelX = async (req, res) => {
  const { id_accel_x } = req.params;
  const { id_lokasi, nilai_accel_x, lat, lon } = req.body;
  try {
    const result = await db.query(
      'UPDATE data_accel_x SET id_lokasi = ?, nilai_accel_x = ?, lat = ?, lon = ? WHERE id_accel_x = ?',
      [id_lokasi, nilai_accel_x, lat, lon, id_accel_x]
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

const deleteDataAccelX = async (req, res) => {
  const { id_accel_x } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM data_accel_x WHERE id_accel_x = ?',
      [id_accel_x]
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
  getDataAccelX,
  getDataAccelXByIdLokasi,
  createDataAccelX,
  updateDataAccelX,
  deleteDataAccelX,
};

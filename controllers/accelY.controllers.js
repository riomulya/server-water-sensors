const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_accel_y
const getDataAccelY = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query untuk mengambil data dengan LIMIT dan OFFSET
    const [rows] = await db.query(
      'SELECT * FROM data_accel_y ORDER BY tanggal DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    // Query untuk menghitung total data
    const [totalRows] = await db.query(
      'SELECT COUNT(*) AS total FROM data_accel_y'
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

const createDataAccelY = async (req, res) => {
  const { id_lokasi, nilai_accel_y, lat, lon } = req.body;
  const id_accel_y = `id_accel_y_${generateRandomId()}`; // Format ID sesuai dengan sensor
  const tanggal = getCurrentDate(); // Mendapatkan tanggal saat ini

  try {
    const result = await db.query(
      'INSERT INTO data_accel_y (id_accel_y, id_lokasi, nilai_accel_y, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_accel_y, id_lokasi, nilai_accel_y, lat, lon, tanggal]
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

const updateDataAccelY = async (req, res) => {
  const { id_accel_y } = req.params;
  const { id_lokasi, nilai_accel_y, lat, lon } = req.body;
  try {
    const result = await db.query(
      'UPDATE data_accel_y SET id_lokasi = ?, nilai_accel_y = ?, lat = ?, lon = ? WHERE id_accel_y = ?',
      [id_lokasi, nilai_accel_y, lat, lon, id_accel_y]
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

const deleteDataAccelY = async (req, res) => {
  const { id_accel_y } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM data_accel_y WHERE id_accel_y = ?',
      [id_accel_y]
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
  getDataAccelY,
  createDataAccelY,
  updateDataAccelY,
  deleteDataAccelY,
};

const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_accel_x
const getDataAccelX = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const range = req.query.range;

    // Validasi parameter range
    const validRanges = { '1d': 1, '7d': 7, '30d': 30 }; // Menggunakan objek untuk mapping
    if (range && !validRanges.hasOwnProperty(range)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid range parameter. Valid values: 1d, 7d, 30d',
      });
    }

    // Query dasar
    let baseQuery = 'SELECT * FROM data_accel_x';
    let countQuery = 'SELECT COUNT(*) AS total FROM data_accel_x';
    const queryParams = [];
    const countParams = [];

    // Tambahkan filter tanggal jika ada range
    if (range) {
      const days = validRanges[range]; // Ambil nilai dari mapping
      baseQuery += ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      countQuery += ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      queryParams.push(days);
      countParams.push(days);
    }

    // Tambahkan sorting dan pagination
    baseQuery += ' ORDER BY tanggal DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.query(baseQuery, queryParams);
    const [totalRows] = await db.query(countQuery, countParams);

    const totalPage = Math.ceil(totalRows[0].total / limit);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

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
    const { id_lokasi, range } = req.query;

    // Validasi parameter
    if (!id_lokasi) {
      return res.status(400).json({
        success: false,
        message: 'id_lokasi parameter is required',
      });
    }

    const validRanges = ['1d', '7d', '30d'];
    if (range && !validRanges.includes(range)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid range parameter. Valid values: 1d, 7d, 30d',
      });
    }

    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query dasar
    let baseQuery = 'SELECT * FROM data_accel_x WHERE id_lokasi = ?';
    let countQuery =
      'SELECT COUNT(*) AS total FROM data_accel_x WHERE id_lokasi = ?';
    const queryParams = [id_lokasi];
    const countParams = [id_lokasi];

    // Tambahkan filter tanggal jika ada range
    if (range) {
      const days = parseInt(range);
      baseQuery += ' AND tanggal >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      countQuery += ' AND tanggal >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      queryParams.push(days);
      countParams.push(days);
    }

    // Tambahkan sorting dan pagination
    baseQuery += ' ORDER BY tanggal DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.query(baseQuery, queryParams);
    const [totalRows] = await db.query(countQuery, countParams);

    const totalPage = Math.ceil(totalRows[0].total / limit);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan untuk lokasi ini',
      });
    }

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

    // Emit event ke semua client
    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'accelX',
        action: 'create',
        data: result,
      });
    }

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

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'accelX',
        action: 'update',
        data: result,
      });
    }

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

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'accelX',
        action: 'delete',
        data: result,
      });
    }

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

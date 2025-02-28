const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_turbidity
const getDataTurbidity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const range = req.query.range;

    // Validasi parameter range
    const validRanges = { '1d': 1, '7d': 7, '30d': 30 };
    if (range && !validRanges.hasOwnProperty(range)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid range parameter. Valid values: 1d, 7d, 30d',
      });
    }

    // Query dasar
    let baseQuery = 'SELECT * FROM data_turbidity';
    let countQuery = 'SELECT COUNT(*) AS total FROM data_turbidity';
    const queryParams = [];
    const countParams = [];

    // Tambahkan filter tanggal jika ada range
    if (range) {
      const days = validRanges[range];
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

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: rows,
      total: totalRows[0].total,
      page,
      totalPage: Math.ceil(totalRows[0].total / limit),
      limit,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDataTurbidity = async (req, res) => {
  const { id_lokasi, nilai_turbidity, lat, lon } = req.body;
  const id_turbidity = `id_turbidity_${generateRandomId()}`; // Format ID sesuai dengan sensor
  const tanggal = getCurrentDate(); // Mendapatkan tanggal saat ini

  try {
    const result = await db.query(
      'INSERT INTO data_turbidity (id_turbidity, id_lokasi, nilai_turbidity, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_turbidity, id_lokasi, nilai_turbidity, lat, lon, tanggal]
    );

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'turbidity',
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

const updateDataTurbidity = async (req, res) => {
  const { id_turbidity } = req.params;
  const { id_lokasi, nilai_turbidity, lat, lon } = req.body;

  try {
    const result = await db.query(
      'UPDATE data_turbidity SET id_lokasi = ?, nilai_turbidity = ?, lat = ?, lon = ? WHERE id_turbidity = ?',
      [id_lokasi, nilai_turbidity, lat, lon, id_turbidity]
    );

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'turbidity',
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

const deleteDataTurbidity = async (req, res) => {
  const { id_turbidity } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM data_turbidity WHERE id_turbidity = ?',
      [id_turbidity]
    );

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'turbidity',
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

const getDataTurbidityByIdLokasi = async (req, res) => {
  try {
    const { id_lokasi } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Query data berdasarkan id_lokasi dengan pagination
    const [rows] = await db.query(
      'SELECT * FROM data_turbidity WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT ? OFFSET ?',
      [id_lokasi, limit, offset]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan untuk lokasi ini',
      });
    }

    // Query total data berdasarkan id_lokasi
    const [totalRows] = await db.query(
      'SELECT COUNT(*) AS total FROM data_turbidity WHERE id_lokasi = ?',
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
  getDataTurbidity,
  createDataTurbidity,
  updateDataTurbidity,
  deleteDataTurbidity,
  getDataTurbidityByIdLokasi,
};

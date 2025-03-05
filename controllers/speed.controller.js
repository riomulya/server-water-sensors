const db = require('../connection/db');
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_speed
const getDataSpeed = async (req, res) => {
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
    let baseQuery = 'SELECT * FROM data_speed';
    let countQuery = 'SELECT COUNT(*) AS total FROM data_speed';
    const queryParams = [];
    const countParams = [];

    // Filter tanggal
    if (range) {
      const days = validRanges[range];
      baseQuery += ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      countQuery += ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      queryParams.push(days);
      countParams.push(days);
    }

    // Sorting dan pagination
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

// Fungsi reusable dengan transaction support
const createSpeedEntry = async (data, connection) => {
  const { id_lokasi, nilai_speed, lat, lon, tanggal } = data;
  const id_speed = `id_speed_${generateRandomId()}`;

  return connection.query(
    'INSERT INTO data_speed (id_speed, id_lokasi, nilai_speed, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
    [id_speed, id_lokasi, nilai_speed, lat, lon, tanggal]
  );
};

// Controller create dengan transaction
const createDataSpeed = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await createSpeedEntry(req.body, connection);
    await connection.commit();

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'speed',
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
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

const updateDataSpeed = async (req, res) => {
  const { id_speed } = req.params;
  const { id_lokasi, nilai_speed, lat, lon } = req.body;

  try {
    const result = await db.query(
      'UPDATE data_speed SET id_lokasi = ?, nilai_speed = ?, lat = ?, lon = ? WHERE id_speed = ?',
      [id_lokasi, nilai_speed, lat, lon, id_speed]
    );

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'speed',
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

const deleteDataSpeed = async (req, res) => {
  const { id_speed } = req.params;
  try {
    const result = await db.query('DELETE FROM data_speed WHERE id_speed = ?', [
      id_speed,
    ]);

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'speed',
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

const getDataSpeedByIdLokasi = async (req, res) => {
  try {
    const { id_lokasi } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      'SELECT * FROM data_speed WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT ? OFFSET ?',
      [id_lokasi, limit, offset]
    );

    const [totalRows] = await db.query(
      'SELECT COUNT(*) AS total FROM data_speed WHERE id_lokasi = ?',
      [id_lokasi]
    );

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
      totalPage: Math.ceil(totalRows[0].total / limit),
      limit,
      id_lokasi,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDataSpeed,
  createDataSpeed,
  createSpeedEntry,
  updateDataSpeed,
  deleteDataSpeed,
  getDataSpeedByIdLokasi,
};

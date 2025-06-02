const db = require('../connection/db');
const { ulid } = require('ulid');
// Controller untuk data_speed
const getDataSpeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const range = req.query.range;

    // Parse range parameter (e.g., "3h", "3d", "3m", "1y")
    let interval = null;
    let intervalUnit = null;

    if (range) {
      const regex = /^(\d+)([hdmy])$/;
      const matches = range.match(regex);

      if (!matches) {
        return res.status(400).json({
          success: false,
          message: 'Invalid range format. Valid examples: 3h, 7d, 2m, 1y',
        });
      }

      interval = parseInt(matches[1]);
      intervalUnit = matches[2];

      // Map the unit to MySQL interval unit
      const unitMap = {
        h: 'HOUR',
        d: 'DAY',
        m: 'MONTH',
        y: 'YEAR',
      };

      intervalUnit = unitMap[intervalUnit];
    }

    // Query dasar
    let baseQuery = 'SELECT * FROM data_speed';
    let countQuery = 'SELECT COUNT(*) AS total FROM data_speed';
    const queryParams = [];
    const countParams = [];

    // Filter tanggal
    if (range && interval && intervalUnit) {
      baseQuery +=
        ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? ' + intervalUnit + ')';
      countQuery +=
        ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? ' + intervalUnit + ')';
      queryParams.push(interval);
      countParams.push(interval);
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
  const id_speed = ulid();

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
    const range = req.query.range;
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Parse range parameter (e.g., "3h", "3d", "3m", "1y")
    let interval = null;
    let intervalUnit = null;

    if (range) {
      const regex = /^(\d+)([hdmy])$/;
      const matches = range.match(regex);

      if (!matches) {
        return res.status(400).json({
          success: false,
          message: 'Invalid range format. Valid examples: 3h, 7d, 2m, 1y',
        });
      }

      interval = parseInt(matches[1]);
      intervalUnit = matches[2];

      // Map the unit to MySQL interval unit
      const unitMap = {
        h: 'HOUR',
        d: 'DAY',
        m: 'MONTH',
        y: 'YEAR',
      };

      intervalUnit = unitMap[intervalUnit];
    }

    // Query dasar
    let baseQuery = 'SELECT * FROM data_speed WHERE id_lokasi = ?';
    let countQuery =
      'SELECT COUNT(*) AS total FROM data_speed WHERE id_lokasi = ?';
    const queryParams = [id_lokasi];
    const countParams = [id_lokasi];

    // Tambahkan filter tanggal jika ada range
    if (range && interval && intervalUnit) {
      baseQuery +=
        ' AND tanggal >= DATE_SUB(NOW(), INTERVAL ? ' + intervalUnit + ')';
      countQuery +=
        ' AND tanggal >= DATE_SUB(NOW(), INTERVAL ? ' + intervalUnit + ')';
      queryParams.push(interval);
      countParams.push(interval);
    }

    // Tambahkan sorting dan pagination
    baseQuery += ' ORDER BY tanggal DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.query(baseQuery, queryParams);
    const [totalRows] = await db.query(countQuery, countParams);

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

const getDataSpeedById = async (req, res) => {
  const { id_speed } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM data_speed WHERE id_speed = ?',
      [id_speed]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: rows[0],
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
  getDataSpeedById,
};

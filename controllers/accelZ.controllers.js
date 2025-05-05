const db = require('../connection/db'); // Import koneksi database
const { ulid } = require('ulid');

// Controller untuk data_accel_z
const getDataAccelZ = async (req, res) => {
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
    let baseQuery = 'SELECT * FROM data_accel_z';
    let countQuery = 'SELECT COUNT(*) AS total FROM data_accel_z';
    const queryParams = [];
    const countParams = [];

    // Tambahkan filter tanggal jika ada range
    if (range && interval && intervalUnit) {
      baseQuery +=
        ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? ' + intervalUnit + ')';
      countQuery +=
        ' WHERE tanggal >= DATE_SUB(NOW(), INTERVAL ? ' + intervalUnit + ')';
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
const createAccelZEntry = async (data, connection) => {
  const { id_lokasi, nilai_accel_z, lat, lon, tanggal } = data;
  const id_accel_z = ulid();
  // const tanggal = getCurrentDate();

  return connection.query(
    'INSERT INTO data_accel_z (id_accel_z, id_lokasi, nilai_accel_z, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
    [id_accel_z, id_lokasi, nilai_accel_z, lat, lon, tanggal]
  );
};

// Controller create dengan transaction
const createDataAccelZ = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const result = await createAccelZEntry(req.body, connection);

    await connection.commit();

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'accelZ',
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

const updateDataAccelZ = async (req, res) => {
  const { id_accel_z } = req.params;
  const { id_lokasi, nilai_accel_z, lat, lon } = req.body;
  try {
    const result = await db.query(
      'UPDATE data_accel_z SET id_lokasi = ?, nilai_accel_z = ?, lat = ?, lon = ? WHERE id_accel_z = ?',
      [id_lokasi, nilai_accel_z, lat, lon, id_accel_z]
    );

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'accelZ',
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

const deleteDataAccelZ = async (req, res) => {
  const { id_accel_z } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM data_accel_z WHERE id_accel_z = ?',
      [id_accel_z]
    );

    if (req.io) {
      req.io.emit('sensor-data-changed', {
        type: 'accelZ',
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

const getDataAccelZByIdLokasi = async (req, res) => {
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
    let baseQuery = 'SELECT * FROM data_accel_z WHERE id_lokasi = ?';
    let countQuery =
      'SELECT COUNT(*) AS total FROM data_accel_z WHERE id_lokasi = ?';
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

    // Query data berdasarkan id_lokasi dengan pagination
    const [rows] = await db.query(baseQuery, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan untuk lokasi ini',
      });
    }

    // Query total data berdasarkan id_lokasi
    const [totalRows] = await db.query(countQuery, countParams);

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
  createAccelZEntry,
  updateDataAccelZ,
  deleteDataAccelZ,
  getDataAccelZByIdLokasi,
};

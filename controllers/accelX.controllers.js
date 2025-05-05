const db = require('../connection/db'); // Import koneksi database
const { ulid } = require('ulid');

// Fungsi reusable untuk create data
const createAccelXEntry = async (data) => {
  const { id_lokasi, nilai_accel_x, lat, lon, tanggal } = data;
  const id_accel_x = ulid();
  // const tanggal = getCurrentDate();

  return await db.query(
    'INSERT INTO data_accel_x (id_accel_x, id_lokasi, nilai_accel_x, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
    [id_accel_x, id_lokasi, nilai_accel_x, lat, lon, tanggal]
  );
};

// Controller untuk data_accel_x
const getDataAccelX = async (req, res) => {
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
    let baseQuery = 'SELECT * FROM data_accel_x';
    let countQuery = 'SELECT COUNT(*) AS total FROM data_accel_x';
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
    const { id_lokasi } = req.params;
    const { range } = req.query;

    // Validasi parameter
    if (!id_lokasi) {
      return res.status(400).json({
        success: false,
        message: 'id_lokasi parameter is required',
      });
    }

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
  try {
    const result = await createAccelXEntry(req.body);
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
  createAccelXEntry,
  updateDataAccelX,
  deleteDataAccelX,
};

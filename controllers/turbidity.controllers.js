const db = require('../connection/db'); // Import koneksi database
const { ulid } = require('ulid');

// Controller untuk data_turbidity
const getDataTurbidity = async (req, res) => {
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
    let baseQuery = 'SELECT * FROM data_turbidity';
    let countQuery = 'SELECT COUNT(*) AS total FROM data_turbidity';
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
const createTurbidityEntry = async (data, connection) => {
  const { id_lokasi, nilai_turbidity, lat, lon, tanggal } = data;
  const id_turbidity = ulid();
  // const tanggal = getCurrentDate();

  return connection.query(
    'INSERT INTO data_turbidity (id_turbidity, id_lokasi, nilai_turbidity, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
    [id_turbidity, id_lokasi, nilai_turbidity, lat, lon, tanggal]
  );
};

// Controller create dengan transaction
const createDataTurbidity = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const result = await createTurbidityEntry(req.body, connection);

    await connection.commit();

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
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
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
  createTurbidityEntry,
  updateDataTurbidity,
  deleteDataTurbidity,
  getDataTurbidityByIdLokasi,
};

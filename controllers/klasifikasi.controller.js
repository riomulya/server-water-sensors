const db = require('../connection/db');
const axios = require('axios');

// Function to fetch prediction from ML API
exports.getPrediction = async (phValue, temperatureValue, turbidityValue) => {
  try {
    const response = await axios.post(
      'https://pw-brin-ml.onrender.com/api/predict',
      {
        pH: parseFloat(phValue),
        temperature: parseFloat(temperatureValue),
        turbidity: parseFloat(turbidityValue),
      }
    );

    // Rename prediction to klasifikasi and reason to detail
    return {
      klasifikasi: response.data.prediction,
      detail: response.data.reason,
    };
  } catch (err) {
    console.error('Error calling prediction API:', err);
    return {
      klasifikasi: '0',
      detail: 'Failed to get prediction',
    };
  }
};

// Create new klasifikasi entry
exports.createKlasifikasi = async (data, conn = null) => {
  const connection = conn || (await db.getConnection());
  let result = null;
  try {
    const [rows] = await connection.query(
      `INSERT INTO data_klasifikasi 
      (id_lokasi, klasifikasi, detail, id_accel_x, id_accel_y, id_accel_z, 
       id_ph, id_speed, id_temperature, id_turbidity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id_lokasi,
        data.klasifikasi || '0',
        data.detail || null,
        data.id_accel_x || null,
        data.id_accel_y || null,
        data.id_accel_z || null,
        data.id_ph || null,
        data.id_speed || null,
        data.id_temperature || null,
        data.id_turbidity || null,
      ]
    );
    result = { id: rows.insertId, success: true };
  } catch (err) {
    console.error('Error creating klasifikasi entry:', err);
    result = { success: false, error: err.message };
  } finally {
    if (!conn && connection) connection.release();
    return result;
  }
};

// Get all klasifikasi entries
exports.getAllKlasifikasi = async () => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM data_klasifikasi
      ORDER BY tanggal DESC
    `);
    return rows;
  } catch (err) {
    console.error('Error fetching klasifikasi data:', err);
    return [];
  } finally {
    connection.release();
  }
};

// Get klasifikasi by ID
exports.getKlasifikasiById = async (id_klasifikasi) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_klasifikasi = ?',
      [id_klasifikasi]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error(`Error fetching klasifikasi with ID ${id_klasifikasi}:`, err);
    return null;
  } finally {
    connection.release();
  }
};

// Get klasifikasi by location ID
exports.getKlasifikasiByLocation = async (id_lokasi) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_lokasi = ? ORDER BY tanggal DESC',
      [id_lokasi]
    );
    return rows;
  } catch (err) {
    console.error(`Error fetching klasifikasi for location ${id_lokasi}:`, err);
    return [];
  } finally {
    connection.release();
  }
};

// Update klasifikasi
exports.updateKlasifikasi = async (id_klasifikasi, data) => {
  const connection = await db.getConnection();
  try {
    const [result] = await connection.query(
      `UPDATE data_klasifikasi SET 
        klasifikasi = ?, 
        detail = ?, 
        id_lokasi = ?,
        id_accel_x = ?, 
        id_accel_y = ?, 
        id_accel_z = ?, 
        id_ph = ?, 
        id_speed = ?, 
        id_temperature = ?, 
        id_turbidity = ?
      WHERE id_klasifikasi = ?`,
      [
        data.klasifikasi,
        data.detail,
        data.id_lokasi,
        data.id_accel_x,
        data.id_accel_y,
        data.id_accel_z,
        data.id_ph,
        data.id_speed,
        data.id_temperature,
        data.id_turbidity,
        id_klasifikasi,
      ]
    );
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows,
    };
  } catch (err) {
    console.error(`Error updating klasifikasi with ID ${id_klasifikasi}:`, err);
    return { success: false, error: err.message };
  } finally {
    connection.release();
  }
};

// Delete klasifikasi
exports.deleteKlasifikasi = async (id_klasifikasi) => {
  const connection = await db.getConnection();
  try {
    const [result] = await connection.query(
      'DELETE FROM data_klasifikasi WHERE id_klasifikasi = ?',
      [id_klasifikasi]
    );
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows,
    };
  } catch (err) {
    console.error(`Error deleting klasifikasi with ID ${id_klasifikasi}:`, err);
    return { success: false, error: err.message };
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by PH sensor ID
exports.getKlasifikasiByPHId = async (id_ph) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_ph = ? ORDER BY tanggal DESC',
      [id_ph]
    );
    return rows;
  } catch (err) {
    console.error(`Error fetching klasifikasi for PH sensor ${id_ph}:`, err);
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Temperature sensor ID
exports.getKlasifikasiByTemperatureId = async (id_temperature) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_temperature = ? ORDER BY tanggal DESC',
      [id_temperature]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Temperature sensor ${id_temperature}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Turbidity sensor ID
exports.getKlasifikasiByTurbidityId = async (id_turbidity) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_turbidity = ? ORDER BY tanggal DESC',
      [id_turbidity]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Turbidity sensor ${id_turbidity}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Accel X sensor ID
exports.getKlasifikasiByAccelXId = async (id_accel_x) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_accel_x = ? ORDER BY tanggal DESC',
      [id_accel_x]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel X sensor ${id_accel_x}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Accel Y sensor ID
exports.getKlasifikasiByAccelYId = async (id_accel_y) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_accel_y = ? ORDER BY tanggal DESC',
      [id_accel_y]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel Y sensor ${id_accel_y}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Accel Z sensor ID
exports.getKlasifikasiByAccelZId = async (id_accel_z) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_accel_z = ? ORDER BY tanggal DESC',
      [id_accel_z]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel Z sensor ${id_accel_z}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Speed sensor ID
exports.getKlasifikasiBySpeedId = async (id_speed) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_speed = ? ORDER BY tanggal DESC',
      [id_speed]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Speed sensor ${id_speed}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi with sensor data
exports.getAllKlasifikasiWithSensorData = async () => {
  const connection = await db.getConnection();
  try {
    // Get all klasifikasi data
    const [klasifikasiRows] = await connection.query(`
      SELECT * FROM data_klasifikasi
      ORDER BY tanggal DESC
    `);

    // For each klasifikasi, get the corresponding sensor data
    const result = await Promise.all(
      klasifikasiRows.map(async (klasifikasi) => {
        const sensorData = {};

        // Get location data
        if (klasifikasi.id_lokasi) {
          const [lokasiRows] = await connection.query(
            'SELECT * FROM data_lokasi WHERE id_lokasi = ?',
            [klasifikasi.id_lokasi]
          );
          if (lokasiRows.length > 0) {
            sensorData.data_lokasi = lokasiRows[0];
          }
        }

        // Get PH data
        if (klasifikasi.id_ph) {
          const [phRows] = await connection.query(
            'SELECT * FROM data_ph WHERE id_ph = ?',
            [klasifikasi.id_ph]
          );
          if (phRows.length > 0) {
            sensorData.data_ph = phRows[0];
          }
        }

        // Get Temperature data
        if (klasifikasi.id_temperature) {
          const [tempRows] = await connection.query(
            'SELECT * FROM data_temperature WHERE id_temperature = ?',
            [klasifikasi.id_temperature]
          );
          if (tempRows.length > 0) {
            sensorData.data_temperature = tempRows[0];
          }
        }

        // Get Turbidity data
        if (klasifikasi.id_turbidity) {
          const [turbRows] = await connection.query(
            'SELECT * FROM data_turbidity WHERE id_turbidity = ?',
            [klasifikasi.id_turbidity]
          );
          if (turbRows.length > 0) {
            sensorData.data_turbidity = turbRows[0];
          }
        }

        // Get Accel X data
        if (klasifikasi.id_accel_x) {
          const [accelXRows] = await connection.query(
            'SELECT * FROM data_accel_x WHERE id_accel_x = ?',
            [klasifikasi.id_accel_x]
          );
          if (accelXRows.length > 0) {
            sensorData.data_accel_x = accelXRows[0];
          }
        }

        // Get Accel Y data
        if (klasifikasi.id_accel_y) {
          const [accelYRows] = await connection.query(
            'SELECT * FROM data_accel_y WHERE id_accel_y = ?',
            [klasifikasi.id_accel_y]
          );
          if (accelYRows.length > 0) {
            sensorData.data_accel_y = accelYRows[0];
          }
        }

        // Get Accel Z data
        if (klasifikasi.id_accel_z) {
          const [accelZRows] = await connection.query(
            'SELECT * FROM data_accel_z WHERE id_accel_z = ?',
            [klasifikasi.id_accel_z]
          );
          if (accelZRows.length > 0) {
            sensorData.data_accel_z = accelZRows[0];
          }
        }

        // Get Speed data
        if (klasifikasi.id_speed) {
          const [speedRows] = await connection.query(
            'SELECT * FROM data_speed WHERE id_speed = ?',
            [klasifikasi.id_speed]
          );
          if (speedRows.length > 0) {
            sensorData.data_speed = speedRows[0];
          }
        }

        // Combine klasifikasi data with sensor data
        return {
          ...klasifikasi,
          ...sensorData,
        };
      })
    );

    return result;
  } catch (err) {
    console.error('Error fetching klasifikasi with sensor data:', err);
    return [];
  } finally {
    connection.release();
  }
};

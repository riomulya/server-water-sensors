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

exports.createAccelXEntry = require('./accelX.controllers').createAccelXEntry;
exports.createAccelYEntry = require('./accelY.controllers').createAccelYEntry;
exports.createAccelZEntry = require('./accelZ.controllers').createAccelZEntry;
exports.createPHEntry = require('./ph.controllers').createPHEntry;
exports.createTemperatureEntry =
  require('./temperature.controllers').createTemperatureEntry;
exports.createTurbidityEntry =
  require('./turbidity.controllers').createTurbidityEntry;
exports.createSpeedEntry = require('./speed.controller').createSpeedEntry;
exports.createKlasifikasi =
  require('./klasifikasi.controller').createKlasifikasi;
exports.getPrediction = require('./klasifikasi.controller').getPrediction;

const db = require('../connection/db');
// Import global io instance to use in saveSensorData
const { getIoInstance } = require('../utils/socket');
const { ulid } = require('ulid');

// Helper function to format date in WIB timezone (UTC+7)
function formatDateToWIB(date) {
  const options = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  // Format the date to ISO format with WIB timezone
  const formattedDate = new Date(date).toLocaleString('en-US', options);
  const [datePart, timePart] = formattedDate.split(', ');
  const [month, day, year] = datePart.split('/');

  return `${year}-${month}-${day} ${timePart}`;
}

exports.saveSensorData = async (data) => {
  let connection;
  let success = false;
  let sensorIds = {};

  try {
    console.log('[DEBUG] Starting transaction with data:', data);
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Ensure speed data is properly parsed as a number
    const speedValue =
      typeof data.speed === 'string'
        ? parseFloat(data.speed)
        : typeof data.speed === 'number'
        ? data.speed
        : 0;

    // Make sure we have a proper timestamp in WIB (UTC+7)
    let timestamp = data.timestamp;
    if (!timestamp) {
      timestamp = new Date().toISOString(); // Use current time if no timestamp provided
    }

    // Format the timestamp for WIB timezone (UTC+7)
    const wibTimestamp = formatDateToWIB(timestamp);
    console.log('[DEBUG] Original timestamp:', timestamp);
    console.log('[DEBUG] WIB timestamp:', wibTimestamp);

    const baseData = {
      id_lokasi: data.id_lokasi,
      lat: data.latitude,
      lon: data.longitude,
      tanggal: wibTimestamp, // Use the WIB timestamp
    };

    console.log('[DEBUG] Base data:', baseData);

    // Generate our own IDs using ULID
    const id_accel_x = ulid();
    const id_accel_y = ulid();
    const id_accel_z = ulid();
    const id_ph = ulid();
    const id_temperature = ulid();
    const id_turbidity = ulid();
    const id_speed = ulid();

    sensorIds = {
      id_accel_x,
      id_accel_y,
      id_accel_z,
      id_ph,
      id_temperature,
      id_turbidity,
      id_speed,
    };

    console.log('[DEBUG] Generated sensor IDs:', sensorIds);

    // Insert accel_x data
    await connection.execute(
      'INSERT INTO data_accel_x (id_accel_x, id_lokasi, nilai_accel_x, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_accel_x,
        baseData.id_lokasi,
        data.accel_x,
        baseData.lat,
        baseData.lon,
        baseData.tanggal,
      ]
    );
    console.log('[DEBUG] Inserted accel_x data with ID:', id_accel_x);

    // Insert accel_y data
    await connection.execute(
      'INSERT INTO data_accel_y (id_accel_y, id_lokasi, nilai_accel_y, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_accel_y,
        baseData.id_lokasi,
        data.accel_y,
        baseData.lat,
        baseData.lon,
        baseData.tanggal,
      ]
    );
    console.log('[DEBUG] Inserted accel_y data with ID:', id_accel_y);

    // Insert accel_z data
    await connection.execute(
      'INSERT INTO data_accel_z (id_accel_z, id_lokasi, nilai_accel_z, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_accel_z,
        baseData.id_lokasi,
        data.accel_z,
        baseData.lat,
        baseData.lon,
        baseData.tanggal,
      ]
    );
    console.log('[DEBUG] Inserted accel_z data with ID:', id_accel_z);

    // Insert ph data
    await connection.execute(
      'INSERT INTO data_ph (id_ph, id_lokasi, nilai_ph, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_ph,
        baseData.id_lokasi,
        data.ph,
        baseData.lat,
        baseData.lon,
        baseData.tanggal,
      ]
    );
    console.log('[DEBUG] Inserted ph data with ID:', id_ph);

    // Insert temperature data
    await connection.execute(
      'INSERT INTO data_temperature (id_temperature, id_lokasi, nilai_temperature, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_temperature,
        baseData.id_lokasi,
        data.temperature,
        baseData.lat,
        baseData.lon,
        baseData.tanggal,
      ]
    );
    console.log('[DEBUG] Inserted temperature data with ID:', id_temperature);

    // Insert turbidity data
    await connection.execute(
      'INSERT INTO data_turbidity (id_turbidity, id_lokasi, nilai_turbidity, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_turbidity,
        baseData.id_lokasi,
        data.turbidity,
        baseData.lat,
        baseData.lon,
        baseData.tanggal,
      ]
    );
    console.log('[DEBUG] Inserted turbidity data with ID:', id_turbidity);

    // Insert speed data
    await connection.execute(
      'INSERT INTO data_speed (id_speed, id_lokasi, nilai_speed, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_speed,
        baseData.id_lokasi,
        speedValue,
        baseData.lat,
        baseData.lon,
        baseData.tanggal,
      ]
    );
    console.log('[DEBUG] Inserted speed data with ID:', id_speed);

    // Get prediction from ML API
    const predictionResult = await this.getPrediction(
      data.ph,
      data.temperature,
      data.turbidity
    );

    console.log('[DEBUG] Prediction result:', predictionResult);

    // Insert into data_klasifikasi with the collected sensor IDs and prediction result
    await connection.execute(
      `INSERT INTO data_klasifikasi 
       (id_lokasi, klasifikasi, detail, id_accel_x, id_accel_y, id_accel_z, 
        id_ph, id_speed, id_temperature, id_turbidity, tanggal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id_lokasi,
        predictionResult.klasifikasi,
        predictionResult.detail,
        id_accel_x,
        id_accel_y,
        id_accel_z,
        id_ph,
        id_speed,
        id_temperature,
        id_turbidity,
        baseData.tanggal, // Explicitly set the tanggal to match the sensor data
      ]
    );
    console.log('[DEBUG] Inserted klasifikasi data with all sensor IDs');

    await connection.commit();
    console.log('[DEBUG] Transaction committed successfully');
    success = true;

    // Emit socket event for successful transaction
    const io = getIoInstance();
    if (io) {
      const sensorData = {
        ...baseData,
        nilai_accel_x: data.accel_x,
        nilai_accel_y: data.accel_y,
        nilai_accel_z: data.accel_z,
        nilai_ph: data.ph,
        nilai_temperature: data.temperature,
        nilai_turbidity: data.turbidity,
        nilai_speed: speedValue,
        klasifikasi: predictionResult.klasifikasi,
        detail: predictionResult.detail,
      };
      io.emit('new-sensor-data', sensorData);
      console.log('[DEBUG] Emitted new-sensor-data event');
    } else {
      console.log('[DEBUG] Socket.IO instance not available');
    }
  } catch (err) {
    console.error('[DEBUG] Transaction error:', {
      message: err.message,
      stack: err.stack,
      data: data,
    });
    if (connection) {
      try {
        await connection.rollback();
        console.log('[DEBUG] Transaction rolled back due to error');
      } catch (rollbackErr) {
        console.error('[DEBUG] Rollback error:', rollbackErr);
      }
    }
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('[DEBUG] Connection released');
      } catch (releaseErr) {
        console.error('[DEBUG] Error releasing connection:', releaseErr);
      }
    }
    return success;
  }
};

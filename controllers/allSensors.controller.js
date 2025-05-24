exports.createAccelXEntry = require('./accelX.controllers').createAccelXEntry;
exports.createAccelYEntry = require('./accelY.controllers').createAccelYEntry;
exports.createAccelZEntry = require('./accelZ.controllers').createAccelZEntry;
exports.createPHEntry = require('./ph.controllers').createPHEntry;
exports.createTemperatureEntry =
  require('./temperature.controllers').createTemperatureEntry;
exports.createTurbidityEntry =
  require('./turbidity.controllers').createTurbidityEntry;
exports.createSpeedEntry = require('./speed.controller').createSpeedEntry;

const db = require('../connection/db');
// Import global io instance to use in saveSensorData
const { getIoInstance } = require('../utils/socket');

exports.saveSensorData = async (data) => {
  const connection = await db.getConnection();
  let success = false;
  try {
    console.log('[DEBUG] Starting transaction with data:', data);
    await connection.beginTransaction();

    // Ensure speed data is properly parsed as a number
    const speedValue =
      typeof data.speed === 'string'
        ? parseFloat(data.speed)
        : typeof data.speed === 'number'
        ? data.speed
        : 0;

    const baseData = {
      id_lokasi: data.id_lokasi,
      lat: data.latitude,
      lon: data.longitude,
      tanggal: data.timestamp,
    };

    console.log({ baseData, speedValue });

    await Promise.all([
      this.createAccelXEntry(
        { ...baseData, nilai_accel_x: data.accel_x },
        connection
      ),
      this.createAccelYEntry(
        { ...baseData, nilai_accel_y: data.accel_y },
        connection
      ),
      this.createAccelZEntry(
        { ...baseData, nilai_accel_z: data.accel_z },
        connection
      ),
      this.createPHEntry({ ...baseData, nilai_ph: data.ph }, connection),
      this.createTemperatureEntry(
        { ...baseData, nilai_temperature: data.temperature },
        connection
      ),
      this.createTurbidityEntry(
        { ...baseData, nilai_turbidity: data.turbidity },
        connection
      ),
      this.createSpeedEntry(
        { ...baseData, nilai_speed: speedValue }, // Use the properly parsed speed
        connection
      ),
    ]);

    await connection.commit();
    console.log('[DEBUG] Transaction committed');
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
        nilai_speed: speedValue, // Use the properly parsed speed value
      };
      io.emit('new-sensor-data', sensorData);
      console.log('[DEBUG] Emitted new-sensor-data event:', sensorData);
    } else {
      console.log('[DEBUG] Socket.IO instance not available');
    }
  } catch (err) {
    console.error('[DEBUG] Transaction error:', {
      message: err.message,
      stack: err.stack,
      data: data,
    });
    if (connection) await connection.rollback();
  } finally {
    if (connection) connection.release();
    return success;
  }
};

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

exports.saveSensorData = async (data) => {
  const connection = await db.getConnection();
  try {
    console.log('[DEBUG] Starting transaction with data:', data);
    await connection.beginTransaction();

    const baseData = {
      id_lokasi: data.id_lokasi,
      lat: data.latitude,
      lon: data.longitude,
      tanggal: data.timestamp,
    };

    console.log({ baseData });

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
        { ...baseData, nilai_speed: data.speed },
        connection
      ),
    ]);

    await connection.commit();
    console.log('[DEBUG] Transaction committed');
  } catch (err) {
    console.error('[DEBUG] Transaction error:', {
      message: err.message,
      stack: err.stack,
      data: data,
    });
    if (connection) await connection.rollback();
  } finally {
    if (connection) connection.release();
  }
};

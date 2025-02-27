const db = require('../connection/db'); // Import koneksi database

const getCombinedData = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        base.lat,
        base.lon,
        base.tanggal,
        AVG(base.nilai_accel_x) AS nilai_accel_x,
        AVG(ay.nilai_accel_y) AS nilai_accel_y,
        AVG(az.nilai_accel_z) AS nilai_accel_z,
        MAX(ph.nilai_ph) AS nilai_ph,
        MAX(temp.nilai_temperature) AS nilai_temperature,
        AVG(turb.nilai_turbidity) AS nilai_turbidity
      FROM data_accel_x AS base
      LEFT JOIN (
        SELECT lat, lon, AVG(nilai_accel_y) AS nilai_accel_y 
        FROM data_accel_y 
        GROUP BY lat, lon
      ) AS ay USING (lat, lon)
      LEFT JOIN (
        SELECT lat, lon, AVG(nilai_accel_z) AS nilai_accel_z 
        FROM data_accel_z 
        GROUP BY lat, lon
      ) AS az USING (lat, lon)
      LEFT JOIN (
        SELECT lat, lon, nilai_ph 
        FROM data_ph 
        WHERE (lat, lon, tanggal) IN (
          SELECT lat, lon, MAX(tanggal)
          FROM data_ph
          GROUP BY lat, lon
        )
      ) AS ph USING (lat, lon)
      LEFT JOIN (
        SELECT lat, lon, MAX(nilai_temperature) AS nilai_temperature 
        FROM data_temperature 
        GROUP BY lat, lon
      ) AS temp USING (lat, lon)  
      LEFT JOIN (
        SELECT lat, lon, AVG(nilai_turbidity) AS nilai_turbidity 
        FROM data_turbidity 
        GROUP BY lat, lon
      ) AS turb USING (lat, lon)
      GROUP BY base.lat, base.lon, base.tanggal
    `);

    res.json({
      success: true,
      data: rows,
      length: rows.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCombinedData };

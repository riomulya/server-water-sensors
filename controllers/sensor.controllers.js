const db = require('../connection/db'); // Import koneksi database
const ExcelJS = require('exceljs');

// var totalDataById = 0;

const getCombinedData = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        base.lat,
        base.lon,
        base.tanggal,
        MAX(base.nilai_accel_x) AS nilai_accel_x,
        MAX(ay.nilai_accel_y) AS nilai_accel_y,
        MAX(az.nilai_accel_z) AS nilai_accel_z,
        MAX(ph.nilai_ph) AS nilai_ph,
        MAX(temp.nilai_temperature) AS nilai_temperature,
        MAX(turb.nilai_turbidity) AS nilai_turbidity,
        MAX(speed.nilai_speed) AS nilai_speed
      FROM data_accel_x AS base
      LEFT JOIN (
        SELECT lat, lon, MAX(nilai_accel_y) AS nilai_accel_y 
        FROM data_accel_y 
        GROUP BY lat, lon
      ) AS ay USING (lat, lon)
      LEFT JOIN (
        SELECT lat, lon, MAX(nilai_accel_z) AS nilai_accel_z 
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
        SELECT lat, lon, MAX(nilai_turbidity) AS nilai_turbidity 
        FROM data_turbidity 
        GROUP BY lat, lon
      ) AS turb USING (lat, lon)
      LEFT JOIN (
        SELECT lat, lon, MAX(nilai_speed) AS nilai_speed 
        FROM data_speed 
        GROUP BY lat, lon
      ) AS speed USING (lat, lon)
      GROUP BY base.lat, base.lon, base.tanggal
    `);

    // Jika perlu realtime lebih responsif, tambahkan cache
    res.json({
      success: true,
      data: rows,
      length: rows.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCombinedDataById = async (req, res) => {
  const { id_lokasi } = req.params; // Ambil id_lokasi dari parameter URL
  try {
    const [rows] = await db.query(
      `
      SELECT 
        base.lat,
        base.lon,
        base.tanggal,
        base.id_lokasi,
        MAX(base.nilai_accel_x) AS nilai_accel_x,
        MAX(ay.nilai_accel_y) AS nilai_accel_y,
        MAX(az.nilai_accel_z) AS nilai_accel_z,
        MAX(ph.nilai_ph) AS nilai_ph,
        MAX(temp.nilai_temperature) AS nilai_temperature,
        MAX(turb.nilai_turbidity) AS nilai_turbidity,
        MAX(speed.nilai_speed) AS nilai_speed
      FROM data_accel_x AS base
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_accel_y) AS nilai_accel_y 
        FROM data_accel_y 
        GROUP BY lat, lon, id_lokasi
      ) AS ay ON base.lat = ay.lat AND base.lon = ay.lon AND base.id_lokasi = ay.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_accel_z) AS nilai_accel_z 
        FROM data_accel_z 
        GROUP BY lat, lon, id_lokasi
      ) AS az ON base.lat = az.lat AND base.lon = az.lon AND base.id_lokasi = az.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, nilai_ph 
        FROM data_ph 
        WHERE (lat, lon, tanggal) IN (
          SELECT lat, lon, MAX(tanggal)
          FROM data_ph
          GROUP BY lat, lon, id_lokasi
        )
      ) AS ph ON base.lat = ph.lat AND base.lon = ph.lon AND base.id_lokasi = ph.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_temperature) AS nilai_temperature 
        FROM data_temperature 
        GROUP BY lat, lon, id_lokasi
      ) AS temp ON base.lat = temp.lat AND base.lon = temp.lon AND base.id_lokasi = temp.id_lokasi  
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_turbidity) AS nilai_turbidity 
        FROM data_turbidity 
        GROUP BY lat, lon, id_lokasi
      ) AS turb ON base.lat = turb.lat AND base.lon = turb.lon AND base.id_lokasi = turb.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_speed) AS nilai_speed 
        FROM data_speed 
        GROUP BY lat, lon, id_lokasi
      ) AS speed ON base.lat = speed.lat AND base.lon = speed.lon AND base.id_lokasi = speed.id_lokasi
      WHERE base.id_lokasi = ?
      GROUP BY base.lat, base.lon, base.tanggal, base.id_lokasi
    `,
      [id_lokasi]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: rows,
      length: rows.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const exportDataToExcel = async (req, res) => {
  const { id_lokasi } = req.params; // Ambil id_lokasi dari parameter URL
  try {
    // Fetch combined sensor data
    const [sensorRows] = await db.query(
      `SELECT 
        base.lat,
        base.lon,
        base.tanggal,
        base.id_lokasi,
        MAX(base.nilai_accel_x) AS nilai_accel_x,
        MAX(ay.nilai_accel_y) AS nilai_accel_y,
        MAX(az.nilai_accel_z) AS nilai_accel_z,
        MAX(ph.nilai_ph) AS nilai_ph,
        MAX(temp.nilai_temperature) AS nilai_temperature,
        MAX(turb.nilai_turbidity) AS nilai_turbidity,
        MAX(speed.nilai_speed) AS nilai_speed
      FROM data_accel_x AS base
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_accel_y) AS nilai_accel_y 
        FROM data_accel_y 
        GROUP BY lat, lon, id_lokasi
      ) AS ay ON base.lat = ay.lat AND base.lon = ay.lon AND base.id_lokasi = ay.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_accel_z) AS nilai_accel_z 
        FROM data_accel_z 
        GROUP BY lat, lon, id_lokasi
      ) AS az ON base.lat = az.lat AND base.lon = az.lon AND base.id_lokasi = az.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, nilai_ph 
        FROM data_ph 
        WHERE (lat, lon, tanggal) IN (
          SELECT lat, lon, MAX(tanggal)
          FROM data_ph
          GROUP BY lat, lon, id_lokasi
        )
      ) AS ph ON base.lat = ph.lat AND base.lon = ph.lon AND base.id_lokasi = ph.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_temperature) AS nilai_temperature 
        FROM data_temperature 
        GROUP BY lat, lon, id_lokasi
      ) AS temp ON base.lat = temp.lat AND base.lon = temp.lon AND base.id_lokasi = temp.id_lokasi  
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_turbidity) AS nilai_turbidity 
        FROM data_turbidity 
        GROUP BY lat, lon, id_lokasi
      ) AS turb ON base.lat = turb.lat AND base.lon = turb.lon AND base.id_lokasi = turb.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_speed) AS nilai_speed 
        FROM data_speed 
        GROUP BY lat, lon, id_lokasi
      ) AS speed ON base.lat = speed.lat AND base.lon = speed.lon AND base.id_lokasi = speed.id_lokasi
      WHERE base.id_lokasi = ?
      GROUP BY base.lat, base.lon, base.tanggal, base.id_lokasi`,
      [id_lokasi]
    );

    // Fetch location details
    const [locationRows] = await db.query(
      `SELECT id_lokasi, nama_sungai, alamat,lat,lon FROM data_lokasi WHERE id_lokasi = ?`,
      [id_lokasi]
    );

    const locationData = locationRows[0];

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sensor Data');

    // Define columns for sensor data
    worksheet.columns = [
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lon', width: 15 },
      { header: 'Date', key: 'tanggal', width: 20 },
      { header: 'Location ID', key: 'id_lokasi', width: 15 },
      { header: 'Accel X', key: 'nilai_accel_x', width: 15 },
      { header: 'Accel Y', key: 'nilai_accel_y', width: 15 },
      { header: 'Accel Z', key: 'nilai_accel_z', width: 15 },
      { header: 'pH', key: 'nilai_ph', width: 15 },
      { header: 'Temperature', key: 'nilai_temperature', width: 15 },
      { header: 'Turbidity', key: 'nilai_turbidity', width: 15 },
      { header: 'Speed', key: 'nilai_speed', width: 15 },
    ];

    // Add rows to the worksheet
    sensorRows.forEach((row) => {
      worksheet.addRow({
        lat: row.lat,
        lon: row.lon,
        tanggal: new Date(row.tanggal).toLocaleString(), // Ubah format tanggal menjadi waktu yang bisa dibaca manusia
        id_lokasi: row.id_lokasi,
        nilai_accel_x: row.nilai_accel_x,
        nilai_accel_y: row.nilai_accel_y,
        nilai_accel_z: row.nilai_accel_z,
        nilai_ph: row.nilai_ph,
        nilai_temperature: row.nilai_temperature,
        nilai_turbidity: row.nilai_turbidity,
        nilai_speed: row.nilai_speed,
      });
    });

    // Apply basic styling to the header (remove complex styles for now)
    worksheet.getRow(1).font = { bold: true };

    // Set border for sensor data
    const sensorRowCount = sensorRows.length + 1; // +1 for header
    const sensorRange =
      worksheet.getCell(`A1`).address +
      `:${worksheet.getCell(`J${sensorRowCount}`).address}`;
    worksheet.getCell(sensorRange).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Create a new worksheet for location data
    const locationWorksheet = workbook.addWorksheet('Location Data');

    // Define columns for location data
    locationWorksheet.columns = [
      { header: 'Location ID', key: 'id_lokasi', width: 15 },
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lon', width: 15 },
      { header: 'River Name', key: 'nama_sungai', width: 30 },
      { header: 'Address', key: 'alamat', width: 50 },
    ];

    // Add the location data row
    if (locationData) {
      locationWorksheet.addRow({
        id_lokasi: locationData.id_lokasi,
        lat: locationData.lat,
        lon: locationData.lon,
        nama_sungai: locationData.nama_sungai,
        alamat: locationData.alamat,
      });
    }

    // Apply basic styling to the location header
    locationWorksheet.getRow(1).font = { bold: true };

    // Set border for location data
    const locationRowCount = locationData ? 2 : 1; // +1 for header
    const locationRange =
      locationWorksheet.getCell(`A1`).address +
      `:${locationWorksheet.getCell(`C${locationRowCount}`).address}`;
    locationWorksheet.getCell(locationRange).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Set headers untuk file download
    const fileName = `SensorData_${locationData.nama_sungai}_${id_lokasi}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Mengirim file Excel sebagai response stream
    await workbook.xlsx.write(res);

    // Hentikan response setelah file terkirim
    res.end();
  } catch (err) {
    // Handle error dengan response JSON
    res.status(500).json({
      success: false,
      error_code: 'EXPORT_ERROR',
      message: err.message,
      details: {
        affected_id: id_lokasi,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

const getCombinedDataWithPagination = async (req, res) => {
  const { id_lokasi } = req.params; // Ambil id_lokasi dari parameter URL
  const { page = 1, limit = 100 } = req.query; // Ambil page dan limit dari query parameter
  const offset = (page - 1) * limit; // Hitung offset untuk pagination

  try {
    // Hitung total data
    const [totalRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM data_accel_x AS base
      WHERE base.id_lokasi = ?
    `,
      [id_lokasi]
    );

    const [rows] = await db.query(
      `
      SELECT 
        base.lat,
        base.lon,
        base.tanggal,
        MAX(base.nilai_accel_x) AS nilai_accel_x,
        MAX(ay.nilai_accel_y) AS nilai_accel_y,
        MAX(az.nilai_accel_z) AS nilai_accel_z,
        MAX(ph.nilai_ph) AS nilai_ph,
        MAX(temp.nilai_temperature) AS nilai_temperature,
        MAX(turb.nilai_turbidity) AS nilai_turbidity,
        MAX(speed.nilai_speed) AS nilai_speed
      FROM data_accel_x AS base
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_accel_y) AS nilai_accel_y 
        FROM data_accel_y 
        GROUP BY lat, lon, id_lokasi
      ) AS ay ON base.lat = ay.lat AND base.lon = ay.lon AND base.id_lokasi = ay.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_accel_z) AS nilai_accel_z 
        FROM data_accel_z 
        GROUP BY lat, lon, id_lokasi
      ) AS az ON base.lat = az.lat AND base.lon = az.lon AND base.id_lokasi = az.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, nilai_ph 
        FROM data_ph 
        WHERE (lat, lon, tanggal) IN (
          SELECT lat, lon, MAX(tanggal)
          FROM data_ph
          GROUP BY lat, lon, id_lokasi
        )
      ) AS ph ON base.lat = ph.lat AND base.lon = ph.lon AND base.id_lokasi = ph.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_temperature) AS nilai_temperature 
        FROM data_temperature 
        GROUP BY lat, lon, id_lokasi
      ) AS temp ON base.lat = temp.lat AND base.lon = temp.lon AND base.id_lokasi = temp.id_lokasi  
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_turbidity) AS nilai_turbidity 
        FROM data_turbidity 
        GROUP BY lat, lon, id_lokasi
      ) AS turb ON base.lat = turb.lat AND base.lon = turb.lon AND base.id_lokasi = turb.id_lokasi
      LEFT JOIN (
        SELECT lat, lon, id_lokasi, MAX(nilai_speed) AS nilai_speed 
        FROM data_speed 
        GROUP BY lat, lon, id_lokasi
      ) AS speed ON base.lat = speed.lat AND base.lon = speed.lon AND base.id_lokasi = speed.id_lokasi
      WHERE base.id_lokasi = ?
      GROUP BY base.lat, base.lon, base.tanggal, base.id_lokasi
      LIMIT ? OFFSET ?
    `,
      [id_lokasi, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: rows,
      length: rows.length,
      total: totalRows[0].total, // Menambahkan total data
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCombinedData,
  getCombinedDataById,
  exportDataToExcel,
  getCombinedDataWithPagination,
};

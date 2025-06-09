const db = require('../connection/db'); // Import koneksi database
const ExcelJS = require('exceljs');

// Helper function untuk styling Excel agar lebih profesional
const applyExcelStyling = (worksheet) => {
  // Format header dengan warna dan style yang elegan
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
  headerRow.height = 25;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Warna header gradient biru
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: '0070C0' } },
        { position: 1, color: { argb: '4472C4' } },
      ],
    };
    cell.border = {
      top: { style: 'thin', color: { argb: '8EA9DB' } },
      left: { style: 'thin', color: { argb: '8EA9DB' } },
      bottom: { style: 'thin', color: { argb: '8EA9DB' } },
      right: { style: 'thin', color: { argb: '8EA9DB' } },
    };
  });

  // Tambahkan filter otomatis untuk header
  worksheet.autoFilter = worksheet.getRow(1).cellRefs;

  // Freeze panes untuk membekukan header saat scrolling
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Style untuk baris bergantian (zebra striping)
  const totalRows = worksheet.rowCount;
  for (let i = 2; i <= totalRows; i++) {
    const row = worksheet.getRow(i);

    // Warna latar belakang selang-seling untuk memudahkan membaca
    const fillColor = i % 2 === 0 ? 'F2F6FC' : 'FFFFFF';
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColor },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E8F0' } },
        left: { style: 'thin', color: { argb: 'E5E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E5E8F0' } },
        right: { style: 'thin', color: { argb: 'E5E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };
    });

    // Memastikan tinggi baris seragam
    row.height = 20;
  }

  // Format nomor untuk kolom data sensor
  worksheet.columns.forEach((column) => {
    if (
      [
        'nilai_accel_x',
        'nilai_accel_y',
        'nilai_accel_z',
        'nilai_ph',
        'nilai_temperature',
        'nilai_turbidity',
        'nilai_speed',
      ].includes(column.key)
    ) {
      column.numFmt = '0.00';
      column.alignment = { horizontal: 'right' };
    }

    if (['tanggal'].includes(column.key)) {
      column.alignment = { horizontal: 'left' };
    }
  });
};

// Helper function untuk menambahkan worksheet metadata
const addMetadataWorksheet = (workbook, title, additionalInfo = {}) => {
  const metadataSheet = workbook.addWorksheet('Informasi', {
    properties: { tabColor: { argb: '4472C4' } },
  });

  // Logo dan header
  metadataSheet.mergeCells('A1:F1');
  const titleCell = metadataSheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: '4472C4' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  metadataSheet.getRow(1).height = 30;

  // Informasi ekspor
  metadataSheet.addRow([]);
  metadataSheet.mergeCells('A3:B3');
  metadataSheet.getCell('A3').value = 'Informasi Ekspor Data';
  metadataSheet.getCell('A3').font = {
    bold: true,
    size: 12,
    color: { argb: '4472C4' },
  };

  // Tambahkan timestamp ekspor
  metadataSheet.addRow(['Tanggal & Waktu Ekspor', new Date().toLocaleString()]);

  // Tambahkan informasi tambahan jika ada
  Object.entries(additionalInfo).forEach(([key, value], index) => {
    metadataSheet.addRow([key, value]);
  });

  // Style tabel informasi
  for (let i = 4; i <= metadataSheet.rowCount; i++) {
    const row = metadataSheet.getRow(i);

    // Style untuk sel label
    const labelCell = row.getCell(1);
    labelCell.font = { bold: true };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E6EFF8' },
    };

    // Style untuk sel nilai
    const valueCell = row.getCell(2);
    valueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F6FC' },
    };

    // Border untuk keduanya
    [labelCell, valueCell].forEach((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'D0D7E5' } },
        left: { style: 'thin', color: { argb: 'D0D7E5' } },
        bottom: { style: 'thin', color: { argb: 'D0D7E5' } },
        right: { style: 'thin', color: { argb: 'D0D7E5' } },
      };
      cell.alignment = { vertical: 'middle' };
    });

    row.height = 22;
  }

  // Sesuaikan lebar kolom
  metadataSheet.getColumn('A').width = 25;
  metadataSheet.getColumn('B').width = 40;

  // Tambahkan catatan di bawah
  metadataSheet.addRow([]);
  metadataSheet.mergeCells(
    `A${metadataSheet.rowCount + 1}:F${metadataSheet.rowCount + 1}`
  );
  const noteCell = metadataSheet.getCell(`A${metadataSheet.rowCount}`);
  noteCell.value = 'Data diekspor dari Sistem Monitoring Kualitas Air';
  noteCell.font = { italic: true, color: { argb: '808080' } };
  noteCell.alignment = { horizontal: 'left' };
};

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
      GROUP BY base.lat, base.lon, base.tanggal, base.id_lokasi
      ORDER BY base.tanggal DESC`,
      [id_lokasi]
    );

    // Fetch location details
    const [locationRows] = await db.query(
      `SELECT id_lokasi, nama_sungai, alamat, lat, lon FROM data_lokasi WHERE id_lokasi = ?`,
      [id_lokasi]
    );

    const locationData = locationRows[0];

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'Sistem Monitoring Kualitas Air';
    workbook.lastModifiedBy = 'Sistem Ekspor Otomatis';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Tambahkan worksheet untuk data sensor dengan warna tab
    const worksheet = workbook.addWorksheet('Data Sensor', {
      properties: { tabColor: { argb: '2F75B5' } },
    });

    // Define columns for sensor data with better styling
    worksheet.columns = [
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lon', width: 15 },
      { header: 'Tanggal & Waktu', key: 'tanggal', width: 22 },
      { header: 'ID Lokasi', key: 'id_lokasi', width: 10 },
      { header: 'Akselerasi X', key: 'nilai_accel_x', width: 15 },
      { header: 'Akselerasi Y', key: 'nilai_accel_y', width: 15 },
      { header: 'Akselerasi Z', key: 'nilai_accel_z', width: 15 },
      { header: 'pH', key: 'nilai_ph', width: 12 },
      { header: 'Temperatur (°C)', key: 'nilai_temperature', width: 15 },
      { header: 'Turbiditas (NTU)', key: 'nilai_turbidity', width: 15 },
      { header: 'Kecepatan (m/s)', key: 'nilai_speed', width: 15 },
    ];

    // Add rows to the worksheet with formatted date
    sensorRows.forEach((row) => {
      worksheet.addRow({
        lat: row.lat,
        lon: row.lon,
        tanggal: new Date(row.tanggal).toLocaleString(),
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

    // Apply styling ke worksheet utama
    applyExcelStyling(worksheet);

    // Create a new worksheet for location data with better styling
    const locationWorksheet = workbook.addWorksheet('Detail Lokasi', {
      properties: { tabColor: { argb: '70AD47' } },
    });

    // Define columns for location data
    locationWorksheet.columns = [
      { header: 'ID Lokasi', key: 'id_lokasi', width: 15 },
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lon', width: 15 },
      { header: 'Nama Sungai', key: 'nama_sungai', width: 30 },
      { header: 'Alamat Lengkap', key: 'alamat', width: 50 },
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

    // Apply styling ke worksheet lokasi
    applyExcelStyling(locationWorksheet);

    // Tambahkan halaman informasi metadata
    addMetadataWorksheet(
      workbook,
      'Data Sensor untuk ' +
        (locationData ? locationData.nama_sungai : 'Lokasi ' + id_lokasi),
      {
        'ID Lokasi': id_lokasi,
        'Nama Sungai': locationData
          ? locationData.nama_sungai
          : 'Tidak diketahui',
        Alamat: locationData ? locationData.alamat : 'Tidak diketahui',
        'Jumlah Data': sensorRows.length,
        'Periode Data':
          sensorRows.length > 0
            ? `${new Date(
                sensorRows[sensorRows.length - 1].tanggal
              ).toLocaleDateString()} - ${new Date(
                sensorRows[0].tanggal
              ).toLocaleDateString()}`
            : 'Tidak ada data',
      }
    );

    // Set headers untuk file download dengan nama file yang lebih informatif
    const formattedDate = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const fileName = `SensorData_${
      locationData ? locationData.nama_sungai.replace(/\s+/g, '_') : id_lokasi
    }_${formattedDate}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

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

const exportAllDataToExcel = async (req, res) => {
  try {
    // Fetch all combined sensor data
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
        MAX(speed.nilai_speed) AS nilai_speed,
        loc.nama_sungai
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
      LEFT JOIN data_lokasi AS loc ON base.id_lokasi = loc.id_lokasi
      GROUP BY base.lat, base.lon, base.tanggal, base.id_lokasi, loc.nama_sungai
      ORDER BY base.tanggal DESC, base.id_lokasi ASC`
    );

    // Fetch all locations for summary
    const [locationRows] = await db.query(
      `SELECT id_lokasi, nama_sungai, alamat, lat, lon FROM data_lokasi ORDER BY id_lokasi ASC`
    );

    // Hitung statistik untuk metadata
    const locationCount = locationRows.length;
    const uniqueLocationsInData = [
      ...new Set(sensorRows.map((row) => row.id_lokasi)),
    ].length;

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'Sistem Monitoring Kualitas Air';
    workbook.lastModifiedBy = 'Sistem Ekspor Otomatis';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Tambahkan worksheet untuk data sensor dengan warna tab
    const worksheet = workbook.addWorksheet('Semua Data Sensor', {
      properties: { tabColor: { argb: '2F75B5' } },
    });

    // Define columns for sensor data with better styling
    worksheet.columns = [
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lon', width: 15 },
      { header: 'Tanggal & Waktu', key: 'tanggal', width: 22 },
      { header: 'ID Lokasi', key: 'id_lokasi', width: 10 },
      { header: 'Nama Lokasi', key: 'nama_sungai', width: 25 },
      { header: 'Akselerasi X', key: 'nilai_accel_x', width: 15 },
      { header: 'Akselerasi Y', key: 'nilai_accel_y', width: 15 },
      { header: 'Akselerasi Z', key: 'nilai_accel_z', width: 15 },
      { header: 'pH', key: 'nilai_ph', width: 12 },
      { header: 'Temperatur (°C)', key: 'nilai_temperature', width: 15 },
      { header: 'Turbiditas (NTU)', key: 'nilai_turbidity', width: 15 },
      { header: 'Kecepatan (m/s)', key: 'nilai_speed', width: 15 },
    ];

    // Add rows to the worksheet with formatted date
    sensorRows.forEach((row) => {
      worksheet.addRow({
        lat: row.lat,
        lon: row.lon,
        tanggal: new Date(row.tanggal).toLocaleString(),
        id_lokasi: row.id_lokasi,
        nama_sungai: row.nama_sungai,
        nilai_accel_x: row.nilai_accel_x,
        nilai_accel_y: row.nilai_accel_y,
        nilai_accel_z: row.nilai_accel_z,
        nilai_ph: row.nilai_ph,
        nilai_temperature: row.nilai_temperature,
        nilai_turbidity: row.nilai_turbidity,
        nilai_speed: row.nilai_speed,
      });
    });

    // Apply styling ke worksheet utama
    applyExcelStyling(worksheet);

    // Create a summary worksheet for all locations with better styling
    const locationsWorksheet = workbook.addWorksheet('Daftar Lokasi', {
      properties: { tabColor: { argb: '70AD47' } },
    });

    // Define columns for location data
    locationsWorksheet.columns = [
      { header: 'ID Lokasi', key: 'id_lokasi', width: 15 },
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lon', width: 15 },
      { header: 'Nama Sungai', key: 'nama_sungai', width: 30 },
      { header: 'Alamat Lengkap', key: 'alamat', width: 50 },
    ];

    // Add the location data rows
    locationRows.forEach((location) => {
      locationsWorksheet.addRow({
        id_lokasi: location.id_lokasi,
        lat: location.lat,
        lon: location.lon,
        nama_sungai: location.nama_sungai,
        alamat: location.alamat,
      });
    });

    // Apply styling ke worksheet lokasi
    applyExcelStyling(locationsWorksheet);

    // Tambahkan worksheet untuk ringkasan statistik
    const statsWorksheet = workbook.addWorksheet('Statistik Data', {
      properties: { tabColor: { argb: 'C55A11' } },
    });

    // Define columns untuk statistik
    statsWorksheet.columns = [
      { header: 'Kategori', key: 'category', width: 25 },
      { header: 'Nilai', key: 'value', width: 15 },
    ];

    // Tambahkan baris statistik
    statsWorksheet.addRow({
      category: 'Total Data Sensor',
      value: sensorRows.length,
    });
    statsWorksheet.addRow({
      category: 'Jumlah Lokasi Terdaftar',
      value: locationCount,
    });
    statsWorksheet.addRow({
      category: 'Lokasi dengan Data',
      value: uniqueLocationsInData,
    });

    if (sensorRows.length > 0) {
      statsWorksheet.addRow({
        category: 'Rentang Waktu Data',
        value: `${new Date(
          sensorRows[sensorRows.length - 1].tanggal
        ).toLocaleDateString()} - ${new Date(
          sensorRows[0].tanggal
        ).toLocaleDateString()}`,
      });
    }

    // Apply styling untuk worksheet statistik
    applyExcelStyling(statsWorksheet);

    // Tambahkan halaman informasi metadata
    addMetadataWorksheet(workbook, 'Kumpulan Data Sensor Semua Lokasi', {
      'Total Data': sensorRows.length,
      'Jumlah Lokasi': locationCount,
      'Rentang Data':
        sensorRows.length > 0
          ? `${new Date(
              sensorRows[sensorRows.length - 1].tanggal
            ).toLocaleDateString()} - ${new Date(
              sensorRows[0].tanggal
            ).toLocaleDateString()}`
          : 'Tidak ada data',
    });

    // Set headers untuk file download dengan nama file yang lebih informatif
    const formattedDate = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const fileName = `AllSensorData_${formattedDate}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Mengirim file Excel sebagai response stream
    await workbook.xlsx.write(res);

    // Hentikan response setelah file terkirim
    res.end();
  } catch (err) {
    // Handle error dengan response JSON
    res.status(500).json({
      success: false,
      error_code: 'EXPORT_ALL_ERROR',
      message: err.message,
      details: {
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
  exportAllDataToExcel,
  getCombinedDataWithPagination,
};

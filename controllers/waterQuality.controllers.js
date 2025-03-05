const db = require('../connection/db');
const { RandomForestClassifier } = require('scikitjs');
const { normalize } = require('scikitjs/dist/preprocessing');

// Inisialisasi model Random Forest
let model = null;

// Fungsi untuk inisialisasi model
async function initializeModel() {
  model = new RandomForestClassifier({ nEstimators: 100, randomState: 42 });

  // Data training contoh (sesuaikan dengan data aktual Anda)
  const X_train = [
    [7.0, 25, 5.0, 0.5, 0.1, 0.2], // [pH, temperature, turbidity, accelX, accelY, accelZ]
    [6.5, 28, 15.0, 0.6, 0.15, 0.25],
    [8.0, 22, 2.0, 0.4, 0.05, 0.1],
    [5.5, 30, 30.0, 0.7, 0.2, 0.3],
  ];

  const y_train = [0, 1, 0, 1]; // 0 = kualitas baik, 1 = kualitas buruk

  // Normalisasi data
  const X_normalized = await normalize(X_train);

  await model.fit(X_normalized, y_train);
}

// Fungsi untuk mendapatkan data sensor terbaru
async function getLatestSensorData(id_lokasi) {
  const queries = [
    db.query(
      'SELECT nilai_ph FROM data_ph WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT 1',
      [id_lokasi]
    ),
    db.query(
      'SELECT nilai_temperature FROM data_temperature WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT 1',
      [id_lokasi]
    ),
    db.query(
      'SELECT nilai_turbidity FROM data_turbidity WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT 1',
      [id_lokasi]
    ),
    db.query(
      'SELECT nilai_accel_x FROM data_accel_x WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT 1',
      [id_lokasi]
    ),
    db.query(
      'SELECT nilai_accel_y FROM data_accel_y WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT 1',
      [id_lokasi]
    ),
    db.query(
      'SELECT nilai_accel_z FROM data_accel_z WHERE id_lokasi = ? ORDER BY tanggal DESC LIMIT 1',
      [id_lokasi]
    ),
  ];

  const results = await Promise.all(queries);

  return results.map((result) => {
    return result[0].length > 0
      ? parseFloat(result[0][0][Object.keys(result[0][0])[0]])
      : 0;
  });
}

// Controller untuk prediksi kualitas air
const predictWaterQuality = async (req, res) => {
  try {
    const { id_lokasi } = req.params;

    if (!model) {
      await initializeModel();
    }

    // Ambil data sensor terbaru
    const sensorData = await getLatestSensorData(id_lokasi);

    // Normalisasi data input
    const X_normalized = await normalize([sensorData]);

    // Lakukan prediksi
    const prediction = await model.predict(X_normalized);
    const probabilities = await model.predictProba(X_normalized);

    // Format hasil
    const result = {
      prediction: prediction[0] === 0 ? 'Baik' : 'Buruk',
      probability: probabilities[0][prediction[0]],
      sensor_data: {
        pH: sensorData[0],
        temperature: sensorData[1],
        turbidity: sensorData[2],
        accelX: sensorData[3],
        accelY: sensorData[4],
        accelZ: sensorData[5],
      },
    };

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  initializeModel,
  predictWaterQuality,
};

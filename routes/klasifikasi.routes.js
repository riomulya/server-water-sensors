const express = require('express');
const router = express.Router();
const klasifikasiController = require('../controllers/klasifikasi.controller');

// Get all klasifikasi entries
router.get('/', async (req, res) => {
  try {
    const klasifikasi = await klasifikasiController.getAllKlasifikasi();
    res.json({ success: true, data: klasifikasi });
  } catch (err) {
    console.error('Error fetching klasifikasi data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi with sensor data
router.get('/all', async (req, res) => {
  try {
    const klasifikasi =
      await klasifikasiController.getAllKlasifikasiWithSensorData();
    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error('Error fetching klasifikasi with sensor data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get klasifikasi by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const klasifikasi = await klasifikasiController.getKlasifikasiById(id);

    if (!klasifikasi) {
      return res
        .status(404)
        .json({ success: false, error: 'Klasifikasi not found' });
    }

    res.json({ success: true, data: klasifikasi });
  } catch (err) {
    console.error(`Error fetching klasifikasi with ID ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get klasifikasi by location ID
router.get('/location/:id_lokasi', async (req, res) => {
  try {
    const id_lokasi = req.params.id_lokasi;
    const klasifikasi = await klasifikasiController.getKlasifikasiByLocation(
      id_lokasi
    );
    res.json({ success: true, data: klasifikasi });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for location ${req.params.id_lokasi}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new klasifikasi
router.post('/', async (req, res) => {
  try {
    const klasifikasiData = req.body;
    const result = await klasifikasiController.createKlasifikasi(
      klasifikasiData
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error creating klasifikasi entry:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update klasifikasi
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const klasifikasiData = req.body;
    const result = await klasifikasiController.updateKlasifikasi(
      id,
      klasifikasiData
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error(`Error updating klasifikasi with ID ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete klasifikasi
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await klasifikasiController.deleteKlasifikasi(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error(`Error deleting klasifikasi with ID ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get prediction from ML API directly
router.post('/predict', async (req, res) => {
  try {
    const { ph, temperature, turbidity } = req.body;

    if (!ph || !temperature || !turbidity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: ph, temperature, turbidity',
      });
    }

    const prediction = await klasifikasiController.getPrediction(
      ph,
      temperature,
      turbidity
    );
    res.json({
      success: true,
      data: prediction,
    });
  } catch (err) {
    console.error('Error fetching prediction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi by PH sensor ID
router.get('/ph/:id_ph', async (req, res) => {
  try {
    const id_ph = req.params.id_ph;
    const klasifikasi = await klasifikasiController.getKlasifikasiByPHId(id_ph);

    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for PH sensor ${req.params.id_ph}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi by Temperature sensor ID
router.get('/temperature/:id_temperature', async (req, res) => {
  try {
    const id_temperature = req.params.id_temperature;
    const klasifikasi =
      await klasifikasiController.getKlasifikasiByTemperatureId(id_temperature);

    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Temperature sensor ${req.params.id_temperature}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi by Turbidity sensor ID
router.get('/turbidity/:id_turbidity', async (req, res) => {
  try {
    const id_turbidity = req.params.id_turbidity;
    const klasifikasi = await klasifikasiController.getKlasifikasiByTurbidityId(
      id_turbidity
    );

    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Turbidity sensor ${req.params.id_turbidity}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi by Accel X sensor ID
router.get('/accel-x/:id_accel_x', async (req, res) => {
  try {
    const id_accel_x = req.params.id_accel_x;
    const klasifikasi = await klasifikasiController.getKlasifikasiByAccelXId(
      id_accel_x
    );

    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel X sensor ${req.params.id_accel_x}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi by Accel Y sensor ID
router.get('/accel-y/:id_accel_y', async (req, res) => {
  try {
    const id_accel_y = req.params.id_accel_y;
    const klasifikasi = await klasifikasiController.getKlasifikasiByAccelYId(
      id_accel_y
    );

    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel Y sensor ${req.params.id_accel_y}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi by Accel Z sensor ID
router.get('/accel-z/:id_accel_z', async (req, res) => {
  try {
    const id_accel_z = req.params.id_accel_z;
    const klasifikasi = await klasifikasiController.getKlasifikasiByAccelZId(
      id_accel_z
    );

    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel Z sensor ${req.params.id_accel_z}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all klasifikasi by Speed sensor ID
router.get('/speed/:id_speed', async (req, res) => {
  try {
    const id_speed = req.params.id_speed;
    const klasifikasi = await klasifikasiController.getKlasifikasiBySpeedId(
      id_speed
    );

    res.json({
      success: true,
      data: klasifikasi,
      count: klasifikasi.length,
    });
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Speed sensor ${req.params.id_speed}:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

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

module.exports = router;

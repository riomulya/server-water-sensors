const db = require('../connection/db'); // Import koneksi database

// Create Location
const createLocation = async (req, res) => {
  try {
    const { id_lokasi, nama_sungai, alamat, lat, lon } = req.body;

    // Validasi
    if (!id_lokasi || !nama_sungai || !alamat || !lat || !lon) {
      return res.status(400).json({
        error: 'Semua field harus diisi',
        required_fields: ['id_lokasi', 'nama_sungai', 'alamat', 'lat', 'lon'],
      });
    }

    const [result] = await db.query(
      'INSERT INTO data_lokasi (id_lokasi, nama_sungai, alamat, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_lokasi, nama_sungai, alamat, lat, lon, new Date()]
    );

    const newLocation = {
      id_lokasi,
      nama_sungai,
      alamat,
      lat: lat.toString(),
      lon: lon.toString(),
      tanggal: new Date().toISOString(),
    };

    // Emit event Socket.io ke semua client
    if (req.io) {
      req.io.emit('new-location', newLocation);
    }

    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: error.message,
      sqlMessage: error.sqlMessage,
      receivedData: req.body,
    });
  }
};

// Get All Locations
const getLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_lokasi');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Location
const getLocationById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM data_lokasi WHERE id_lokasi = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Location
const updateLocation = async (req, res) => {
  try {
    const { nama_sungai, alamat, lat, lon } = req.body;
    const [result] = await db.query(
      'UPDATE data_lokasi SET nama_sungai = ?, alamat = ?, lat = ?, lon = ? WHERE id_lokasi = ?',
      [nama_sungai, alamat, lat, lon, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const updatedLocation = {
      id_lokasi: req.params.id,
      nama_sungai,
      alamat,
      lat,
      lon,
      tanggal: new Date().toISOString(),
    };

    // Broadcast update ke client
    if (req.io) {
      req.io.emit('update-location', updatedLocation);
    }

    res.json(updatedLocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Location
const deleteLocation = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM data_lokasi WHERE id_lokasi = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Broadcast deletion ke client
    if (req.io) {
      req.io.emit('delete-location', { id_lokasi: req.params.id });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};

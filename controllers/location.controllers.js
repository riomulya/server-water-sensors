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

    // Return result untuk dipakai di server.js
    return {
      id_lokasi,
      nama_sungai,
      alamat,
      lat: lat.toString(),
      lon: lon.toString(),
      tanggal: new Date().toISOString(),
    };
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
    const { nama_lokasi, koordinat, alamat, keterangan } = req.body;
    const [result] = await db.query(
      'UPDATE data_lokasi SET nama_lokasi = ?, koordinat = ?, alamat = ?, keterangan = ? WHERE id = ?',
      [nama_lokasi, koordinat, alamat, keterangan, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Location
const deleteLocation = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM data_lokasi WHERE id = ?', [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
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

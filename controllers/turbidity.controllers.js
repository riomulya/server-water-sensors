const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_turbidity
const getDataTurbidity = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_turbidity');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDataTurbidity = async (req, res) => {
  const { id_lokasi, nilai_turbidity, lat, lon } = req.body;
  const id_turbidity = `id_turbidity_${generateRandomId()}`; // Format ID sesuai dengan sensor
  const tanggal = getCurrentDate(); // Mendapatkan tanggal saat ini

  try {
    const result = await db.query(
      'INSERT INTO data_turbidity (id_turbidity, id_lokasi, nilai_turbidity, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_turbidity, id_lokasi, nilai_turbidity, lat, lon, tanggal]
    );
    res.json({
      success: true,
      message: 'Data inserted successfully',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDataTurbidity = async (req, res) => {
  const { id_turbidity } = req.params;
  const { id_lokasi, nilai_turbidity, lat, lon } = req.body;

  try {
    const result = await db.query(
      'UPDATE data_turbidity SET id_lokasi = ?, nilai_turbidity = ?, lat = ?, lon = ? WHERE id_turbidity = ?',
      [id_lokasi, nilai_turbidity, lat, lon, id_turbidity]
    );
    res.json({
      success: true,
      message: 'Data updated successfully',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDataTurbidity = async (req, res) => {
  const { id_turbidity } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM data_turbidity WHERE id_turbidity = ?',
      [id_turbidity]
    );
    res.json({
      success: true,
      message: 'Data deleted successfully',
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDataTurbidity,
  createDataTurbidity,
  updateDataTurbidity,
  deleteDataTurbidity,
};

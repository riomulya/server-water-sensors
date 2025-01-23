const db = require('../connection/db'); // Import koneksi database
const { generateRandomId, getCurrentDate } = require('../utils/utils');

// Controller untuk data_ph
const getDataPH = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM data_ph');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDataPH = async (req, res) => {
  const { id_lokasi, nilai_ph, lat, lon } = req.body;
  const id_ph = `id_ph_${generateRandomId()}`; // Format ID sesuai dengan sensor
  const tanggal = getCurrentDate(); // Mendapatkan tanggal saat ini

  try {
    const result = await db.query(
      'INSERT INTO data_ph (id_ph, id_lokasi, nilai_ph, lat, lon, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
      [id_ph, id_lokasi, nilai_ph, lat, lon, tanggal]
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

const updateDataPH = async (req, res) => {
  const { id_ph } = req.params;
  const { id_lokasi, nilai_ph, lat, lon } = req.body;

  try {
    const result = await db.query(
      'UPDATE data_ph SET id_lokasi = ?, nilai_ph = ?, lat = ?, lon = ? WHERE id_ph = ?',
      [id_lokasi, nilai_ph, lat, lon, id_ph]
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

const deleteDataPH = async (req, res) => {
  const { id_ph } = req.params;
  try {
    const result = await db.query('DELETE FROM data_ph WHERE id_ph = ?', [
      id_ph,
    ]);
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
  getDataPH,
  createDataPH,
  updateDataPH,
  deleteDataPH,
};

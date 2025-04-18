const crypto = require('crypto'); // Untuk generate ID acak

function getCurrentDateTime() {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format tanggal: YYYY-MM-DD
  const time = now.toISOString().split('T')[1].split('.')[0]; // Format waktu: HH:MM:SS

  return `${date} ${time}`; // Gabungkan tanggal dan waktu
}

module.exports = {
  getCurrentDateTime,
};

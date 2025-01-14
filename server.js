const express = require('express');
const app = express();
const routes = require('./routes/MqttRoutes'); // Import routes
const sensorsRoutes = require('./routes/sensors'); // Import routes

app.use(sensorsRoutes);
// Gunakan routes yang sudah didefinisikan
app.use(routes);

// Jalankan server Express
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

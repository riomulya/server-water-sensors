const db = require('../connection/db');
const axios = require('axios');

// Function to fetch prediction from ML API
exports.getPrediction = async (phValue, temperatureValue, turbidityValue) => {
  try {
    const response = await axios.post(
      'https://pw-brin-ml.onrender.com/api/predict',
      {
        pH: parseFloat(phValue),
        temperature: parseFloat(temperatureValue),
        turbidity: parseFloat(turbidityValue),
      }
    );

    // Rename prediction to klasifikasi and reason to detail
    return {
      klasifikasi: response.data.prediction,
      detail: response.data.reason,
    };
  } catch (err) {
    console.error('Error calling prediction API:', err);
    return {
      klasifikasi: '0',
      detail: 'Failed to get prediction',
    };
  }
};

// Create new klasifikasi entry
exports.createKlasifikasi = async (data, conn = null) => {
  const connection = conn || (await db.getConnection());
  let result = null;
  try {
    const [rows] = await connection.query(
      `INSERT INTO data_klasifikasi 
      (id_lokasi, klasifikasi, detail, id_accel_x, id_accel_y, id_accel_z, 
       id_ph, id_speed, id_temperature, id_turbidity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id_lokasi,
        data.klasifikasi || '0',
        data.detail || null,
        data.id_accel_x || null,
        data.id_accel_y || null,
        data.id_accel_z || null,
        data.id_ph || null,
        data.id_speed || null,
        data.id_temperature || null,
        data.id_turbidity || null,
      ]
    );
    result = { id: rows.insertId, success: true };
  } catch (err) {
    console.error('Error creating klasifikasi entry:', err);
    result = { success: false, error: err.message };
  } finally {
    if (!conn && connection) connection.release();
    return result;
  }
};

// Get all klasifikasi entries
exports.getAllKlasifikasi = async () => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM data_klasifikasi
      ORDER BY tanggal DESC
    `);
    return rows;
  } catch (err) {
    console.error('Error fetching klasifikasi data:', err);
    return [];
  } finally {
    connection.release();
  }
};

// Get klasifikasi by ID
exports.getKlasifikasiById = async (id_klasifikasi) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_klasifikasi = ?',
      [id_klasifikasi]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error(`Error fetching klasifikasi with ID ${id_klasifikasi}:`, err);
    return null;
  } finally {
    connection.release();
  }
};

// Get klasifikasi by location ID
exports.getKlasifikasiByLocation = async (id_lokasi) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_lokasi = ? ORDER BY tanggal DESC',
      [id_lokasi]
    );
    return rows;
  } catch (err) {
    console.error(`Error fetching klasifikasi for location ${id_lokasi}:`, err);
    return [];
  } finally {
    connection.release();
  }
};

// Update klasifikasi
exports.updateKlasifikasi = async (id_klasifikasi, data) => {
  const connection = await db.getConnection();
  try {
    const [result] = await connection.query(
      `UPDATE data_klasifikasi SET 
        klasifikasi = ?, 
        detail = ?, 
        id_lokasi = ?,
        id_accel_x = ?, 
        id_accel_y = ?, 
        id_accel_z = ?, 
        id_ph = ?, 
        id_speed = ?, 
        id_temperature = ?, 
        id_turbidity = ?
      WHERE id_klasifikasi = ?`,
      [
        data.klasifikasi,
        data.detail,
        data.id_lokasi,
        data.id_accel_x,
        data.id_accel_y,
        data.id_accel_z,
        data.id_ph,
        data.id_speed,
        data.id_temperature,
        data.id_turbidity,
        id_klasifikasi,
      ]
    );
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows,
    };
  } catch (err) {
    console.error(`Error updating klasifikasi with ID ${id_klasifikasi}:`, err);
    return { success: false, error: err.message };
  } finally {
    connection.release();
  }
};

// Delete klasifikasi
exports.deleteKlasifikasi = async (id_klasifikasi) => {
  const connection = await db.getConnection();
  try {
    console.log(`Attempting to delete klasifikasi with ID: ${id_klasifikasi}`);

    // First, get the klasifikasi record to find all sensor IDs
    const [klasifikasiRows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_klasifikasi = ?',
      [id_klasifikasi]
    );

    if (klasifikasiRows.length === 0) {
      console.log(`Klasifikasi with ID ${id_klasifikasi} not found`);
      return { success: false, error: 'Klasifikasi record not found' };
    }

    console.log(`Found klasifikasi record:`, klasifikasiRows[0]);
    const klasifikasi = klasifikasiRows[0];

    // Begin transaction to ensure all deletions succeed or fail together
    await connection.beginTransaction();
    console.log('Beginning transaction...');

    try {
      // Disable foreign key checks temporarily
      console.log('Disabling foreign key checks...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');

      // Delete all associated sensor data
      // Delete pH data if exists
      if (klasifikasi.id_ph) {
        console.log(`Deleting pH data with ID: ${klasifikasi.id_ph}`);
        await connection.query('DELETE FROM data_ph WHERE id_ph = ?', [
          klasifikasi.id_ph,
        ]);
      }

      // Delete temperature data if exists
      if (klasifikasi.id_temperature) {
        console.log(
          `Deleting temperature data with ID: ${klasifikasi.id_temperature}`
        );
        await connection.query(
          'DELETE FROM data_temperature WHERE id_temperature = ?',
          [klasifikasi.id_temperature]
        );
      }

      // Delete turbidity data if exists
      if (klasifikasi.id_turbidity) {
        console.log(
          `Deleting turbidity data with ID: ${klasifikasi.id_turbidity}`
        );
        await connection.query(
          'DELETE FROM data_turbidity WHERE id_turbidity = ?',
          [klasifikasi.id_turbidity]
        );
      }

      // Delete accel_x data if exists
      if (klasifikasi.id_accel_x) {
        console.log(`Deleting accel_x data with ID: ${klasifikasi.id_accel_x}`);
        await connection.query(
          'DELETE FROM data_accel_x WHERE id_accel_x = ?',
          [klasifikasi.id_accel_x]
        );
      }

      // Delete accel_y data if exists
      if (klasifikasi.id_accel_y) {
        console.log(`Deleting accel_y data with ID: ${klasifikasi.id_accel_y}`);
        await connection.query(
          'DELETE FROM data_accel_y WHERE id_accel_y = ?',
          [klasifikasi.id_accel_y]
        );
      }

      // Delete accel_z data if exists
      if (klasifikasi.id_accel_z) {
        console.log(`Deleting accel_z data with ID: ${klasifikasi.id_accel_z}`);
        await connection.query(
          'DELETE FROM data_accel_z WHERE id_accel_z = ?',
          [klasifikasi.id_accel_z]
        );
      }

      // Delete speed data if exists
      if (klasifikasi.id_speed) {
        console.log(`Deleting speed data with ID: ${klasifikasi.id_speed}`);
        await connection.query('DELETE FROM data_speed WHERE id_speed = ?', [
          klasifikasi.id_speed,
        ]);
      }

      // Finally delete the klasifikasi record itself
      console.log(`Deleting klasifikasi record with ID: ${id_klasifikasi}`);
      const [result] = await connection.query(
        'DELETE FROM data_klasifikasi WHERE id_klasifikasi = ?',
        [id_klasifikasi]
      );

      // Re-enable foreign key checks
      console.log('Re-enabling foreign key checks...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');

      // Commit transaction if all deletions were successful
      console.log('Committing transaction...');
      await connection.commit();

      console.log(`Deletion complete. Affected rows: ${result.affectedRows}`);
      return {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows,
        message:
          'Klasifikasi and all associated sensor data deleted successfully',
      };
    } catch (innerErr) {
      // Roll back transaction if there was an error
      console.error(
        'Error during deletion, rolling back transaction:',
        innerErr
      );
      await connection.rollback();

      // Make sure foreign key checks are re-enabled
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');

      throw innerErr; // Re-throw to be caught by outer catch
    }
  } catch (err) {
    console.error(`Error deleting klasifikasi with ID ${id_klasifikasi}:`, err);
    return { success: false, error: `Deletion failed: ${err.message}` };
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by PH sensor ID
exports.getKlasifikasiByPHId = async (id_ph) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_ph = ? ORDER BY tanggal DESC',
      [id_ph]
    );
    return rows;
  } catch (err) {
    console.error(`Error fetching klasifikasi for PH sensor ${id_ph}:`, err);
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Temperature sensor ID
exports.getKlasifikasiByTemperatureId = async (id_temperature) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_temperature = ? ORDER BY tanggal DESC',
      [id_temperature]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Temperature sensor ${id_temperature}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Turbidity sensor ID
exports.getKlasifikasiByTurbidityId = async (id_turbidity) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_turbidity = ? ORDER BY tanggal DESC',
      [id_turbidity]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Turbidity sensor ${id_turbidity}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Accel X sensor ID
exports.getKlasifikasiByAccelXId = async (id_accel_x) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_accel_x = ? ORDER BY tanggal DESC',
      [id_accel_x]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel X sensor ${id_accel_x}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Accel Y sensor ID
exports.getKlasifikasiByAccelYId = async (id_accel_y) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_accel_y = ? ORDER BY tanggal DESC',
      [id_accel_y]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel Y sensor ${id_accel_y}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Accel Z sensor ID
exports.getKlasifikasiByAccelZId = async (id_accel_z) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_accel_z = ? ORDER BY tanggal DESC',
      [id_accel_z]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Accel Z sensor ${id_accel_z}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi by Speed sensor ID
exports.getKlasifikasiBySpeedId = async (id_speed) => {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_speed = ? ORDER BY tanggal DESC',
      [id_speed]
    );
    return rows;
  } catch (err) {
    console.error(
      `Error fetching klasifikasi for Speed sensor ${id_speed}:`,
      err
    );
    return [];
  } finally {
    connection.release();
  }
};

// Get all klasifikasi with sensor data
exports.getAllKlasifikasiWithSensorData = async () => {
  const connection = await db.getConnection();
  try {
    // Get all klasifikasi data
    const [klasifikasiRows] = await connection.query(`
      SELECT * FROM data_klasifikasi
      ORDER BY tanggal DESC
    `);

    // For each klasifikasi, get the corresponding sensor data
    const result = await Promise.all(
      klasifikasiRows.map(async (klasifikasi) => {
        const sensorData = {};

        // Get location data
        if (klasifikasi.id_lokasi) {
          const [lokasiRows] = await connection.query(
            'SELECT * FROM data_lokasi WHERE id_lokasi = ?',
            [klasifikasi.id_lokasi]
          );
          if (lokasiRows.length > 0) {
            sensorData.data_lokasi = lokasiRows[0];
          }
        }

        // Get PH data
        if (klasifikasi.id_ph) {
          const [phRows] = await connection.query(
            'SELECT * FROM data_ph WHERE id_ph = ?',
            [klasifikasi.id_ph]
          );
          if (phRows.length > 0) {
            sensorData.data_ph = phRows[0];
          }
        }

        // Get Temperature data
        if (klasifikasi.id_temperature) {
          const [tempRows] = await connection.query(
            'SELECT * FROM data_temperature WHERE id_temperature = ?',
            [klasifikasi.id_temperature]
          );
          if (tempRows.length > 0) {
            sensorData.data_temperature = tempRows[0];
          }
        }

        // Get Turbidity data
        if (klasifikasi.id_turbidity) {
          const [turbRows] = await connection.query(
            'SELECT * FROM data_turbidity WHERE id_turbidity = ?',
            [klasifikasi.id_turbidity]
          );
          if (turbRows.length > 0) {
            sensorData.data_turbidity = turbRows[0];
          }
        }

        // Get Accel X data
        if (klasifikasi.id_accel_x) {
          const [accelXRows] = await connection.query(
            'SELECT * FROM data_accel_x WHERE id_accel_x = ?',
            [klasifikasi.id_accel_x]
          );
          if (accelXRows.length > 0) {
            sensorData.data_accel_x = accelXRows[0];
          }
        }

        // Get Accel Y data
        if (klasifikasi.id_accel_y) {
          const [accelYRows] = await connection.query(
            'SELECT * FROM data_accel_y WHERE id_accel_y = ?',
            [klasifikasi.id_accel_y]
          );
          if (accelYRows.length > 0) {
            sensorData.data_accel_y = accelYRows[0];
          }
        }

        // Get Accel Z data
        if (klasifikasi.id_accel_z) {
          const [accelZRows] = await connection.query(
            'SELECT * FROM data_accel_z WHERE id_accel_z = ?',
            [klasifikasi.id_accel_z]
          );
          if (accelZRows.length > 0) {
            sensorData.data_accel_z = accelZRows[0];
          }
        }

        // Get Speed data
        if (klasifikasi.id_speed) {
          const [speedRows] = await connection.query(
            'SELECT * FROM data_speed WHERE id_speed = ?',
            [klasifikasi.id_speed]
          );
          if (speedRows.length > 0) {
            sensorData.data_speed = speedRows[0];
          }
        }

        // Combine klasifikasi data with sensor data
        return {
          ...klasifikasi,
          ...sensorData,
        };
      })
    );

    return result;
  } catch (err) {
    console.error('Error fetching klasifikasi with sensor data:', err);
    return [];
  } finally {
    connection.release();
  }
};

// Get klasifikasi by ID with all sensor data
exports.getKlasifikasiByIdWithSensorData = async (id_klasifikasi) => {
  const connection = await db.getConnection();
  try {
    // Get the klasifikasi data
    const [klasifikasiRows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_klasifikasi = ?',
      [id_klasifikasi]
    );

    if (klasifikasiRows.length === 0) {
      return null;
    }

    const klasifikasi = klasifikasiRows[0];
    const sensorData = {};

    // Get location data
    if (klasifikasi.id_lokasi) {
      const [lokasiRows] = await connection.query(
        'SELECT * FROM data_lokasi WHERE id_lokasi = ?',
        [klasifikasi.id_lokasi]
      );
      if (lokasiRows.length > 0) {
        sensorData.data_lokasi = lokasiRows[0];
      }
    }

    // Get PH data
    if (klasifikasi.id_ph) {
      const [phRows] = await connection.query(
        'SELECT * FROM data_ph WHERE id_ph = ?',
        [klasifikasi.id_ph]
      );
      if (phRows.length > 0) {
        sensorData.data_ph = phRows[0];
      }
    }

    // Get Temperature data
    if (klasifikasi.id_temperature) {
      const [tempRows] = await connection.query(
        'SELECT * FROM data_temperature WHERE id_temperature = ?',
        [klasifikasi.id_temperature]
      );
      if (tempRows.length > 0) {
        sensorData.data_temperature = tempRows[0];
      }
    }

    // Get Turbidity data
    if (klasifikasi.id_turbidity) {
      const [turbRows] = await connection.query(
        'SELECT * FROM data_turbidity WHERE id_turbidity = ?',
        [klasifikasi.id_turbidity]
      );
      if (turbRows.length > 0) {
        sensorData.data_turbidity = turbRows[0];
      }
    }

    // Get Accel X data
    if (klasifikasi.id_accel_x) {
      const [accelXRows] = await connection.query(
        'SELECT * FROM data_accel_x WHERE id_accel_x = ?',
        [klasifikasi.id_accel_x]
      );
      if (accelXRows.length > 0) {
        sensorData.data_accel_x = accelXRows[0];
      }
    }

    // Get Accel Y data
    if (klasifikasi.id_accel_y) {
      const [accelYRows] = await connection.query(
        'SELECT * FROM data_accel_y WHERE id_accel_y = ?',
        [klasifikasi.id_accel_y]
      );
      if (accelYRows.length > 0) {
        sensorData.data_accel_y = accelYRows[0];
      }
    }

    // Get Accel Z data
    if (klasifikasi.id_accel_z) {
      const [accelZRows] = await connection.query(
        'SELECT * FROM data_accel_z WHERE id_accel_z = ?',
        [klasifikasi.id_accel_z]
      );
      if (accelZRows.length > 0) {
        sensorData.data_accel_z = accelZRows[0];
      }
    }

    // Get Speed data
    if (klasifikasi.id_speed) {
      const [speedRows] = await connection.query(
        'SELECT * FROM data_speed WHERE id_speed = ?',
        [klasifikasi.id_speed]
      );
      if (speedRows.length > 0) {
        sensorData.data_speed = speedRows[0];
      }
    }

    // Combine klasifikasi data with sensor data
    return {
      ...klasifikasi,
      ...sensorData,
    };
  } catch (err) {
    console.error(
      `Error fetching klasifikasi with ID ${id_klasifikasi} with sensor data:`,
      err
    );
    return null;
  } finally {
    connection.release();
  }
};

// Update klasifikasi and sensor data (pH, temperature, turbidity)
exports.updateKlasifikasiWithSensorData = async (
  id_klasifikasi,
  sensorData
) => {
  const connection = await db.getConnection();
  try {
    console.log(
      `Attempting to update klasifikasi ID ${id_klasifikasi} with new sensor data:`,
      sensorData
    );

    // Begin transaction to ensure all updates succeed or fail together
    await connection.beginTransaction();

    // First, get the klasifikasi record to find all sensor IDs
    const [klasifikasiRows] = await connection.query(
      'SELECT * FROM data_klasifikasi WHERE id_klasifikasi = ?',
      [id_klasifikasi]
    );

    if (klasifikasiRows.length === 0) {
      console.log(`Klasifikasi with ID ${id_klasifikasi} not found`);
      return { success: false, error: 'Klasifikasi record not found' };
    }

    const klasifikasi = klasifikasiRows[0];
    console.log(`Found klasifikasi record:`, klasifikasi);

    // Update pH data if provided and id_ph exists
    if (sensorData.ph !== undefined && klasifikasi.id_ph) {
      console.log(
        `Updating pH data with ID: ${klasifikasi.id_ph}, new value: ${sensorData.ph}`
      );
      await connection.query(
        'UPDATE data_ph SET nilai_ph = ? WHERE id_ph = ?',
        [sensorData.ph, klasifikasi.id_ph]
      );
    }

    // Update temperature data if provided and id_temperature exists
    if (sensorData.temperature !== undefined && klasifikasi.id_temperature) {
      console.log(
        `Updating temperature data with ID: ${klasifikasi.id_temperature}, new value: ${sensorData.temperature}`
      );
      await connection.query(
        'UPDATE data_temperature SET nilai_temperature = ? WHERE id_temperature = ?',
        [sensorData.temperature, klasifikasi.id_temperature]
      );
    }

    // Update turbidity data if provided and id_turbidity exists
    if (sensorData.turbidity !== undefined && klasifikasi.id_turbidity) {
      console.log(
        `Updating turbidity data with ID: ${klasifikasi.id_turbidity}, new value: ${sensorData.turbidity}`
      );
      await connection.query(
        'UPDATE data_turbidity SET nilai_turbidity = ? WHERE id_turbidity = ?',
        [sensorData.turbidity, klasifikasi.id_turbidity]
      );
    }

    // Get new prediction based on updated values
    const prediction = await this.getPrediction(
      sensorData.ph,
      sensorData.temperature,
      sensorData.turbidity
    );

    console.log(`New prediction for updated values:`, prediction);

    // Update klasifikasi record with new prediction
    const [updateResult] = await connection.query(
      `UPDATE data_klasifikasi SET 
        klasifikasi = ?, 
        detail = ?
      WHERE id_klasifikasi = ?`,
      [prediction.klasifikasi, prediction.detail, id_klasifikasi]
    );

    // Commit transaction if all updates were successful
    await connection.commit();

    return {
      success: true,
      message: 'Klasifikasi and sensor data updated successfully',
      prediction: prediction,
      updatedSensorData: {
        ph: sensorData.ph,
        temperature: sensorData.temperature,
        turbidity: sensorData.turbidity,
      },
    };
  } catch (err) {
    // Roll back transaction if there was an error
    await connection.rollback();
    console.error(`Error updating klasifikasi with ID ${id_klasifikasi}:`, err);
    return { success: false, error: `Update failed: ${err.message}` };
  } finally {
    connection.release();
  }
};

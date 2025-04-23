exports.submitLocation = async (req, res) => {
  try {
    const { lat, lng, speed, accuracy } = req.body;

    await db.execute(
      `INSERT INTO gps_locations 
        (user_id, coordinates, speed, accuracy)
        VALUES (?, ST_GeomFromText(?, 4326), ?, ?)`,
      [req.user.id, `POINT(${lng} ${lat})`, speed, accuracy]
    );

    // Broadcast ke organization yang sama
    req.io.to(req.user.organization_id).emit('location-update', {
      userId: req.user.id,
      lat,
      lng,
      speed,
      timestamp: new Date(),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menyimpan lokasi' });
  }
};

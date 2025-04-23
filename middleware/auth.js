exports.authenticate = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Guest bypass
      if (req.headers.authorization === 'guest' && roles.includes('guest')) {
        req.user = { role: 'guest', organization_id: 'public' };
        return next();
      }

      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [user] = await db.execute('SELECT * FROM data_user WHERE id = ?', [
        decoded.id,
      ]);

      if (!user[0] || !roles.includes(user[0].role)) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }

      req.user = user[0];
      next();
    } catch (error) {
      res.status(401).json({ error: 'Autentikasi gagal' });
    }
  };
};

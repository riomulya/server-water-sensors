const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../connection/db');

exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role = 'pengamat',
      organization_id = 'public',
    } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username dan password wajib diisi' });
    }

    // Check if username or email already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM data_user WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ error: 'Username atau email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO data_user 
      (username, email, password, role, organization_id)
      VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role, organization_id]
    );

    // Create token for the new user
    const token = jwt.sign(
      {
        id: result.insertId,
        username,
        role,
        organization_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await db.execute('UPDATE data_user SET last_login = NOW() WHERE id = ?', [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      id: result.insertId,
      username,
      email,
      role,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registrasi gagal' });
  }
};

// Login with username/email and password
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: 'Username/email dan password wajib diisi' });
    }

    // Find user by username or email
    const [users] = await db.execute(
      'SELECT * FROM data_user WHERE username = ? OR email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Username/email tidak ditemukan' });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password salah' });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        organization_id: user.organization_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login timestamp
    await db.execute('UPDATE data_user SET last_login = NOW() WHERE id = ?', [
      user.id,
    ]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat login' });
  }
};

exports.guestLogin = async (req, res) => {
  const guestUser = {
    id: -1,
    role: 'guest',
    organization_id: 'public',
  };

  const token = jwt.sign(guestUser, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
  res.json({
    success: true,
    token,
    user: guestUser,
  });
};

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

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    console.log('Getting all users from data_user table');

    // Only return non-sensitive information
    const [users] = await db.execute(
      `SELECT id, username, email, role, 
      DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as last_login 
      FROM data_user ORDER BY id DESC`
    );

    console.log(`Found ${users.length} users`);

    // Return with the expected structure
    res.json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Gagal mendapatkan data pengguna' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.execute(
      `SELECT id, username, email, role, 
      DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as last_login 
      FROM data_user WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Gagal mendapatkan data pengguna' });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    console.log('Creating new user in data_user table');

    const { username, email, password, role = 'pengamat' } = req.body;

    console.log(`Request data: ${JSON.stringify({ username, email, role })}`);

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

    // Validate role
    const validRoles = ['admin', 'pengamat', 'guest'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Inserting user into data_user table');
    const [result] = await db.execute(
      `INSERT INTO data_user 
      (username, email, password, role)
      VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, role]
    );

    console.log(`User created with ID: ${result.insertId}`);

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
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Gagal membuat pengguna baru' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Updating user with ID: ${userId}`);

    const { username, email, role, password } = req.body;
    console.log(`Update data: ${JSON.stringify({ username, email, role })}`);

    // Verify user exists
    const [existingUser] = await db.execute(
      'SELECT * FROM data_user WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    // Check if username or email is already taken by another user
    if (username || email) {
      const [duplicateCheck] = await db.execute(
        'SELECT * FROM data_user WHERE (username = ? OR email = ?) AND id != ?',
        [username || '', email || '', userId]
      );

      if (duplicateCheck.length > 0) {
        return res
          .status(400)
          .json({ error: 'Username atau email sudah digunakan' });
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'pengamat', 'guest'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Role tidak valid' });
      }
    }

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang diperbarui' });
    }

    // Add user ID to values array
    updateValues.push(userId);

    console.log(`Executing update query: ${updateFields.join(', ')}`);
    await db.execute(
      `UPDATE data_user SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    console.log('User updated successfully');
    res.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data pengguna' });
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Updating password for user ID: ${userId}`);

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password baru wajib diisi' });
    }

    // Verify user exists
    const [users] = await db.execute('SELECT * FROM data_user WHERE id = ?', [
      userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    console.log('Hashing new password');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Executing password update query');
    await db.execute('UPDATE data_user SET password = ? WHERE id = ?', [
      hashedPassword,
      userId,
    ]);

    console.log('Password updated successfully');
    res.json({
      success: true,
      message: 'Password berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Gagal memperbarui password' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Deleting user with ID: ${userId}`);

    // Verify user exists
    const [users] = await db.execute('SELECT * FROM data_user WHERE id = ?', [
      userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    console.log('Executing delete query');
    await db.execute('DELETE FROM data_user WHERE id = ?', [userId]);

    console.log('User deleted successfully');
    res.json({
      success: true,
      message: 'Pengguna berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
};

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Same message whether the email doesn't exist or the password is
      // wrong — telling an attacker which emails are registered is its
      // own small leak, so both cases look identical from the outside.
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong logging in.' });
  }
}

// GET /api/auth/me — sits behind requireAuth, so successfully reaching this
// function at all is proof the middleware and token verification worked.
async function getCurrentUser(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, getCurrentUser };

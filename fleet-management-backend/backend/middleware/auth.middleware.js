const jwt = require('jsonwebtoken');

// Runs before any route this is attached to. Reads the token from the
// Authorization header (format: "Bearer <token>"), verifies it hasn't been
// tampered with or expired, and attaches the decoded payload to req.user
// so the actual route handler can use it. Every Trucks/Drivers/Trips/etc.
// route we build from Phase 3 onward will use this same middleware.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role } — set when the token was signed at login
    next(); // valid token — let the request continue to its real handler
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };

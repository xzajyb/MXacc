const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

function generateToken(userId, expiresIn = '7d') {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getTokenFromRequest
} 
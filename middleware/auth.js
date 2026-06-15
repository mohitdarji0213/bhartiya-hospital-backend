const jwt = require('jsonwebtoken')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'hospital_hms_secret_2024'
const JWT_EXPIRES = '7d'

exports.signToken = (user) => jwt.sign(
  { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, qualification: user.qualification, experience: user.experience, isHead: user.isHead },
  JWT_SECRET, { expiresIn: JWT_EXPIRES }
)

exports.protect = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' })
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) return res.status(401).json({ message: 'User not found' })
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Token ho to user set karo, na ho to guest ke roop mein continue
exports.optionalProtect = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return next()
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
  } catch {
    // invalid token — guest ke roop mein treat karo
  }
  next()
}

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' })
  next()
}

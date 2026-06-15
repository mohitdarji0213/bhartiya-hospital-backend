const router = require('express').Router()
const User = require('../models/User')
const { signToken, protect } = require('../middleware/auth')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, department, qualification, experience } = req.body
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' })

    const isHead = role === 'doctor_head'
    const user = await User.create({ name, email, password, phone, role, department, qualification, experience: Number(experience), isHead })
    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, name, email, role } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user))

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'bio', 'qualification', 'experience', 'fee', 'availability', 'address', 'age', 'gender', 'bloodGroup']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

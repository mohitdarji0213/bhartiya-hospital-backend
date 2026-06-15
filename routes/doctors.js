const router = require('express').Router()
const User = require('../models/User')
const { protect, authorize } = require('../middleware/auth')
const { uploadImage } = require('../utils/cloudinary')

// GET /api/doctors — find doctors (public)
router.get('/', async (req, res) => {
  try {
    const { dept, available, head } = req.query
    const filter = { role: { $in: ['doctor', 'doctor_head'] }, isActive: true }
    if (dept) filter.department = dept
    if (available === 'true') filter.availability = true
    if (head === 'true') filter.isHead = true
    const doctors = await User.find(filter).select('-password').sort('-rating')
    res.json(doctors)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await User.findById(req.params.id).select('-password')
    if (!doc) return res.status(404).json({ message: 'Doctor not found' })
    res.json(doc)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/doctors/:id — doctor updates their own profile
router.put('/:id', protect, uploadImage.single('photo'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id && !['district_admin','hospital_manager'].includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden' })
    const updates = { ...req.body }
    if (req.file) updates.photo = req.file.secure_url || req.file.path
    const doc = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
    res.json(doc)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/doctors/:id/rate — patient rates a doctor
router.post('/:id/rate', protect, authorize('patient'), async (req, res) => {
  try {
    const { rating } = req.body
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5' })
    const doc = await User.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Doctor not found' })
    const newTotal = doc.rating * doc.ratingCount + Number(rating)
    doc.ratingCount++
    doc.rating = +(newTotal / doc.ratingCount).toFixed(1)
    await doc.save()
    res.json({ rating: doc.rating, ratingCount: doc.ratingCount })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/doctors/department-stats/:headId
router.get('/department-stats/:headId', protect, async (req, res) => {
  try {
    const head = await User.findById(req.params.headId)
    if (!head) return res.status(404).json({ message: 'Not found' })
    const team = await User.find({ role: 'doctor', department: head.department, isActive: true }).select('-password')
    res.json({ head, team, teamSize: team.length })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

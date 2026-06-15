const router = require('express').Router()
const { Ambulance } = require('../models/index')
const { protect, authorize } = require('../middleware/auth')

router.post('/', async (req, res) => {
  try {
    const amb = await Ambulance.create({ ...req.body, patientId: req.user?._id })
    res.status(201).json({ success: true, trackId: amb.trackId, data: amb })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/analytics', protect, authorize('district_admin', 'hospital_manager'), async (req, res) => {
  try {
    const total = await Ambulance.countDocuments()
    const today = new Date(); today.setHours(0,0,0,0)
    const todayCount = await Ambulance.countDocuments({ createdAt: { $gte: today } })
    const byType = await Ambulance.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }])
    res.json({ total, today: todayCount, byType })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/', protect, authorize('district_admin', 'hospital_manager'), async (req, res) => {
  try {
    const ambulances = await Ambulance.find().sort('-createdAt').limit(500)
    res.json(ambulances)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', protect, authorize('district_admin', 'hospital_manager'), async (req, res) => {
  try {
    const amb = await Ambulance.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(amb)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

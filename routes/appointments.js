const router = require('express').Router()
const { Appointment } = require('../models/index')
const { protect, optionalProtect, authorize } = require('../middleware/auth')

// POST /api/appointments — guest ya patient dono book kar sakte hain
router.post('/', optionalProtect, async (req, res) => {
  try {
    const { doctorId, ...rest } = req.body
    const data = {
      ...rest,
      patientId: req.user?._id || null,
      // Empty string doctorId ko skip karo — ObjectId cast fail hota hai
      ...(doctorId ? { doctorId } : {}),
    }
    const apt = await Appointment.create(data)
    res.status(201).json({ success: true, appointmentId: apt._id, data: apt })
  } catch (err) {
    console.error('Appointment create error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/appointments/my — patient's own
router.get('/my', protect, async (req, res) => {
  try {
    const apts = await Appointment.find({ patientId: req.user._id }).sort('-createdAt')
    res.json(apts)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/appointments/analytics
router.get('/analytics', protect, authorize('district_admin', 'hospital_manager'), async (req, res) => {
  try {
    const total = await Appointment.countDocuments()
    const today = new Date(); today.setHours(0,0,0,0)
    const todayCount = await Appointment.countDocuments({ createdAt: { $gte: today } })
    const byDept = await Appointment.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ])
    res.json({ total, today: todayCount, byDepartment: byDept })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/appointments — admin/manager sees all
router.get('/', protect, authorize('district_admin', 'hospital_manager', 'doctor_head'), async (req, res) => {
  try {
    const { dept, status, date } = req.query
    const filter = {}
    if (dept) filter.department = dept
    if (status) filter.status = status
    const apts = await Appointment.find(filter).sort('-createdAt').limit(500)
    res.json(apts)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/appointments/:id — update status
router.put('/:id', protect, authorize('district_admin', 'hospital_manager', 'doctor_head', 'doctor'), async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(apt)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/appointments/:id — cancel
router.delete('/:id', protect, async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

const router = require('express').Router()
const User = require('../models/User')
const { Appointment, Ambulance, Report, Issue } = require('../models/index')
const { protect, authorize } = require('../middleware/auth')

// GET /api/stats/district
router.get('/district', protect, authorize('district_admin'), async (req, res) => {
  try {
    const [patients, doctors, appointments, ambulances, reports, issues] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: { $in: ['doctor', 'doctor_head'] } }),
      Appointment.countDocuments(),
      Ambulance.countDocuments(),
      Report.countDocuments(),
      Issue.countDocuments({ status: 'open' }),
    ])
    const avgRating = await User.aggregate([
      { $match: { role: { $in: ['doctor', 'doctor_head'] }, rating: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ])
    const deptStats = await Appointment.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }])
    res.json({ patients, doctors, appointments, ambulances, reports, openIssues: issues, avgRating: avgRating[0]?.avg?.toFixed(1) || 0, deptStats })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/stats/manager
router.get('/manager', protect, authorize('hospital_manager'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const [todayApt, todayAmb, todayReports, openIssues, totalDoctors] = await Promise.all([
      Appointment.countDocuments({ createdAt: { $gte: today } }),
      Ambulance.countDocuments({ createdAt: { $gte: today } }),
      Report.aggregate([{ $project: { count: { $size: '$files' } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
      Issue.countDocuments({ status: 'open', recipientRole: 'hospital_manager' }),
      User.countDocuments({ role: { $in: ['doctor', 'doctor_head'] } }),
    ])
    res.json({ todayAppointments: todayApt, todayAmbulance: todayAmb, todayReports: todayReports[0]?.total || 0, openIssues, totalDoctors })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/stats/doctor-head
router.get('/doctor-head', protect, authorize('doctor_head'), async (req, res) => {
  try {
    const dept = req.user.department
    const [teamSize, deptAppointments, issues] = await Promise.all([
      User.countDocuments({ role: 'doctor', department: dept }),
      Appointment.countDocuments({ department: dept }),
      Issue.countDocuments({ recipientRole: 'doctor_head', status: 'open' }),
    ])
    res.json({ teamSize, deptAppointments, openIssues: issues, rating: req.user.rating })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/stats/doctor
router.get('/doctor', protect, authorize('doctor'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const todayApt = await Appointment.countDocuments({ doctorId: req.user._id, createdAt: { $gte: today } })
    const totalApt = await Appointment.countDocuments({ doctorId: req.user._id })
    res.json({ todayAppointments: todayApt, totalPatients: totalApt, rating: req.user.rating, ratingCount: req.user.ratingCount })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

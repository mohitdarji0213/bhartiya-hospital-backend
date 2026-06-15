const router = require('express').Router()
const { Issue } = require('../models/index')
const { protect, optionalProtect, authorize } = require('../middleware/auth')

// POST /api/issues — guest ya logged-in user dono submit kar sakte hain
router.post('/', optionalProtect, async (req, res) => {
  try {
    const issue = await Issue.create({
      ...req.body,
      submittedBy: req.user?._id || null,
      senderName: req.body.anonymous ? 'Anonymous' : (req.user?.name || req.body.senderName || 'Guest'),
    })
    res.status(201).json({ success: true, data: issue })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/issues/my
router.get('/my', protect, async (req, res) => {
  try {
    const issues = await Issue.find({ submittedBy: req.user._id }).sort('-createdAt')
    res.json(issues)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/issues — manager/head sees their issues
router.get('/', protect, authorize('district_admin', 'hospital_manager', 'doctor_head'), async (req, res) => {
  try {
    const filter = {}
    if (req.user.role === 'hospital_manager') filter.recipientRole = 'hospital_manager'
    if (req.user.role === 'doctor_head') filter.$or = [{ recipientRole: 'doctor_head', department: req.user.department }, { recipientId: req.user._id }]
    const issues = await Issue.find(filter).sort('-createdAt').limit(200)
    res.json(issues)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/issues/:id — update status / add response
router.put('/:id', protect, authorize('hospital_manager', 'doctor_head', 'district_admin'), async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(issue)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

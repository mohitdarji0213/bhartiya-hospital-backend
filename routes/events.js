const router = require('express').Router()
const { Event } = require('../models/index')
const { protect, authorize } = require('../middleware/auth')
const { uploadImage } = require('../utils/cloudinary')

router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort('-createdAt').limit(50)
    res.json(events)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', protect, authorize('district_admin', 'hospital_manager'),
  uploadImage.single('image'), async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      image: req.file?.secure_url || req.file?.path,
      imagePublicId: req.file?.filename,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
    })
    res.status(201).json({ success: true, data: event })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', protect, authorize('district_admin', 'hospital_manager'), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

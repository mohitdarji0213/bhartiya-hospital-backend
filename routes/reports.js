const router = require('express').Router()
const { Report } = require('../models/index')
const { protect, authorize } = require('../middleware/auth')
const { uploadReport } = require('../utils/cloudinary')

// POST /api/reports — lab assistant uploads
router.post('/', protect, authorize('lab_assistant'), (req, res, next) => {
  uploadReport.single('file')(req, res, (err) => {
    if (err) {
      console.error('Cloudinary upload error:', err)
      return res.status(400).json({ message: `File upload failed: ${err.message}` })
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File nahi mila — koi file send karo' })
    }

    delete req.body.files  // safety: purane client se JSON string aa sakti thi

    const { parchiNo, reportType, patientName, doctorName, department, diagnosis } = req.body

    if (!parchiNo) {
      return res.status(400).json({ message: 'parchiNo required hai' })
    }

    const fileData = {
      name: reportType || req.file.originalname,
      type: reportType,
      url: req.file.path || req.file.secure_url || req.file.url,
      publicId: req.file.filename || req.file.public_id,
      size: req.file.size ? `${(req.file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
      uploadedBy: req.user._id,
    }

    if (!fileData.url) {
      return res.status(500).json({ message: 'Cloudinary URL nahi mili — CLOUDINARY_* env vars check karo Render pe' })
    }

    let report = await Report.findOne({ parchiNo })
    if (report) {
      report.files.push(fileData)
      await report.save()
    } else {
      report = await Report.create({
        parchiNo, patientName, doctorName, department, diagnosis,
        files: [fileData],
      })
    }

    res.status(201).json({ success: true, data: report })
  } catch (err) {
    console.error('Report POST error:', err)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports/parchi/:parchiNo — patient lookup
router.get('/parchi/:parchiNo', async (req, res) => {
  try {
    const report = await Report.findOne({ parchiNo: req.params.parchiNo })
    if (!report) return res.status(404).json({ message: 'Is parchi number ka koi report nahi mila' })
    res.json(report)
  } catch (err) {
    console.error('Parchi GET error:', err)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports/analytics
router.get('/analytics', protect, authorize('district_admin', 'hospital_manager', 'lab_assistant'), async (req, res) => {
  try {
    const total = await Report.countDocuments()
    const totalFiles = await Report.aggregate([
      { $project: { count: { $size: '$files' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ])
    const totalDL = await Report.aggregate([
      { $unwind: '$files' },
      { $group: { _id: null, total: { $sum: '$files.downloadCount' } } },
    ])
    res.json({
      totalParchi: total,
      totalFiles: totalFiles[0]?.total || 0,
      totalDownloads: totalDL[0]?.total || 0,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports — admin/manager list
router.get('/', protect, authorize('district_admin', 'hospital_manager', 'lab_assistant'), async (req, res) => {
  try {
    const reports = await Report.find().sort('-createdAt').limit(500)
    res.json(reports)
  } catch (err) {
    console.error('Reports GET error:', err)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/reports/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report nahi mila' })

    const fileIdx = parseInt(req.query.fileIndex) || 0
    if (report.files[fileIdx]) {
      report.files[fileIdx].downloadCount = (report.files[fileIdx].downloadCount || 0) + 1
      await report.save()
      res.json({ url: report.files[fileIdx].url })
    } else {
      res.status(404).json({ message: 'File nahi mili' })
    }
  } catch (err) {
    console.error('Download error:', err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

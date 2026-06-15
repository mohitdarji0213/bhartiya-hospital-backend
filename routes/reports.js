const router = require('express').Router()
const { Report } = require('../models/index')
const { protect, authorize } = require('../middleware/auth')
const { uploadReport } = require('../utils/cloudinary')

// POST /api/reports — lab assistant uploads
router.post('/', protect, authorize('lab_assistant'), uploadReport.single('file'), async (req, res) => {
  try {
    const { parchiNo, reportType, patientName, doctorName, department, diagnosis } = req.body
    const fileData = {
      name: reportType || req.file.originalname,
      type: reportType,
      url: req.file?.path || req.file?.secure_url,
      publicId: req.file?.filename,
      size: `${(req.file?.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedBy: req.user._id,
    }
    let report = await Report.findOne({ parchiNo })
    if (report) {
      report.files.push(fileData)
      await report.save()
    } else {
      report = await Report.create({ parchiNo, patientName, doctorName, department, diagnosis, files: [fileData] })
    }
    res.status(201).json({ success: true, data: report })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/reports/parchi/:parchiNo — patient looks up by parchi
router.get('/parchi/:parchiNo', async (req, res) => {
  try {
    const report = await Report.findOne({ parchiNo: req.params.parchiNo })
    if (!report) return res.status(404).json({ message: 'No report found for this parchi number' })
    res.json(report)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/reports/analytics
router.get('/analytics', protect, authorize('district_admin', 'hospital_manager', 'lab_assistant'), async (req, res) => {
  try {
    const total = await Report.countDocuments()
    const totalFiles = await Report.aggregate([{ $project: { count: { $size: '$files' } } }, { $group: { _id: null, total: { $sum: '$count' } } }])
    const totalDL = await Report.aggregate([
      { $unwind: '$files' },
      { $group: { _id: null, total: { $sum: '$files.downloadCount' } } }
    ])
    res.json({ totalParchi: total, totalFiles: totalFiles[0]?.total || 0, totalDownloads: totalDL[0]?.total || 0 })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/reports — admin/manager
router.get('/', protect, authorize('district_admin', 'hospital_manager', 'lab_assistant'), async (req, res) => {
  try {
    const reports = await Report.find().sort('-createdAt').limit(500)
    res.json(reports)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/reports/:id/download — increment download count
router.get('/:id/download', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Not found' })
    const fileIdx = req.query.fileIndex || 0
    if (report.files[fileIdx]) {
      report.files[fileIdx].downloadCount++
      await report.save()
      res.json({ url: report.files[fileIdx].url })
    } else res.status(404).json({ message: 'File not found' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

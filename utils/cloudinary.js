const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// For report uploads (PDF + images)
const reportStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'hospital_reports',
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    public_id: `report_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`,
  }),
})

// For profile images / event images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'hospital_images', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
})

exports.uploadReport = multer({ storage: reportStorage, limits: { fileSize: 20 * 1024 * 1024 } })
exports.uploadImage = multer({ storage: imageStorage, limits: { fileSize: 5 * 1024 * 1024 } })
exports.cloudinary = cloudinary

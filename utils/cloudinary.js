const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const getResourceType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image'
  return 'raw'
}

const allowedMimetypes = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const reportFilter = (req, file, cb) => {
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false)
  }
}

const reportStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'hospital_reports',
    resource_type: getResourceType(file.mimetype),
    public_id: `report_${Date.now()}_${file.originalname.replace(/\s+/g, '_').replace(/\.[^.]+$/, '')}`,
  }),
})

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hospital_images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
})

exports.uploadReport = multer({
  storage: reportStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: reportFilter,
})

exports.uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
})

exports.cloudinary = cloudinary

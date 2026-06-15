const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['patient', 'district_admin', 'hospital_manager', 'doctor_head', 'doctor', 'lab_assistant'],
    default: 'patient'
  },
  // Doctor-specific
  department: String,
  specialty: String,
  qualification: String,
  experience: Number,
  bio: String,
  photo: String,          // Cloudinary URL
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  fee: Number,
  availability: { type: Boolean, default: true },
  isHead: { type: Boolean, default: false },
  // Patient-specific
  age: Number,
  gender: String,
  bloodGroup: String,
  address: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

module.exports = mongoose.model('User', userSchema)

const mongoose = require('mongoose')

// ─── Appointment ──────────────────────────────────────
const appointmentSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  age: Number, gender: String, phone: String,
  department: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  reason: String,
  urgent: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true })

// ─── Ambulance ────────────────────────────────────────
const ambulanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  type: { type: String, enum: ['basic', 'icu', 'neonatal'], default: 'basic' },
  notes: String,
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['requested', 'dispatched', 'completed'], default: 'requested' },
  trackId: String,
}, { timestamps: true })

ambulanceSchema.pre('save', function (next) {
  if (!this.trackId) this.trackId = 'AMB' + Date.now()
  next()
})

// ─── Report ───────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  parchiNo: { type: String, required: true, index: true },
  patientName: String, age: Number, gender: String,
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: String, department: String, diagnosis: String,
  files: [{
    name: String, type: String,
    url: String,             // Cloudinary URL
    publicId: String,
    size: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    downloadCount: { type: Number, default: 0 },
  }],
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

// ─── Issue ────────────────────────────────────────────
const issueSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  recipientRole: { type: String, enum: ['hospital_manager', 'doctor_head'] },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: String,
  issueType: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  anonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  response: String,
}, { timestamps: true })

// ─── Event ────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  dept: String, desc: String,
  image: String,        // Cloudinary URL
  imagePublicId: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: String,
}, { timestamps: true })

module.exports = {
  Appointment: mongoose.model('Appointment', appointmentSchema),
  Ambulance: mongoose.model('Ambulance', ambulanceSchema),
  Report: mongoose.model('Report', reportSchema),
  Issue: mongoose.model('Issue', issueSchema),
  Event: mongoose.model('Event', eventSchema),
}

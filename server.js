require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://bhartiya-hospital.vercel.app', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/appointments', require('./routes/appointments'))
app.use('/api/ambulance', require('./routes/ambulance'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/doctors', require('./routes/doctors'))
app.use('/api/issues', require('./routes/issues'))
app.use('/api/events', require('./routes/events'))
app.use('/api/stats', require('./routes/stats'))

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

// DB + Listen
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospital_hms')
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(process.env.PORT || 5000, () => console.log(`🚀 Server running on port ${process.env.PORT || 5000}`))
  })
  .catch(err => { console.error('❌ DB error:', err); process.exit(1) })

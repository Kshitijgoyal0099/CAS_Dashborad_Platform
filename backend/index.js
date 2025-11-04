const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');         // <-- Add this line

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Connection: Add this block ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))                    // Success log
  .catch((err) => console.error('MongoDB connection error:', err)); // Error log
// -----------------------------------------

app.get('/', (req, res) => res.send('CAS Dashboard Backend is running!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const casRoutes = require('./routes/cas');
app.use('/api/cas', casRoutes);

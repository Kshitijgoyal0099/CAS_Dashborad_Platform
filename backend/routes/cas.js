const express = require('express');
const multer = require('multer');
const { parseCAS } = require('../controllers/casController');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload', upload.single('casfile'), parseCAS);

module.exports = router;

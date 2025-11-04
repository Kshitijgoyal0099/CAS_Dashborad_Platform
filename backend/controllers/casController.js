const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");

exports.parseCAS = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = path.join(__dirname, '..', req.file.path);
    const pdfBuffer = fs.readFileSync(filePath);

    const data = await pdf(pdfBuffer); // <--- note 'pdf' not 'pdfParse'
    // Basic Info
    const pages = data.numpages;
    const textSample = data.text.substring(0, 500);

    // TODO: Add parsing functions for folios, AMCs, investments, etc.

    res.json({
      status: 'success',
      pages,
      textSample,
      fullText: data.text, // remove or truncate for production
      message: 'PDF parsed successfully. Insert CAS analysis logic here.'
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const pdf = require("pdf-parse");
const fs = require("fs");

const buffer = fs.readFileSync("DDXXXXXX9N_01042025-02112025_CP197591835_02112025074422713_unlocked.pdf");

pdf(buffer)
  .then((data) => {
    console.log("✅ PDF parsed successfully");
    console.log("Pages:", data.numpages);
    console.log("Text sample:", data.text.substring(0, 300));
  })
  .catch((err) => {
    console.error("Error parsing PDF:", err);
  });

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
// Increase limit because images are large strings
app.use(bodyParser.json({ limit: '10mb' }));

// Ensure snapshots directory exists
const uploadDir = path.join(__dirname, 'snapshots');
fs.ensureDirSync(uploadDir);

app.post('/api/save-snapshot', async (req, res) => {
  const { image } = req.body;
  const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
  const fileName = `snapshot-${Date.now()}.jpg`;

  try {
    await fs.writeFile(path.join(uploadDir, fileName), base64Data, 'base64');
    console.log(`Saved: ${fileName}`);
    res.send({ success: true, fileName });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to save' });
  }
});

app.listen(5000, () => console.log('Backend listening on port 5000'));

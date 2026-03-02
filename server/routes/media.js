const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { media } = require('../db');
const auth = require('../middleware/auth');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const uploadDir = path.join(__dirname, '../../assets/images');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, uid() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only'));
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const items = await media.find({}).sort({ createdAt: -1 });
    res.json(items.map(m => ({ id: m._id, name: m.name, filename: m.filename, src: `/assets/images/${m.filename}` })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const id = uid();
    await media.insert({ _id: id, name: req.file.originalname, filename: req.file.filename, createdAt: new Date().toISOString() });
    res.json({ id, name: req.file.originalname, filename: req.file.filename, src: `/assets/images/${req.file.filename}` });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await media.findOne({ _id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(uploadDir, item.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await media.remove({ _id: req.params.id }, {});
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

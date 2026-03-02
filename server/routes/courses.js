const router = require('express').Router();
const { courses } = require('../db');
const auth = require('../middleware/auth');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function fmt(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

router.get('/', async (req, res) => {
  try {
    const items = await courses.find({}).sort({ createdAt: -1 });
    res.json(items.map(fmt));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, duration, schedule, image } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const doc = await courses.insert({
      _id: uid(), title,
      description: description || '', duration: duration || '',
      schedule: schedule || '', image: image || '',
      createdAt: new Date().toISOString()
    });
    res.json(fmt(doc));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, duration, schedule, image } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    await courses.update(
      { _id: req.params.id },
      { $set: { title, description: description || '', duration: duration || '', schedule: schedule || '', image: image || '' } }
    );
    res.json(fmt(await courses.findOne({ _id: req.params.id })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await courses.remove({ _id: req.params.id }, {});
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

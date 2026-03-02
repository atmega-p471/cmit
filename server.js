require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.use('/api/auth',    require('./server/routes/auth'));
app.use('/api/news',    require('./server/routes/news'));
app.use('/api/courses', require('./server/routes/courses'));
app.use('/api/media',   require('./server/routes/media'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

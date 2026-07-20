const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

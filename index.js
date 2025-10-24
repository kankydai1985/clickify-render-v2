import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Clickify Render Service',
    status: '✅ Running',
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});

export default app;

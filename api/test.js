export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({
    message: "✅ Test endpoint working!",
    node_version: process.version,
    timestamp: new Date().toISOString(),
    status: "OK"
  });
};

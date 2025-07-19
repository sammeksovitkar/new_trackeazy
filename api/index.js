const mongoose = require('mongoose');

let isConnected = false;

async function connectToDB() {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = true;
  console.log("✅ MongoDB connected");
}

// Schema and model
const locationSchema = new mongoose.Schema({
  latlong: { lat: String, long: String },
  time: String,
}, { timestamps: true });

const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);

// API handler (serverless format)
module.exports = async (req, res) => {
  await connectToDB();

  if (req.method === 'POST') {
    const { latlong, time } = req.body;

    if (!latlong || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const location = new Location({ latlong, time });
      await location.save();
      return res.status(201).json({ message: '✅ Data saved' });
    } catch (error) {
      return res.status(500).json({ error: 'Error saving data', details: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const data = await Location.find().sort({ createdAt: -1 });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Invalid method
  return res.status(405).json({ error: 'Method Not Allowed' });
};

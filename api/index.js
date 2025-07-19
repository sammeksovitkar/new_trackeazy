import mongoose from 'mongoose';

let isConnected = false;

// Connect to MongoDB
async function connectToDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
  console.log('✅ Connected to MongoDB');
}

// Define Schema
const locationSchema = new mongoose.Schema(
  {
    latlong: { lat: String, long: String },
    time: String,
  },
  { timestamps: true }
);

// Define Model (avoid model overwrite in serverless)
const Location =
  mongoose.models.Location || mongoose.model('Location', locationSchema);

// Vercel handler
export default async function handler(req, res) {
  await connectToDB();

  if (req.method === 'POST') {
    // POST /api/index.js (save data)
    const newData = req.body;
    console.log(newData, '📦 Incoming data');

    if (!newData.latlong || !newData.time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const location = new Location({
        latlong: {
          lat: newData.latlong.lat,
          long: newData.latlong.long,
        },
        time: newData.time,
      });

      await location.save();
      return res.status(201).json({ message: '✅ Data saved to MongoDB' });
    } catch (error) {
      console.error('❌ Error saving data:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'GET') {
    // GET /api/index.js (fetch data)
    try {
      const data = await Location.find().sort({ createdAt: -1 });
      return res.status(200).json(data);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

const express = require('express');

const cors = require('cors');

const axios = require('axios');

const mongoose = require('mongoose');



const app = express();



// Middleware

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));



// Configuration

const PORT = process.env.PORT || 3000;

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forum-fisika';



// MongoDB Connection

mongoose.connect(MONGODB_URI, {

  useNewUrlParser: true,

  useUnifiedTopology: true

}).then(() => {

  console.log('✅ MongoDB Connected');

}).catch(err => {

  console.error('❌ MongoDB Connection Error:', err);

});



// MongoDB Schemas

const PostSchema = new mongoose.Schema({

  title: { type: String, required: true },

  content: { type: String, required: true },

  author: { type: String, required: true },

  category: { type: String, enum: ['Pertanyaan', 'Konsep Fisika', 'Penelitian'] },

  aiConfidence: Number,

  keywords: [String],

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now }

});



const Post = mongoose.model('Post', PostSchema);



// Routes



// Health check

app.get('/api/health', async (req, res) => {

  try {

    const flaskHealth = await axios.get(${FLASK_API_URL}/);

    res.json({

      status: 'online',

      backend: 'OK',

      aiService: flaskHealth.data.status,

      modelLoaded: flaskHealth.data.model_loaded

    });

  } catch (error) {

    res.status(500).json({

      status: 'degraded',

      backend: 'OK',

      aiService: 'offline',

      error: error.message

    });

  }

});



// Classify text

app.post('/api/classify', async (req, res) => {

  try {

    const { text } = req.body;



    if (!text) {

      return res.status(400).json({

        success: false,

        error: 'Text is required'

      });

    }



    // Call Flask API

    const response = await axios.post(${FLASK_API_URL}/classify, {

      text: text

    });



    res.json(response.data);

  } catch (error) {

    console.error('Classification error:', error.message);

    res.status(500).json({

      success: false,

      error: 'Classification service unavailable',

      details: error.message

    });

  }

});



// Create post with auto-classification

app.post('/api/posts', async (req, res) => {

  try {

    const { title, content, author } = req.body;



    if (!title || !content || !author) {

      return res.status(400).json({

        success: false,

        error: 'Title, content, and author are required'

      });

    }



    // Classify content

    const classifyResponse = await axios.post(${FLASK_API_URL}/classify, {

      text: content

    });



    const { prediction, confidence } = classifyResponse.data;



    // Save to MongoDB

    const newPost = new Post({

      title,

      content,

      author,

      category: prediction,

      aiConfidence: confidence

    });



    await newPost.save();



    res.status(201).json({

      success: true,

      post: newPost,

      classification: {

        category: prediction,

        confidence: confidence

      }

    });

  } catch (error) {

    console.error('Create post error:', error.message);

    res.status(500).json({

      success: false,

      error: 'Failed to create post',

      details: error.message

    });

  }

});



// Get all posts with filters

app.get('/api/posts', async (req, res) => {

  try {

    const { category, search, limit = 20, page = 1 } = req.query;



    let query = {};



    // Filter by category

    if (category) {

      query.category = category;

    }



    // Search in title and content

    if (search) {

      query.$or = [

        { title: { $regex: search, $options: 'i' } },

        { content: { $regex: search, $options: 'i' } }

      ];

    }



    const posts = await Post.find(query)

      .sort({ createdAt: -1 })

      .limit(parseInt(limit))

      .skip((parseInt(page) - 1) * parseInt(limit));



    const total = await Post.countDocuments(query);



    res.json({

      success: true,

      posts,

      pagination: {

        total,

        page: parseInt(page),

        limit: parseInt(limit),

        pages: Math.ceil(total / parseInt(limit))

      }

    });

  } catch (error) {

    console.error('Get posts error:', error.message);

    res.status(500).json({

      success: false,

      error: 'Failed to fetch posts',

      details: error.message

    });

  }

});



// Get single post

app.get('/api/posts/:id', async (req, res) => {

  try {

    const post = await Post.findById(req.params.id);



    if (!post) {

      return res.status(404).json({

        success: false,

        error: 'Post not found'

      });

    }



    res.json({

      success: true,

      post

    });

  } catch (error) {

    console.error('Get post error:', error.message);

    res.status(500).json({

      success: false,

      error: 'Failed to fetch post',

      details: error.message

    });

  }

});



// Extract keywords from content

app.post('/api/keywords/extract', async (req, res) => {

  try {

    const { text } = req.body;



    if (!text) {

      return res.status(400).json({

        success: false,

        error: 'Text is required'

      });

    }



    // Call classify untuk mendapatkan category

    const classifyResponse = await axios.post(${FLASK_API_URL}/classify, {

      text

    });



    // Simple keyword extraction (dapat ditingkatkan)

    const keywords = extractKeywords(text);

    res.json({

      success: true,

      keywords,

      category: classifyResponse.data.prediction

    });

  } catch (error) {

    console.error('Extract keywords error:', error.message);

    res.status(500).json({

      success: false,

      error: 'Failed to extract keywords',

      details: error.message

    });

  }

});



// Helper function: Simple keyword extraction

function extractKeywords(text) {

  // List kata kunci fisika (dapat diperluas)

  const physicsKeywords = [

    'gravitasi', 'energi', 'momentum', 'gaya', 'massa', 'percepatan',

    'kecepatan', 'gelombang', 'partikel', 'atom', 'elektron', 'proton',

    'neutron', 'medan', 'magnet', 'listrik', 'termodinamika', 'mekanika',

    'kuantum', 'relativitas', 'radiasi', 'frekuensi', 'amplitudo',

    'konservasi', 'hukum', 'newton', 'einstein', 'fisika'

  ];



  const words = text.toLowerCase().match(/\b\w+\b/g) || [];

  const found = words.filter(word => physicsKeywords.includes(word));



  return [...new Set(found)]; // Remove duplicates
}



// Error handling middleware

app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(500).json({

    success: false,

    error: 'Internal server error',

    details: err.message

  });

});



// Start server

app.listen(PORT, () => {

 

  console.log(`   GET  /api/health            - Health check`);

  console.log(`   POST /api/classify          - Classify text`);

  console.log(`   POST /api/posts             - Create post`);

  console.log(`   GET  /api/posts             - Get posts`);

  console.log(`   GET  /api/posts/:id         - Get single post`);

  console.log(`   POST /api/keywords/extract  - Extract keywords`);

  console.log('='.repeat(60) + '\n');

});



module.exports = app;
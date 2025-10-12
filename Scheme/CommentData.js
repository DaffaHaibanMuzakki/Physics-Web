const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post', // komentar ini milik posting apa
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account', // siapa yang komentar
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  replies: [
    {
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema);

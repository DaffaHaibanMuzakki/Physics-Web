const mongoose = require('mongoose');

const post = new mongoose.Schema({
  title: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  caption: String,
  image: String,
  keywords: [String],
  category: String,
  references: [
    {
      title: String,
      url: String
    }
  ],
  // ini relasi ke koleksi Comment
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Post", post) ;
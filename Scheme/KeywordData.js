

const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // biar gak ada keyword duplikat
    trim: true
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post' // relasi ke koleksi Post
    }
  ],
  count: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Keyword', keywordSchema);


/// CATATAN 
// const Keyword = require('../models/Keyword');
// const Post = require('../models/Post');

// async function addKeywordToPost(postId, keywordNames) {
//   for (let name of keywordNames) {
//     // Cari apakah keyword sudah ada
//     let keyword = await Keyword.findOne({ name });

//     if (!keyword) {
//       // kalau belum ada → buat baru
//       keyword = new Keyword({ name, posts: [postId], count: 1 });
//     } else {
//       // kalau sudah ada → tambahkan postId jika belum ada
//       if (!keyword.posts.includes(postId)) {
//         keyword.posts.push(postId);
//         keyword.count = keyword.posts.length; // update count sesuai panjang array
//       }
//     }

//     await keyword.save();
//   }
// }


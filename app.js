// ======================================================
// 🧱 1. CORE WEB FRAMEWORK
// ======================================================
const express = require('express');          // Framework utama untuk membuat server web
const app = express();                       // Membuat instance aplikasi Express
const methodOverride = require('method-override'); // Memungkinkan form pakai method PUT & DELETE
const path = require('path');                // Modul untuk mengatur path direktori dan file
// ======================================================
// 🎨 2. VIEW ENGINE & LAYOUT
// ======================================================
// var expressLayouts = require('express-ejs-layouts'); // Mengatur template/layout EJS agar tampilan konsisten
// ======================================================
// 🧮 3. DATABASE DAN MODEL
// ======================================================
const mongoose = require('mongoose');
const { isValidObjectId } = mongoose;    // Koneksi & pengelolaan database MongoDB

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://daffamuzakki_db_user:96JJVJuYh9OJtyGU@cluster0.wimkgts.mongodb.net/',{
}).then(() => console.log('✅ Database connected')).catch(err => console.error('❌ Database connection error:', err));


const Account = require('./Scheme/AccountData.js');
const Comment = require('./Scheme/CommentData.js');
const Post = require('./Scheme/PostData.js');
const Keyword = require('./Scheme/KeywordData.js');
const Otp = require('./Scheme/OtpData.js');



// ======================================================
// ☁️ 4. UPLOAD & PENYIMPANAN MEDIA
// ======================================================
const cloudinary = require('cloudinary').v2;         // Layanan penyimpanan media berbasis cloud
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Integrasi multer → cloudinary
const multer = require('multer');                    // Middleware untuk upload file (gambar/video)
const { promisify } = require('util');
// ======================================================
// 🔐 5. KEAMANAN & AUTENTIKASI
// ======================================================
const bcrypt = require('bcrypt');                    // Enkripsi password agar aman di database
const session = require('express-session');          // Menyimpan data sesi pengguna (status login)
const cookieParser = require('cookie-parser');       // Membaca cookie dari browser
const flash = require('connect-flash');              // Menampilkan pesan sementara (notifikasi login/error)

// ======================================================
// 📧 6. VERIFIKASI & NOTIFIKASI
// ======================================================
const nodemailer = require("nodemailer");            // Mengirim email ke pengguna (verifikasi, reset password)
const otpGenerator = require('otp-generator');       // Membuat kode OTP acak untuk verifikasi pengguna

// ======================================================
// 🧩 7. PARSING & MANIPULASI DATA
// ======================================================
const cheerio = require('cheerio');                  // Manipulasi/membaca HTML di sisi server (untuk scraping)
const axios = require('axios');
const cors = require("cors");
const { ref } = require('process');
const PostData = require('./Scheme/PostData.js');
const { log } = require('util');
// ======================================================
// 🧩 8. FUNGSI-FUNGSI 
// ======================================================


require('dotenv').config();

// Fungsi promisify upload_stream
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'my_images' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};


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



async function seedData() {
  try {
    // Hapus semua data lama (opsional, kalau mau fresh)
    await Account.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Keyword.deleteMany({});
    await Otp.deleteMany({});

    // 1️⃣ Tambah akun
    const user1 = await Account.create({
      email: "user1@example.com",
      username: "user1",
      password: "password123", // sebaiknya di-hash kalau ini beneran login
      createdAt: new Date(),
      profilePic: "https://example.com/profile1.jpg",
      bio: "Halo, saya user1",
      role: "user"
    });

    const user2 = await Account.create({
      email: "user2@example.com",
      username: "user2",
      password: "password123",
      createdAt: new Date(),
      profilePic: "https://example.com/profile2.jpg",
      bio: "Halo, saya user2",
      role: "user"
    });

    // 2️⃣ Tambah post
    const post1 = await Post.create({
      title: "Artikel Fisika Modern",
      author: user1._id,
      caption: "Ini adalah artikel tentang fisika modern.",
      image: "https://example.com/fisika.jpg",
      keywords: ["fisika", "modern"],
      category: "Science",
      references: [
        { title: "Referensi 1", url: "https://example.com/ref1" }
      ],
      comments: []
    });

    const post2 = await Post.create({
      title: "Belajar Node.js",
      author: user2._id,
      caption: "Tutorial Node.js dasar.",
      image: "https://example.com/node.jpg",
      keywords: ["nodejs", "backend"],
      category: "Programming",
      references: [
        { title: "Node.js Docs", url: "https://nodejs.org/en/docs/" }
      ],
      comments: []
    });

    // 3️⃣ Tambah komentar
    const comment1 = await Comment.create({
      post: post1._id,
      author: user2._id,
      text: "Artikel ini sangat membantu!",
      replies: []
    });

    const comment2 = await Comment.create({
      post: post2._id,
      author: user1._id,
      text: "Terima kasih untuk tutorialnya!",
      replies: []
    });

    // Update post dengan komentar
    post1.comments.push(comment1._id);
    post2.comments.push(comment2._id);
    await post1.save();
    await post2.save();

    // 4️⃣ Tambah keyword
    await Keyword.create({ name: "fisika", posts: [post1._id], count: 1 });
    await Keyword.create({ name: "nodejs", posts: [post2._id], count: 1 });

    // 5️⃣ Tambah OTP (contoh)
    await Otp.create({
      email: "user1@example.com",
      username: "user1",
      password: "password123",
      otp: "123456",
      createdAt: new Date()
    });

    console.log("✅ Seed data berhasil ditambahkan!");
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

async function classifyText(caption) {
  try {
    const response = await axios.post('http://localhost:5000/classify', {
      text: caption
    });
    return response.data
  } catch (error) {
    return error.response ? error.response.data : error.message
  }
}



// seedData()

// ======================================================
// 🧩 9. INISIASI
// ======================================================

// 🧩 Middleware untuk session
app.use(
  session({
    secret: 'rahasia_super_aman', // Ganti dengan string random
    resave: false,
    saveUninitialized: false,
  })
);

cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



app.use(flash());

// 🧩 Middleware untuk EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname, 'public')));
// app.use(expressLayouts);


// 📦  MIDDLEWARE UNTUK PARSING DATA REQUEST
app.use(express.urlencoded({ extended: true })); // untuk form HTML (application/x-www-form-urlencoded)
app.use(express.json());                         // untuk request JSON (application/json)

app.use(cors());



// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // true for port 465, false for other ports
//   auth: {
//     user: "daffahaibanmuzakki@gmail.com",
//     pass: "xwnu kzus mzji clrj",
//   },
// });


async function send_email(otp) {
    const open = await import('open').then(mod => mod.default);
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  let info = await transporter.sendMail({
    from: '"Tester" <tester@example.com>',
    to: 'penerima@example.com',
    subject: 'Percobaan Nodemailer',
    text: `Halo, Ini kode otpnya ${otp}`
  });

  const url = nodemailer.getTestMessageUrl(info);
  console.log('Preview URL:', url);

  // otomatis buka tab baru di browser default
  if(url) await open(url);
}






// ================== ROUTE HOME ==================
app.get('/', async (req, res) => {
  try {
    const isLoggedIn = !!req.session.userId;

    // Ambil posting terbaru
    const PostsData = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'username email profilePic');

    // Ambil daftar keyword dan jumlah posting per keyword
    const keywordStats = await Post.aggregate([
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.render('index', {
      isLoggedIn,
      posts: PostsData,
      _id: req.session.userId,
      keywordStats,
      activeCategory: "Semua"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});


// ================== ROUTE CATEGORY (Topik, Pertanyaan, Penelitian) ==================
async function renderCategoryPage(req, res, categoryName) {
  try {
    const isLoggedIn = !!req.session.userId;

    // Ambil post berdasarkan kategori
    const posts = await Post.find({ category: categoryName })
      .sort({ createdAt: -1 })
      .populate('author', 'username email profilePic');

    // Ambil keyword untuk dropdown / sidebar
    const keywordStats = await Post.aggregate([
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.render('index', {
      isLoggedIn,
      posts,
      _id: req.session.userId,
      keywordStats,
      activeCategory: categoryName
    });
  } catch (err) {
    console.error(`❌ Error di route kategori ${categoryName}:`, err);
    res.status(500).send(`Terjadi kesalahan saat mengambil postingan ${categoryName}.`);
  }
}

// 🔗 Route kategori
app.get('/pertanyaan', (req, res) => renderCategoryPage(req, res, 'Pertanyaan'));
app.get('/penelitian', (req, res) => renderCategoryPage(req, res, 'Penelitian'));
app.get('/konsep_fisika', (req, res) => renderCategoryPage(req, res, 'Konsep Fisika'));


// ======================================================
// 🏷️ FILTER POST BERDASARKAN KEYWORD
// ======================================================
app.get('/keyword/:name', async (req, res) => {
  try {
    const keywordName = req.params.name.toLowerCase();

    //Cari semua postingan yang punya keyword itu
    const posts = await Post.find({ keywords: keywordName })
      .populate('author', 'username profilePic')
      .sort({ createdAt: -1 });

    // Ambil semua keyword untuk dropdown tetap tampil
    const keywordStats = await Post.aggregate([
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.render('index', {
      posts,
      keywordStats,
      activeKeyword: keywordName, // biar dropdown tahu keyword mana yang sedang aktif
      isLoggedIn: !!req.session.userId,
      _id: req.session.userId,
      activeCategory : "Home"
    });
  } catch (err) {
    console.error('❌ Error mengambil postingan berdasarkan keyword:', err);
    res.status(500).send('Terjadi kesalahan saat mengambil postingan.');
  }
});



app.get('/topik', async (req, res) =>{
  res.render('topik') ;
})
app.get('/pertanyaan', async (req, res) =>{
res.render('pertanyaan') ;
})
app.get('/penelitian', async (req, res) =>{
res.render('penelitian') ;
});



app.get('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const isLoggedIn = !!req.session.userId;
    // 🔍 Ambil data akun
    const user = await Account.findById(userId);
    if (!user) return res.status(404).send("User tidak ditemukan");

    // 🔍 Ambil semua postingan user ini
    const posts = await Post.find({ author: user._id })
      .populate("author", "username profilePic")
      .sort({ createdAt: -1 });

    // 🧠 Kirim data user, posts, dan ID user login (jika ada)
    res.render("profile", { 
      user, 
      posts, 
      loggedInUserId: req.session.userId || null , 
      isLoggedIn,
    });

  } catch (err) {
    console.error("❌ Error mengambil profil:", err);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});




app.get('/login', async (req, res) => {
   res.render('login') ;
});

app.post('/login', async function (req, res) {
  try {
    console.log("🔹 [LOGIN] Request diterima");

    // Cek apakah email dikirim di body
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("❌ [LOGIN] Email atau password kosong");
      req.flash('failed', 'Email dan password harus diisi');
      // return res.redirect('/login');
      return res.send("Email dan password harus diisi");
    }

    // Cari akun berdasarkan email
    console.log(`🔍 [LOGIN] Mencari akun dengan email: ${email}`);
    const account = await Account.findOne({ email });

    if (!account) {
      console.log(`❌ [LOGIN] Account tidak ditemukan untuk email: ${email}`);
      req.flash('failed', 'Account not found');
      // return res.redirect('/login');  
      return res.send("Account not found");
    }

    // Bandingkan password
    console.log(`🔐 [LOGIN] Mengecek password untuk user: ${account.username}`);
    const checkPassword = await bcrypt.compare(password, account.password);

    if (!checkPassword) {
      console.log("❌ [LOGIN] Password salah");
      req.flash('failed', 'Wrong Password');
      // return res.redirect('/login');  
      return res.send("Wrong password");
    }

    // Jika semua benar
    console.log("✅ [LOGIN] Password benar, login berhasil");
    const redirectTo = req.session.returnTo || '/';
    req.session.userId = account._id;
    delete req.session.returnTo;

    // res.redirect(redirectTo);
    res.redirect("/");

  } catch (err) {
    console.error("🔥 [LOGIN] Error:", err.message);
    req.flash('failed', 'Terjadi kesalahan pada server');
    // return res.redirect('/login');
    res.status(500).send("Internal Server Error");
  }
});



app.get('/signup', async (req, res) => {
res.render('signup') ;
}); //Ini untuk post utama

app.post('/signup', async function (req, res) {

  try {
    const nama = req.body.username
    const email = req.body.email;
    const password = req.body.password
    
    // Cek apakah email sudah terdaftar
    const account = await Account.findOne({ email });
    if(account){
      console.log(`❌ Signup failed: Email ${email} sudah terdaftar`);
      req.flash('failed','The email has been registered');
      return res.redirect("/signup");
    }

    // Generate OTP
    const otpCode = otpGenerator.generate(6);
    console.log(`🔑 OTP generated for ${email}: ${otpCode}`);

    // // Kirim email OTP
    // const info = await transporter.sendMail({
    //   from: '"Vyn" <your.email@gmail.com>', // sesuaikan email pengirim
    //   to: email, 
    //   subject: "Mas Mas", 
    //   text: `Kode OTP Anda: ${otpCode}`, 
    // });

    send_email(otpCode);
    

    // Hash password
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    console.log(`🔒 Password hashed for ${nama}`);

    // Simpan OTP ke MongoDB
    await Otp.insertMany({
      email,
      username: nama,
      password: hash,
      otp: otpCode
    });
    console.log(`💾 OTP record saved for ${email}`);

    // Simpan email di session
    req.session.email = { email };

    res.redirect('/verify_otp');

  } catch (err) {
    console.error('❌ Error in /signup route:', err);
    // req.flash('failed', 'Terjadi kesalahan saat signup. Cek console untuk detail.');
    res.redirect('/verify_otp');
  }
});



app.get('/verify_otp', async (req, res) => {
   res.render('verify_otp') ;
});
app.post('/verify_otp', async function (req, res) {
  try {
    const enteredOtp = req.body.otp; // OTP dari form user
    console.log('🔑 OTP entered by user:', enteredOtp);

    // Cek apakah session email ada
    if (!req.session.email) {
      console.log('❌ Session expired: email not found in session');
      // req.flash('failed', 'Your OTP code has expired, try again');
      res.send('expired');
    }

    // Ambil OTP record dari DB berdasarkan email session
    const otpRecord = await Otp.findOne({ email: req.session.email.email });
    if (!otpRecord) {
      console.log('❌ OTP not found or expired in DB for', req.session.email.email);
      // req.flash('failed', 'Your OTP code has expired, try again');
      return res.send('expired');
    }

    // Cek apakah OTP cocok
    if (otpRecord.otp !== enteredOtp) {
      console.log('❌ OTP mismatch for', req.session.email.email, 'Entered:', enteredOtp, 'Expected:', otpRecord.otp);
      await Otp.deleteOne({ _id: otpRecord._id }); // hapus OTP yang salah
      // req.flash('failed', 'Your OTP is wrong, try again');
      return res.send('wrong');
    }

    // OTP cocok → buat akun baru
    const newAccount = await Account.create({
      email: otpRecord.email,
      username: otpRecord.username,
      password: otpRecord.password, // sudah hashed
      bio : "Helo, im new user", 
      profilePic : "",
      createdAt: new Date(),
      role: 'User'
    });
    console.log('✅ Account created for', newAccount.email);

    // Hapus OTP yang sudah dipakai
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log('🗑️ OTP record deleted for', otpRecord.email);

    // req.flash('success', 'The account has been created, please login below');
    // res.redirect('/login');
    res.redirect("/login")

  } catch (err) {
    console.error('❌ Error in /verify_otp route:', err);
    // req.flash('failed', 'Terjadi kesalahan saat verifikasi OTP. Cek console untuk detail.');
    // res.redirect('/signup');
    res.send("ada error")
  }
});





app.get('/delete_update', async (req, res) => {
 res.render("delete_update");
});


app.get('/editpost/:id', async (req, res) => {

  try {
    //68ea7012074ee2a71af21759
    // 1. Cek apakah user sudah login
    if (!req.session.userId) {
      return res.status(401).send('Unauthorized: Please login first');
    }
    const postId = req.params.id;
    // 2. Cek ID valid
    if (!isValidObjectId(postId)) {
      return res.status(400).send('Invalid post ID');
    }
    // 3. Ambil post dari database
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // console.log("Ini Post authornya 😂");
    // console.log(post.author.toString() );
    // console.log("Iniauthornya 😂");
    // console.log(req.session.userId);
    

    // 4. Bandingkan ID author dan ID user dari session
    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send('Forbidden: You are not the author of this post');
    };

    

    res.render('editsection', {post});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/editpost/:id', async (req, res) => {
  
  try {
    //68ea7012074ee2a71af21759
    // 1. Cek apakah user sudah login
    if (!req.session.userId) {
      return res.status(401).send('Unauthorized: Please login first');
    }
    const postId = req.params.id;
    // 2. Cek ID valid
    if (!isValidObjectId(postId)) {
      return res.status(400).send('Invalid post ID');
    }
    // 3. Ambil post dari database
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // console.log("Ini Post authornya 😂");
    // console.log(post.author.toString() );
    // console.log("Iniauthornya 😂");
    // console.log(req.session.userId);
    

    // 4. Bandingkan ID author dan ID user dari session
    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send('Forbidden: You are not the author of this post');
    }

    const updatedData = {
      title: req.body.title,
      caption: req.body.caption,
      updatedAt: new Date()
    };

    const updatedPost = await Post.findByIdAndUpdate(postId, updatedData, { new: true });

    res.redirect("/")

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/deletepost/:id', async (req, res) => {
  try {
    //68ea7012074ee2a71af21759
    // 1. Cek apakah user sudah login
    if (!req.session.userId) {
      return res.status(401).send('Unauthorized: Please login first');
    }

    const postId = req.params.id;

    // 2. Cek ID valid
    if (!isValidObjectId(postId)) {
      return res.status(400).send('Invalid post ID');
    }

    // 3. Ambil post dari database
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // console.log("Ini Post authornya 😂");
    // console.log(post.author.toString() );
    // console.log("Iniauthornya 😂");
    // console.log(req.session.userId);
    

    // 4. Bandingkan ID author dan ID user dari session
    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send('Forbidden: You are not the author of this post');
    }

    // 5. Hapus post
    await Post.findByIdAndDelete(postId);

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



app.get('/create_post',requireLogin, async(req,res) => {
res.render("create_post") ; 
})




app.post('/createpost',requireLogin, upload.single('image'), async (req, res) => {
  try {
    console.log("📝 Menerima request:", req.body);
    console.log("File:", req.file);


    // Validasi
    if (!req.body.title || !req.body.caption) {
      return res.status(400).send("Title dan caption harus diisi.");
    }

    // Upload ke Cloudinary
    let imageUrl = null;
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      imageUrl = result.secure_url; // URL Cloudinary
      console.log("✅ Gambar berhasil diupload:", imageUrl);
    }


    //Olah data dengan AI Python
    let category = await classifyText(req.body.caption);

    // Kategorikan keyword
    let keyword = extractKeywords(req.body.caption); 


    console.log("Ini merupakan data refrensi");
   const references = JSON.parse(req.body.references);
    // Konversi menjadi array string "sitasi + DOI"
    const referenceStrings = references.map(ref => `${ref.citation}\n${ref.doi}`);

    console.log("Hasil data refrensi");
    console.log(referenceStrings);
    
    

    // Buat post
  const newPost = await Post.create({
  title: req.body.title,
  caption: req.body.caption,
  author: req.session.userId, // harus ObjectId user yang valid
  image: imageUrl, // bisa pakai URL dummy
  keywords: keyword , // array of string
  category: category.prediction,          // string, bukan array
  references: referenceStrings,
  comments: [] // kosong dulu untuk uji coba
});


    console.log("✅ Post berhasil dibuat:", newPost);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});

app.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.query?.trim().toLowerCase() || "";

    // 🔍 Cari postingan berdasarkan judul yang mengandung query
    const posts = await Post.find({
      title: { $regex: searchQuery, $options: "i" }
    })
      .populate('author', 'username profilePic')
      .sort({ createdAt: -1 });

    // 🔹 Tetap ambil keyword list untuk dropdown
    const keywordStats = await Post.aggregate([
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 🔹 Ambil postingan terbaru juga (optional)
    const latestPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username profilePic');

    res.render('index', {
      posts,
      keywordStats,
      latestPosts,
      searchQuery,
      activeKeyword: null,
      isLoggedIn: !!req.session.userId,
      _id: req.session.userId,
      activeCategory : "Home"
    });
  } catch (err) {
    console.error("❌ Error saat mencari postingan:", err);
    res.status(500).send("Terjadi kesalahan saat mencari postingan.");
  }
});




app.get('/test',async(req,res)=>{

  res.render('testai');
})


app.post('/test',async(req,res)=>{

  let result = await classifyText(req.body.caption);
  console.log(result);
  
  res.send(result) ; 
}) ;




app.get("/get-citation", async (req,res) =>{
  res.render("get-citation")
})

// 🔍 Endpoint: ambil metadata dari DOI
app.post("/get-citation", async (req, res) => {
  const { doi } = req.body;
  if (!doi) return res.status(400).json({ error: "DOI is required" });

  try {
    // Request ke CrossRef API (API resmi untuk metadata DOI)
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const response = await axios.get(url);
    const data = response.data.message;

    // Ambil data penting
    const title = data.title?.[0] || "No title";
    const authors = (data.author || [])
      .map(a => `${a.given || ""} ${a.family || ""}`.trim())
      .join(", ");
    const year = data["published-print"]?.["date-parts"]?.[0]?.[0] ||
                 data["created"]?.["date-parts"]?.[0]?.[0] ||
                 "Unknown";
    const journal = data["container-title"]?.[0] || "Unknown Journal";

    // Buat format sitasi sederhana (APA style)
    const citation = `${authors} (${year}). ${title}. *${journal}*. https://doi.org/${doi}`;

    res.json({
      doi,
      title,
      authors,
      year,
      journal,
      citation
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch DOI metadata.",
      details: error.response?.data?.message || error.message
    });
  }
});

app.get('/logout', (req, res) => {
  // 🔐 Hapus session user
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Gagal logout:", err);
      return res.status(500).send("Terjadi kesalahan saat logout");
    }

    // 🧹 Hapus cookie session dari browser
    res.clearCookie('connect.sid');

    // 🔁 Arahkan balik ke halaman login atau homepage
    res.redirect('/'); 
  });
});

async function getCommentsTree(postId, parentId = null) {
  const comments = await Comment.find({ post: postId, parentComment: parentId })
    .populate("author", "username profilePic")
    .sort({ createdAt: 1 });

  const results = [];

  for (let comment of comments) {
    const children = await getCommentsTree(postId, comment._id); // ambil anak-anaknya
    results.push({
      ...comment.toObject(),
      replies: children
    });
  }

  return results;
}


app.get("/comment/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).send("Invalid post ID");
    }

    // Pastikan post-nya ada
    const post = await Post.findById(postId).populate("author", "username profilePic");
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Ambil semua komentar beserta balasannya secara rekursif
    const commentsTree = await getCommentsTree(postId);

    res.render("komentar", {
      post,
      comments: commentsTree,
      user: req.session.userId || null
    });

  } catch (err) {
    console.error("❌ Error fetching comments:", err);
    res.status(500).send("Server error saat mengambil komentar");
  }
});



app.post("/comment/:postId", async (req, res) => {
  const { postId } = req.params;
  const { text, parentId } = req.body; // parentId opsional
  const userId = req.session.userId;

  const newComment = await Comment.create({
    post: postId,
    author: userId,
    text,
    parentComment: parentId || null,
  });

  res.redirect(`/comment/${postId}`);
});


// ✅ Hapus komentar (hanya oleh pemilik)
app.post("/comment/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { postId } = req.query;
    const userId = req.session.userId;

    // Cari komentar
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).send("Komentar tidak ditemukan");

    // Pastikan yang menghapus adalah pemiliknya
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).send("Kamu tidak diizinkan menghapus komentar ini");
    }

    // Hapus komentar beserta anak-anaknya (jika nested)
    const deleteCommentTree = async (commentId) => {
      const children = await Comment.find({ parentId: commentId });
      for (const child of children) {
        await deleteCommentTree(child._id);
      }
      await Comment.findByIdAndDelete(commentId);
    };

    await deleteCommentTree(id);

    res.redirect(`/comment/${postId}`);
  } catch (err) {
    console.error("❌ Gagal menghapus komentar:", err);
    res.status(500).send("Terjadi kesalahan saat menghapus komentar");
  }
});







app.listen(3000, () =>{
    console.log("Server Berjalan di 3000");
})
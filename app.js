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
const mongoose  = require('mongoose');        // Koneksi & pengelolaan database MongoDB

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



// ======================================================
// 🧩 8. FUNGSI-FUNGSI 
// ======================================================
require('dotenv').config();


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
// app.use(expressLayouts);


// 📦  MIDDLEWARE UNTUK PARSING DATA REQUEST
app.use(express.urlencoded({ extended: true })); // untuk form HTML (application/x-www-form-urlencoded)
app.use(express.json());                         // untuk request JSON (application/json)




const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "daffahaibanmuzakki@gmail.com",
    pass: "xwnu kzus mzji clrj",
  },
});



app.get('/', async (req, res) => {
    
});

app.get('/profile', async (req, res) => {

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
    res.send("Login success");

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
    const nama = "Daffa"
    const email = req.body.email;
    const password = "tes123"
    
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

    // Kirim email OTP
    const info = await transporter.sendMail({
      from: '"Vyn" <your.email@gmail.com>', // sesuaikan email pengirim
      to: email, 
      subject: "Mas Mas", 
      text: `Kode OTP Anda: ${otpCode}`, 
    });
    console.log('📧 OTP email sent:', info.response);

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
    res.send("Succes")

  } catch (err) {
    console.error('❌ Error in /verify_otp route:', err);
    // req.flash('failed', 'Terjadi kesalahan saat verifikasi OTP. Cek console untuk detail.');
    // res.redirect('/signup');
    res.send("ada error")
  }
});






app.get('/createpost',requireLogin, async(req,res) => {


res.render("createpost") ; 
})

const { promisify } = require('util');

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

    console.log("ini sessionnya");
    console.log(req.session.userId);
    
    // Buat post
  const newPost = await Post.create({
  title: req.body.title,
  caption: req.body.caption,
  author: req.session.userId, // harus ObjectId user yang valid
  image: "https://res.cloudinary.com/demo/image/upload/sample.jpg", // bisa pakai URL dummy
  keywords: ["testing", "dummy"], // array of string
  category: "Teknologi",          // string, bukan array
  references: [
    { title: "Referensi 1", url: "https://contoh.com/1" },
    { title: "Referensi 2", url: "https://contoh.com/2" }
  ],
  comments: [] // kosong dulu untuk uji coba
});


    console.log("✅ Post berhasil dibuat:", newPost);
    res.render('/', { post: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
});



app.listen(3000, () =>{
    console.log("Server Berjalan di 3000");
})
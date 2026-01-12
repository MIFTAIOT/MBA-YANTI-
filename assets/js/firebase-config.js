// assets/js/firebase-config.js

// Konfigurasi Kunci Rahasia untuk menghubungkan ke Server Google
const firebaseConfig = {
    apiKey: "AIzaSyDpYabA0lb-0uh3Pe-URmeY7WxpIHj7c5Q",
    authDomain: "e-learning-mamyanti.firebaseapp.com",
    projectId: "e-learning-mamyanti",
    storageBucket: "e-learning-mamyanti.appspot.com",
    messagingSenderId: "198925356373",
    appId: "1:198925356373:web:754ae2355b925aa50333dc"
};

// Konfigurasi tambahan untuk Google Drive Picker (Upload Materi) & Login
const GOOGLE_API_KEY = "AIzaSyBJ9yRe5AYOJGiYwAqlm5wK1La3LhhuS5A";
const GOOGLE_CLIENT_ID = "198925356373-mb0ame0q1sh3elqlq4mofgdakn8df9jh.apps.googleusercontent.com";
const APP_ID = "198925356373"; 
const TEACHER_EMAIL = "elearningmamyanti@gmail.com";

// Memulai koneksi ke Firebase (Inisialisasi)
firebase.initializeApp(firebaseConfig);

// Membuat variabel penghubung agar bisa dipakai di file lain
const auth = firebase.auth(); // Untuk urusan Login/Logout
const db = firebase.firestore(); // Untuk urusan Database (Simpan data)
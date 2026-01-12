// assets/js/main.js

// === 1. MENYIAPKAN VARIABEL GLOBAL (WADAH DATA) ===
// Kita taruh di 'window' supaya bisa diakses oleh file teacher.js dan student.js
window.currentUser = null;       // Data user yang login dari Google
window.currentUserData = null;   // Data user dari database kita (role, kelas, dll)
window.listeners = [];           // Daftar "penyadap" database (biar bisa dimatikan saat logout)
window.teachingInterval = null;  // Timer untuk Guru
window.clockInterval = null;     // Jam dinding digital

// Variabel Global untuk Game & Kuis
window.currentChatListener = null;
window.currentQuizQuestionsListener = null;
window.currentQuizSessionId = null;
window.currentLobbyPlayersListener = null;
window.currentLobbyStateListener = null;
window.currentLeaderboardListener = null;
window.currentFeedbackListener = null;
window.currentRankListener = null;
window.currentPointStudentListener = null;
window.currentGameSessionId = null;
window.currentGameSessionListener = null;
window.currentGamePlayerListener = null;
window.currentGameLeaderboardListener = null;
window.currentGameQuestionIndex = 0;
window.currentGameQuestions = [];
window.studentShuffledQuestions = [];
window.currentStudentQuestionIndex = 0;
window.studentRawAnswers = [];
window.currentGameData = null;

// Ambil elemen Login dari HTML (nanti kita buat di index.html)
const loginBtn = document.getElementById('login-btn');
const loginSpinner = document.getElementById('login-spinner');

// === 2. PENGECEKAN STATUS LOGIN (SATPAM PINTU GERBANG) ===
// Fungsi ini otomatis jalan setiap kali aplikasi dibuka
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // JIKA SUDAH LOGIN:
        window.currentUser = user;
        if(loginBtn) loginBtn.style.display = 'none'; 
        if(loginSpinner) loginSpinner.style.display = 'flex';
        
        // Cek data dia di database (apakah Guru atau Siswa?)
        await handleUserLogin(user);
    } else {
        // JIKA BELUM LOGIN / SUDAH LOGOUT:
        window.currentUser = null; 
        window.currentUserData = null;
        
        // Matikan semua "penyadap" data biar aplikasi ringan
        window.listeners.forEach(u => u()); 
        window.listeners = [];
        
        // Matikan semua timer
        if(window.teachingInterval) clearInterval(window.teachingInterval);
        if(window.clockInterval) clearInterval(window.clockInterval);
        
        // Tampilkan halaman Login
        showPage('login-page'); 
        if(loginBtn) loginBtn.style.display = 'inline-flex'; 
        if(loginSpinner) loginSpinner.style.display = 'none';
    }
});

// === 3. TOMBOL LOGIN (DITEKAN USER) ===
if(loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginBtn.style.display = 'none'; 
        loginSpinner.style.display = 'flex';
        
        // Panggil Google untuk Login Pop-up
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(e => { 
            console.error(e);
            alert("Login gagal/dibatalkan."); 
            showPage('login-page'); 
            loginBtn.style.display='inline-flex'; 
            loginSpinner.style.display='none'; 
        });
    });
}

// === 4. LOGIKA PEMISAH GURU VS SISWA ===
async function handleUserLogin(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    // Cek Email: Apakah ini Mam Yanti?
    if (user.email.toLowerCase() === TEACHER_EMAIL.toLowerCase()) {
        // --- INI GURU ---
        // Jika data belum ada, buat baru sebagai teacher
        if (!userDoc.exists) await userRef.set({ name: user.displayName, email: user.email, role: 'teacher' }, { merge: true });
        
        // Simpan data user ke variabel global
        window.currentUserData = (await userRef.get()).data();
        
        // Panggil fungsi dari file 'teacher.js'
        initializeTeacherDashboard(user);
        
    } else {
        // --- INI SISWA ---
        // Jika data belum ada, buat baru sebagai student
        if (!userDoc.exists) await userRef.set({ name: user.displayName, email: user.email, role: 'student', classId: null, className: null, totalScore: 0 }, { merge: true });
        
        // Simpan data user ke variabel global
        window.currentUserData = (await userRef.get()).data();
        
        // Panggil fungsi dari file 'student.js'
        initializeStudentDashboard(user, window.currentUserData);
    }
}

// === 5. TOMBOL KEMBALI (GLOBAL) ===
// Supaya tombol "Back" di semua halaman bisa jalan
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const parent = btn.closest('.page');
        
        // Cek halaman saat ini untuk peringatan keamanan (lagi kuis atau tidak?)
        const currentSubPage = btn.closest('.sub-page');
        if (currentSubPage) {
            const currentId = currentSubPage.id;
            if ((currentId.includes('quiz-lobby') || currentId.includes('quiz-game')) && !confirm('Keluar dari sesi kuis?')) return;
            if (currentId.includes('quiz')) resetQuizState();
        }
        
        showSubPage(parent, target);
    });
});
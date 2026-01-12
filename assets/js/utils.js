// assets/js/utils.js

// Variabel global untuk halaman
const pages = document.querySelectorAll('.page');

// Fungsi untuk ganti Halaman Utama (Misal: dari Login ke Dashboard Guru)
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// Fungsi untuk ganti Sub-Halaman (Misal: dari Menu Utama ke Halaman Kuis)
function showSubPage(pageElement, subPageId) {
    // 1. MATIKAN PAKSA SEMUA SUB-HALAMAN
    pageElement.querySelectorAll('.sub-page').forEach(sp => {
        sp.classList.remove('active');
        sp.style.display = 'none'; // Kita paksa hide lewat style langsung
        sp.style.height = '';      // Reset tinggi
        sp.style.overflow = '';    // Reset scroll
    });

    // 2. NYALAKAN HALAMAN TUJUAN
    const target = pageElement.querySelector(`#${subPageId}`);
    if (target) {
        target.classList.add('active');
        
        // Khusus Halaman Chat butuh Flexbox
        if (subPageId.includes('chat')) {
            target.style.display = 'flex';
            target.style.flexDirection = 'column';
            target.style.height = 'calc(100vh - 100px)'; // Tinggi fix biar footer diam
            target.style.overflow = 'hidden';
        } else {
            // Halaman lain (Game, Materi, dll) pakai Block biasa
            target.style.display = 'block';
            target.style.height = 'auto';
            target.style.overflowY = 'auto';
        }
    }
    
    // PENTING: Matikan pendengar (listeners) lama supaya tidak bentrok/error
    if (window.currentChatListener) { window.currentChatListener(); window.currentChatListener = null; }
    if (window.currentQuizQuestionsListener) { window.currentQuizQuestionsListener(); window.currentQuizQuestionsListener = null; }
    if (window.currentLobbyPlayersListener) { window.currentLobbyPlayersListener(); window.currentLobbyPlayersListener = null; }
    if (window.currentLobbyStateListener) { window.currentLobbyStateListener(); window.currentLobbyStateListener = null; }
    if (window.currentLeaderboardListener) { window.currentLeaderboardListener(); window.currentLeaderboardListener = null; }
    if (window.currentRankListener) { window.currentRankListener(); window.currentRankListener = null; }
    if (window.currentPointStudentListener) { window.currentPointStudentListener(); window.currentPointStudentListener = null; }
    if (window.currentGameSessionListener) { window.currentGameSessionListener(); window.currentGameSessionListener = null; }
    if (window.currentGamePlayerListener) { window.currentGamePlayerListener(); window.currentGamePlayerListener = null; }
    if (window.currentGameLeaderboardListener) { window.currentGameLeaderboardListener(); window.currentGameLeaderboardListener = null; }
    
    // Reset status kuis jika kembali ke menu utama
    if (subPageId === 'teacher-main-menu' || subPageId === 'student-main-menu') resetQuizState();
}

// Fungsi untuk mereset data kuis di memori komputer
function resetQuizState() {
    window.currentQuizSessionId = null;
    window.studentShuffledQuestions = [];
    window.currentStudentQuestionIndex = 0;
    window.studentRawAnswers = [];
    
    // Matikan listener khusus lobby
    if (window.currentLobbyPlayersListener) { window.currentLobbyPlayersListener(); window.currentLobbyPlayersListener = null; }
    if (window.currentLobbyStateListener) { window.currentLobbyStateListener(); window.currentLobbyStateListener = null; }
    if (window.currentLeaderboardListener) { window.currentLeaderboardListener(); window.currentLeaderboardListener = null; }
    
    // Sembunyikan tampilan skor akhir siswa
    const scoreDisplay = document.getElementById('student-final-score-display');
    const lobbyText = document.getElementById('student-lobby-status-text');
    if (scoreDisplay) scoreDisplay.style.display = 'none';
    if (lobbyText) {
        lobbyText.style.display = 'block';
        lobbyText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menunggu Guru Memulai...';
    }
}

// Fungsi acak kode kelas (6 karakter)
function generateClassCode() { 
    let c=''; const ch='ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; 
    for(let i=0;i<6;i++) c+=ch.charAt(Math.floor(Math.random()*ch.length)); 
    return c; 
}

// Fungsi acak PIN Kuis (6 angka)
function generateQuizPIN() { 
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}

// Fungsi format tanggal biar enak dibaca (Contoh: Senin, 1 Januari 2025)
function formatReadableDate(d) { 
    return d.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }); 
}

// Fungsi format jam chat (Contoh: 10:30)
function formatChatTimestamp(d) { 
    return d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }); 
}

// Fungsi agar chat otomatis scroll ke paling bawah
function scrollToChatBottom(el) { 
    if(el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 0); 
}

// Fungsi untuk mengacak urutan soal (Shuffle)
function shuffleArray(array) { 
    let s=[...array]; 
    for(let i=s.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [s[i],s[j]]=[s[j],s[i]];
    } 
    return s; 
}

// Fungsi tombol logout
function setupLogout(btnId) { 
    const btn = document.getElementById(btnId);
    if(btn) btn.addEventListener('click', () => { if(confirm('Yakin keluar?')) auth.signOut(); }); 
}
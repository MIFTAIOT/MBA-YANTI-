// ============================================================
// === STUDENT.JS - FINAL FIXED (SINKRON DENGAN HTML) ===
// ============================================================

// 1. INISIALISASI DASHBOARD
function initializeStudentDashboard(user, userData) {
    console.log("Initializing Student Dashboard Pro...");

    

    // Setup Dasar
    setupLogout('student-logout-btn');
    startStudentRealTimeClock(); 

    // Cek Status Kelas & Tampilan
    const joinDiv = document.getElementById('student-join-class');
    const mainDiv = document.getElementById('student-main-content');
    const welcomeMsg = document.getElementById('student-welcome');

    if (!userData.classId) { 
        if(joinDiv) joinDiv.style.display = 'block'; 
        if(mainDiv) mainDiv.style.display = 'none'; 
        if(welcomeMsg) welcomeMsg.textContent = `${user.displayName.split(' ')[0]} (0 XP)`;
    } else { 
        if(joinDiv) joinDiv.style.display = 'none'; 
        if(mainDiv) mainDiv.style.display = 'block'; 
        
        loadStudentContent(userData.classId); 
        checkStudentAttendance(); 
        checkStudentActiveSession(userData.classId); 
        startStudentRealtimeUpdates(user.uid); 
        checkDailyVocab(); 
    }
    

    
    
    // --- EVENT LISTENER ---
    const safeClick = (id, func) => { const el = document.getElementById(id); if (el) el.onclick = func; };

    // Fitur Dasar
    safeClick('join-class-btn', joinClass);
    
    
    // Chat Professional
    safeClick('go-to-chat-btn-student', loadStudentChat);
    safeClick('send-chat-btn-student', sendChatMessageStudent);
    const chatInput = document.getElementById('chat-input-student');
    if(chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessageStudent(); });

    // Navigasi
   
    // --- UPDATE BAGIAN NAVIGASI INI DI initializeStudentDashboard ---
    // --- PERBAIKAN NAVIGASI (Hapus Leaderboard dari array navs biasa) ---
    const navs = [
        ['go-to-quiz-join-btn-student', 'student-quiz-join-page'], 
        ['go-to-game-join-btn-student', 'student-game-join-page']
    ];
    navs.forEach(([btnId, pageId]) => safeClick(btnId, () => showSubPage(document.getElementById('student-dashboard-page'), pageId)));

    // --- TOMBOL RANKING (SOLUSI FINAL: PINDAH HALAMAN) ---
    // Membuka file ranking.html terpisah agar tidak blank/error
    safeClick('go-to-leaderboard-btn', () => {
        console.log("Membuka Ranking di halaman terpisah...");
        window.location.href = 'ranking.html';
    });
    // Kuis Individu
    safeClick('join-quiz-btn', joinQuizSession);
    safeClick('back-to-lobby-btn', () => { window.myQuizData = null; showSubPage(document.getElementById('student-dashboard-page'), 'student-main-menu'); });

    // Game Kelompok
    safeClick('btn-student-join', joinGameSessionStudent);
    safeClick('student-trigger-shuffle-btn', studentTriggerShuffle);
    safeClick('claim-game-xp-btn', claimGameReward);
    
    // Feedback & Modal
    safeClick('submit-feedback-modal-btn', submitFeedback);
    safeClick('close-point-notification-btn', () => document.getElementById('point-notification-modal').classList.remove('active'));
    safeClick('close-warning-modal-btn', () => document.getElementById('answer-warning-modal').classList.remove('active'));
    safeClick('decline-randomize-request-btn', () => document.getElementById('randomize-request-modal').classList.remove('active'));
    document.querySelectorAll('.star-rating').forEach(star => { star.addEventListener('click', function() { selectStar(this.dataset.value); }); });

    // Leaderboard Tabs
    safeClick('rank-tab-global', () => loadLeaderboardNew('global'));
    safeClick('rank-tab-class', () => loadLeaderboardNew('class'));

    showPage('student-dashboard-page'); 
    showSubPage(document.getElementById('student-dashboard-page'), 'student-main-menu');
}

// ============================================================
// === FITUR ABSENSI PINTAR (RESET TOTAL - VERSI STABIL) ===
// ============================================================

// 1. CEK STATUS SAAT LOAD DASHBOARD
function checkStudentAttendance() {
    console.log("Mengecek status absensi...");
    
    const dateDisplay = document.getElementById('attendance-date-display');
    const inputArea = document.getElementById('attend-input-area');
    const statusBox = document.getElementById('attend-status-box');
    
    // Pengaman: Jika HTML belum siap, berhenti.
    if (!dateDisplay || !inputArea) return;

    // Set Tanggal Hari Ini (Format Indo: Senin, 20 Januari 2026)
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const todayStr = new Date().toLocaleDateString('id-ID', options);
    dateDisplay.textContent = todayStr;

    // Ambil Data User untuk cek apakah 'lastAttendanceDate' sama dengan hari ini?
    db.collection('users').doc(window.currentUser.uid).onSnapshot(doc => {
        if (!doc.exists) return;
        const userData = doc.data();
        
        // Cek Logika Utama
        if (userData.lastAttendanceDate === todayStr) {
            // JIKA SUDAH ABSEN HARI INI
            inputArea.style.display = 'none'; // Sembunyikan form
            
            // Ubah Status jadi Hijau
            statusBox.style.background = "#d4edda";
            statusBox.style.border = "2px solid #28a745";
            document.getElementById('attend-icon-area').innerHTML = '<i class="fa-solid fa-circle-check" style="color: #28a745;"></i>';
            document.getElementById('attendance-status-text').textContent = `SUDAH HADIR (No. ${userData.attendanceNumber})`;
            document.getElementById('attendance-status-text').style.color = "#155724";
        } else {
            // JIKA BELUM ABSEN (ATAU HARI BARU)
            inputArea.style.display = 'block'; // Munculkan form
            
            // Reset ke Orange
            statusBox.style.background = "#fff3e0";
            statusBox.style.border = "1px dashed #e67e22";
            document.getElementById('attend-icon-area').innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: #e67e22;"></i>';
            document.getElementById('attendance-status-text').textContent = "BELUM ABSEN";
            document.getElementById('attendance-status-text').style.color = "#d35400";
        }
    });
}

// 2. FUNGSI KIRIM DATA KE DATABASE
window.submitSmartAttendance = async function() {
    const numberInp = document.getElementById('attendance-number');
    const btn = document.getElementById('btn-submit-absen-final');
    
    const nomor = numberInp.value.trim();
    if (!nomor) return alert("⚠️ Mohon isi Nomor Absen kamu!");

    btn.disabled = true; 
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    // Siapkan Data Waktu
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const todayStr = now.toLocaleDateString('id-ID', options); // Untuk tampilan
    const dateSort = now.toISOString().split('T')[0]; // Format "2026-01-20" (Untuk Guru Sorting)
    const timeStr = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});

    try {
        const user = window.currentUser;
        
        // A. SIMPAN KE KOLEKSI 'attendance' (Agar Guru bisa lihat rekap list)
        await db.collection('attendance').add({
            studentId: user.uid,
            studentName: user.displayName,
            classId: window.currentUserData.classId, // Penting untuk filter kelas
            number: nomor,
            dateString: todayStr, // "Senin, 20 Januari..."
            dateSort: dateSort,   // "2026-01-20"
            time: timeStr,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // B. UPDATE USER PROFIL (Agar tombol di HP siswa jadi hijau/terkunci)
        await db.collection('users').doc(user.uid).update({
            lastAttendanceDate: todayStr, // Kunci pengaman harian
            attendanceNumber: nomor,
            totalScore: firebase.firestore.FieldValue.increment(10) // Bonus Poin
        });

        alert("✅ Absensi Berhasil! (+10 XP)");
        // UI akan otomatis berubah karena fungsi checkStudentAttendance pakai onSnapshot

    } catch (error) {
        console.error("Gagal Absen:", error);
        alert("Gagal mengirim data: " + error.message);
        btn.disabled = false;
        btn.innerHTML = 'Coba Lagi';
    }
};

// ==========================================================
// === BAGIAN 2: LISTENING & SPEAKING (SINKRON HTML) ===
// ==========================================================
// GANTI FUNGSI loadStudentSpeakingTasks DENGAN INI (VERSI SMART SPEAKING)
function loadStudentSpeakingTasks(classId) {
    const list = document.getElementById('student-speaking-list');
    if(!list) return;

    // Reset isi list dengan loading spinner
    list.innerHTML = '<div class="spinner"></div>';

    // Ambil Data Tugas & Data Pengumpulan Siswa
    Promise.all([
        db.collection('speakingTasks').where('classId', '==', classId).orderBy('createdAt', 'desc').get(),
        db.collection('speakingSubmissions').where('studentId', '==', window.currentUser.uid).get()
    ]).then(([taskSnap, subSnap]) => {
        
        // Kumpulkan ID tugas yang sudah dikerjakan
        const doneTaskIds = subSnap.docs.map(d => d.data().taskId);

        let html = '';
        if(taskSnap.empty) { 
            list.innerHTML = '<p style="text-align:center; color:#999;">Belum ada tantangan speaking.</p>'; 
            return; 
        }

        taskSnap.forEach(doc => {
            const data = doc.data();
            const taskId = doc.id;
            const isDone = doneTaskIds.includes(taskId);
            const maxXP = data.maxScore || 100; // Default 100 XP jika tidak ada

            if(isDone) {
                // TAMPILAN HIJAU (SUDAH SELESAI)
                // Kita beri alert kalau diklik lagi
                html += `
                <div class="content-item" onclick="alert('Kamu sudah menyelesaikan tantangan ini! Hebat! 🌟')" style="background:#d4edda; border-left: 5px solid #28a745; opacity:0.8; cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:#155724;"><i class="fa-solid fa-check-circle"></i> ${data.title}</strong>
                            <div style="font-size:0.8em; color:#155724; margin-top:5px;">Selesai Dikerjakan ✅</div>
                        </div>
                        <span style="font-size:0.8em; background:#28a745; color:white; padding:3px 8px; border-radius:10px;">${maxXP} XP</span>
                    </div>
                </div>`;
            } else {
                // TAMPILAN BIRU (BELUM) -> MENUJU FITUR BARU
                // Perhatikan: onclick="bukaSmartSpeaking(...)"
                html += `
                <div class="content-item" onclick="bukaSmartSpeaking('${taskId}')" style="cursor:pointer; border-left: 5px solid #007bff; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:#2d3436;">${data.title}</strong>
                            <div style="font-size:0.85em; color:#666; margin-top:5px;">
                                <i class="fa-solid fa-microphone"></i> Tap untuk mulai
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:0.8em; background:#007bff; color:white; padding:3px 8px; border-radius:10px;">${maxXP} XP</span>
                            <br><i class="fa-solid fa-chevron-right" style="color:#ccc; margin-top:5px;"></i>
                        </div>
                    </div>
                </div>`;
            }
        });
        list.innerHTML = html;
    }).catch(err => {
        console.error("Gagal load speaking:", err);
        list.innerHTML = '<p style="color:red; text-align:center;">Gagal memuat data.</p>';
    });
}
// ============================================================
// === FITUR LISTENING SISWA (ISIAN RUMPANG/CLOZE TEST) ===
// ============================================================

// 1. FUNGSI LOAD DAFTAR TUGAS LISTENING (GENERATOR LIST)
function loadStudentListeningList(classId) {
    const list = document.getElementById('student-listening-list');
    if(!list) return;

    // Reset loading
    list.innerHTML = '<div class="spinner"></div>';

    // 1. Ambil daftar tugas Listening
    db.collection('listeningTasks')
        .where('classId', '==', classId)
        .orderBy('createdAt', 'desc')
        .onSnapshot(async (snapshot) => {
            
            // 2. Ambil data nilai siswa (cek mana yg sudah selesai)
            const subSnap = await db.collection('listeningSubmissions')
                .where('studentId', '==', window.currentUser.uid)
                .get();
            
            const doneTaskIds = subSnap.docs.map(d => d.data().taskId);

            let html = '';
            
            if(snapshot.empty) { 
                list.innerHTML = '<p style="text-align:center; color:#999;">Belum ada ujian listening.</p>'; 
                return; 
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const taskId = doc.id;
                const isDone = doneTaskIds.includes(taskId);

                if(isDone) {
                    // SUDAH SELESAI (HIJAU)
                    html += `
                    <div class="content-item" style="background:#d4edda; border-left: 5px solid #28a745; opacity: 0.8; cursor: not-allowed;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="color:#155724;"><i class="fa-solid fa-check-circle"></i> ${data.title}</strong>
                                <div style="font-size:0.8em; color:#155724;">Selesai Dikerjakan ✅</div>
                            </div>
                        </div>
                    </div>`;
                } else {
                    // BELUM SELESAI (BIRU) -> TOMBOL KLIK DISINI
                    // Perhatikan: onclick="openListeningExam(...)" harus sama dengan nama fungsi di bawah!
                    html += `
                    <div class="content-item" onclick="openListeningExam('${taskId}')" style="cursor:pointer; border-left: 5px solid #6f42c1; background:white;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="color:#2d3436;"><i class="fa-solid fa-headphones"></i> ${data.title}</strong>
                                <div style="font-size:0.85em; color:#666;">Ketuk untuk mengerjakan</div>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color:#ccc;"></i>
                        </div>
                    </div>`;
                }
            });
            list.innerHTML = html;
        });
}

// 2. GLOBAL VARIABEL UTK LISTENING
let currentClozeTask = null; 

// 3. FUNGSI MEMBUKA SOAL (INI YANG TADI MISSING/UNDEFINED)
window.openListeningExam = async function(taskId) {
    try {
        console.log("Membuka Listening ID:", taskId); // Debugging

        // Cek dulu apakah sudah dikerjakan?
        const check = await db.collection('listeningSubmissions')
            .where('taskId', '==', taskId)
            .where('studentId', '==', window.currentUser.uid).get();

        if(!check.empty) return alert("⛔ Kamu sudah mengerjakan tugas ini!");

        // Ambil Data Soal
        const doc = await db.collection('listeningTasks').doc(taskId).get();
        if(!doc.exists) return alert("Soal tidak ditemukan.");

        currentClozeTask = { id: doc.id, ...doc.data() };

        // Pindah ke Halaman Listening
        // Pastikan ID 'student-dashboard-page' dan 'student-listening-page' ada di HTML
        const dashPage = document.getElementById('student-dashboard-page');
        const listPage = document.getElementById('student-listening-page');
        
        // Sembunyikan menu utama, tampilkan listening
        document.getElementById('student-main-menu').style.display = 'none';
        listPage.style.display = 'block';
        dashPage.style.display = 'block'; // Pastikan container induk nyala

        // Render Data ke Layar
        document.getElementById('sl-title').textContent = currentClozeTask.title;
        setupListeningMedia(currentClozeTask.link);
        renderClozeContent(currentClozeTask.story);

        // Reset UI Hasil
        document.getElementById('sl-result-box').style.display = 'none';
        const submitBtn = document.getElementById('sl-submit-btn');
        if(submitBtn) {
            submitBtn.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Periksa Jawaban';
        }

    } catch(e) { 
        console.error(e); 
        alert("Error membuka soal: " + e.message); 
    }
};

// 4. SETUP MEDIA PLAYER
function setupListeningMedia(link) {
    const container = document.getElementById('sl-media-container');
    if(!container) return;
    container.innerHTML = ''; 
    
    if (link && link.includes('youtu')) {
        // Embed YouTube
        container.style.display = 'block';
        // Regex ambil ID Youtube
        const vidIdMatch = link.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{10,12})\b/);
        const vidId = vidIdMatch ? vidIdMatch[1] : '';
        if(vidId) {
            container.innerHTML = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${vidId}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            container.innerHTML = '<p style="color:white; padding:10px; text-align:center;">Link Video Tidak Valid</p>';
        }
    } else if (link && (link.includes('mp3') || link.includes('drive'))) {
        // Audio Player
        container.style.display = 'block';
        container.innerHTML = `<audio controls style="width:100%; margin-top:10px;"><source src="${link}" type="audio/mpeg">Browser not supported.</audio>`;
    } else {
        container.style.display = 'none'; 
    }
}

// 5. RENDER TEKS RUMPANG (Convert "___" jadi Input Box)
function renderClozeContent(storyText) {
    const container = document.getElementById('sl-cloze-container');
    if(!container) return;
    
    let inputIndex = 0;
    // Ganti baris baru jadi <br>
    let formattedText = storyText.replace(/\n/g, '<br>');
    
    // Ganti placeholder "___" dengan Input HTML
    formattedText = formattedText.replace(/___/g, function() {
        const html = `<input type="text" id="cloze-ans-${inputIndex}" class="cloze-input" autocomplete="off" placeholder="..." style="border:none; border-bottom:2px solid #6f42c1; background:#f3e5f5; width:100px; text-align:center; padding:5px; border-radius:5px; font-weight:bold; color:#6f42c1; margin:0 5px;">`;
        inputIndex++;
        return html;
    });

    container.innerHTML = formattedText;
}

// 6. LOGIKA SUBMIT JAWABAN (TYPO TOLERANCE)
window.submitClozeListening = async function() {
    if(!currentClozeTask) return;

    const keys = currentClozeTask.answerKeys; // Jawaban benar dari database
    const totalQ = keys.length;
    let totalScore = 0;
    let studentAnswers = [];
    let isAllFilled = true;

    // Loop setiap input
    for(let i=0; i<totalQ; i++) {
        const inputEl = document.getElementById(`cloze-ans-${i}`);
        if(!inputEl) continue;
        
        const userVal = inputEl.value.trim();
        studentAnswers.push(userVal); // Simpan jawaban siswa
        
        if(!userVal) isAllFilled = false;

        // Bandingkan dengan Kunci
        const keyVal = keys[i];
        
        // Panggil fungsi Similarity (Pastikan fungsi ini ada di paling bawah file!)
        const sim = similarity(userVal, keyVal); 

        inputEl.disabled = true; // Kunci agar tidak bisa diedit lagi

        if (sim === 100) {
            // BENAR (Hijau)
            inputEl.style.backgroundColor = "#d4edda";
            inputEl.style.borderBottom = "3px solid #28a745";
            inputEl.style.color = "#155724";
            totalScore += 1;
        } else if (sim >= 70) {
            // TYPO (Kuning - Nilai 0.5)
            inputEl.style.backgroundColor = "#fff3cd";
            inputEl.style.borderBottom = "3px solid #ffc107";
            inputEl.style.color = "#856404";
            totalScore += 0.5;
        } else {
            // SALAH (Merah)
            inputEl.style.backgroundColor = "#f8d7da";
            inputEl.style.borderBottom = "3px solid #dc3545";
            inputEl.style.color = "#721c24";
            // Tampilkan jawaban benar (Opsional)
            inputEl.value += ` (${keyVal})`;
        }
    }

    if(!isAllFilled && !confirm("Masih ada yang kosong. Yakin kumpul?")) return;

    // Hitung Nilai Akhir
    const finalScore = Math.round((totalScore / totalQ) * 100);
    
    // Tampilkan Hasil
    const resBox = document.getElementById('sl-result-box');
    const submitBtn = document.getElementById('sl-submit-btn');
    
    if(submitBtn) submitBtn.style.display = 'none';
    if(resBox) {
        resBox.style.display = 'block';
        document.getElementById('sl-final-score').textContent = finalScore;
        
        let msg = finalScore >= 70 ? "Good Job! 🎉" : "Terus Berlatih! 💪";
        document.getElementById('sl-feedback-msg').textContent = msg;

        // Tombol Klaim
        const claimBtn = document.getElementById('sl-claim-btn');
        // Reset listener lama
        const newClaim = claimBtn.cloneNode(true);
        claimBtn.parentNode.replaceChild(newClaim, claimBtn);
        newClaim.onclick = () => saveListeningResult(finalScore, studentAnswers);
    }
};

// 7. SIMPAN NILAI
async function saveListeningResult(score, answers) {
    const btn = document.getElementById('sl-claim-btn');
    btn.disabled = true; btn.textContent = "Menyimpan...";

    try {
        await db.collection('listeningSubmissions').add({
            taskId: currentClozeTask.id,
            studentId: window.currentUser.uid,
            studentName: window.currentUser.displayName,
            score: score,
            xpGained: score,
            answers: answers,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('users').doc(window.currentUser.uid).update({
            totalScore: firebase.firestore.FieldValue.increment(score)
        });

        alert("Nilai Berhasil Disimpan!");
        tutupListeningExam();

    } catch(e) {
        console.error(e);
        alert("Gagal simpan.");
        btn.disabled = false;
    }
}

// 8. FUNGSI TUTUP / KEMBALI
window.tutupListeningExam = function() {
    // Reset Video
    document.getElementById('sl-media-container').innerHTML = '';
    
    // Sembunyikan Halaman Listening
    document.getElementById('student-listening-page').style.display = 'none';
    
    // Tampilkan Menu Utama
    document.getElementById('student-main-menu').style.display = 'block';
    
    // Refresh List (Biar tombol jadi hijau)
    if(window.currentUserData) loadStudentListeningList(window.currentUserData.classId);
};
// ==========================================
// === FITUR SPEAKING (FIXED & SINKRON) ===
// ==========================================

// Fungsi Navigasi Back yang Aman
window.kembaliKeMenuSpeaking = function() {
    // 1. Matikan Mic jika masih nyala
    if(typeof stopRecording === 'function') stopRecording();
    
    // 2. Pindah Halaman ke Menu Utama
    // Pastikan ID 'student-dashboard-page' dan 'student-main-menu' ada di HTML
    const dashboard = document.getElementById('student-dashboard-page');
    if(dashboard) {
        showSubPage(dashboard, 'student-main-menu');
    } else {
        console.error("Dashboard tidak ditemukan, reload...");
        location.reload();
    }
};

window.openSpeakingTask = async function(taskId) {
    try {
        // Cek Security
        const checkSub = await db.collection('speakingSubmissions')
            .where('taskId', '==', taskId)
            .where('studentId', '==', window.currentUser.uid).get();

        if (!checkSub.empty) {
            alert("⛔ Kamu sudah mengerjakan tugas ini!");
            return;
        }

        const doc = await db.collection('speakingTasks').doc(taskId).get();
        if(!doc.exists) throw new Error("Soal tidak ditemukan di database.");
        
        currentSpeakingTask = { id: doc.id, ...doc.data() };
        
        // Pindah Halaman
        showSubPage(document.getElementById('student-dashboard-page'), 'student-speaking-page');
        
        // Render Data
        const titleEl = document.getElementById('speak-task-title');
        const textEl = document.getElementById('speak-target-text');
        
        if(titleEl) titleEl.textContent = currentSpeakingTask.title;
        if(textEl) textEl.textContent = currentSpeakingTask.targetSentence;
        
        resetSpeakingUI();

        // Setup Tombol Mic (Pakai onclick biar pasti)
        const btnMic = document.getElementById('btn-start-record');
        if(btnMic) {
            // Hapus listener lama (biar gak numpuk)
            const newBtn = btnMic.cloneNode(true);
            btnMic.parentNode.replaceChild(newBtn, btnMic);
            newBtn.onclick = toggleMicrophone;
        }

    } catch(e) {
        console.error(e);
        alert("Gagal membuka soal: " + e.message);
    }
};

function toggleMicrophone() {
    if (isRecording) stopRecording();
    else startRecording();
}

function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser tidak support. Pakai Chrome.");

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.continuous = true; 
    recognition.interimResults = true; 

    recognition.onstart = function() {
        isRecording = true;
        const btn = document.getElementById('btn-start-record');
        if(btn) {
            btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            btn.classList.add('listening');
            btn.style.background = '#ff4757';
            btn.style.color = 'white';
        }
        
        const statusEl = document.getElementById('mic-status');
        if(statusEl) statusEl.textContent = "Mendengarkan... (Klik lagi untuk Stop)";
        
        document.getElementById('speak-live-box').style.display = 'block';
        document.getElementById('speak-result-box').style.display = 'none';
        finalTranscript = '';
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        document.getElementById('speak-live-transcript').textContent = finalTranscript + ' ' + interimTranscript;
    };

    recognition.onerror = function(event) {
        console.error("Mic Error:", event.error);
        stopRecording();
    };

    recognition.start();
}

function stopRecording() {
    if(recognition) { 
        recognition.stop(); 
        recognition = null; 
    }
    isRecording = false;
    
    const btn = document.getElementById('btn-start-record');
    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        btn.classList.remove('listening');
        btn.style.background = '#f5f5f5';
        btn.style.color = '#555';
    }
    
    const statusEl = document.getElementById('mic-status');
    if(statusEl) statusEl.textContent = "Menganalisis Jawaban...";
    
    document.getElementById('speak-live-box').style.display = 'none';

    if(currentSpeakingTask && finalTranscript) {
        analyzeSpeech(finalTranscript, currentSpeakingTask.targetSentence);
    }
}
// GANTI FUNGSI resetSpeakingUI DENGAN INI 👇
function resetSpeakingUI() {
    isRecording = false;
    finalTranscript = '';
    
    // Sembunyikan Box Hasil
    const resBox = document.getElementById('speak-result-box');
    if(resBox) resBox.style.display = 'none';
    
    // Sembunyikan Box Live
    const liveBox = document.getElementById('speak-live-box');
    if(liveBox) liveBox.style.display = 'none';

    // Reset Status Teks
    const statusText = document.getElementById('mic-status-text'); // Pastikan ID ini cocok dgn HTML
    if(statusText) statusText.textContent = "Tap Mic untuk Bicara";

    // Reset Tombol Mic
    const btn = document.getElementById('btn-start-record'); // ID Baru
    if(!btn) btn = document.getElementById('btn-record-toggle'); // Jaga-jaga kalau ID lama

    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        btn.classList.remove('listening');
        btn.style.background = '#f5f5f5';
        btn.style.color = '#555';
    }
}

// GANTI FUNGSI analyzeSpeech DENGAN INI 👇
function analyzeSpeech(userText, targetText) {
    if(!userText) {
        alert("Suara tidak terdengar jelas. Coba lagi.");
        resetSpeakingUI();
        return;
    }
    
    // 1. PEMBERSIHAN TEKS EKSTREM (Hanya ambil Huruf & Angka)
    // Tujuannya agar "Hello." sama dengan "hello"
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/);
    const cleanTarget = targetText.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/);
    
    let htmlOutput = "";
    let correctCount = 0;

    // 2. BANDINGKAN KATA PER KATA
    cleanTarget.forEach((targetWord, index) => {
        const userWord = cleanUser[index] || ""; // Ambil kata siswa di posisi yang sama
        
        // Cek Kemiripan
        const sim = similarity(userWord, targetWord); 
        
        // DEBUG: Cek di Console (Tekan F12) apa yang dibaca komputer
        console.log(`Target: ${targetWord} | Siswa: ${userWord} | Skor: ${sim}%`);

        if (sim === 100) {
            // HIJAU (Pas)
            htmlOutput += `<span class="word-badge w-perfect">${targetWord}</span> `;
            correctCount++;
        } else if (sim >= 70) {
            // KUNING (Mirip/Typo Dikit)
            htmlOutput += `<span class="word-badge w-close">${targetWord}</span> `;
            correctCount += 0.5; // Setengah poin
        } else {
            // MERAH (Salah/Terlewat)
            htmlOutput += `<span class="word-badge w-wrong">${targetWord}</span> `;
        }
    });

    // 3. TAMPILKAN HASIL
    document.getElementById('speak-result-box').style.display = 'block';
    document.getElementById('speak-feedback-text').innerHTML = htmlOutput;
    
    // Tampilkan apa yang didengar komputer (biar siswa tau salahnya dimana)
    document.getElementById('speak-feedback-text').innerHTML += 
        `<br><br><small style="color:#888; font-style:italic;">AI Mendengar: "${userText}"</small>`;

    // 4. HITUNG NILAI AKHIR
    let score = 0;
    if (cleanTarget.length > 0) {
        score = Math.round((correctCount / cleanTarget.length) * 100);
    }
    if(score > 100) score = 100;
    
    document.getElementById('speak-final-score').textContent = score + "%";
    
    // 5. TOMBOL KLAIM & ULANGI (FIXED)
    const btnClaim = document.getElementById('btn-claim-speak-xp');
    const btnRetry = document.getElementById('btn-retry-speak');

    // Reset tombol dulu (hapus event listener lama)
    const newBtnRetry = btnRetry.cloneNode(true);
    btnRetry.parentNode.replaceChild(newBtnRetry, btnRetry);
    
    // Pasang fungsi klik baru
    newBtnRetry.onclick = function() {
        resetSpeakingUI();
    };

    if (score >= 50) {
        btnClaim.style.display = 'block';
        btnClaim.textContent = `🎁 Klaim ${score} XP`;
        
        // Reset tombol klaim juga
        const newBtnClaim = btnClaim.cloneNode(true);
        btnClaim.parentNode.replaceChild(newBtnClaim, btnClaim);
        
        newBtnClaim.onclick = () => claimSpeakingXP(score);
    } else {
        btnClaim.style.display = 'none';
    }
}
async function claimSpeakingXP(score) {
    // ... (Logika simpan database sama seperti sebelumnya) ...
    // Paste kode simpan kamu di sini atau gunakan yang sebelumnya
    // Untuk singkatnya saya asumsikan kode simpannya sudah ada di student.js kamu
     try {
        await db.collection('speakingSubmissions').add({
            taskId: currentSpeakingTask.id,
            studentId: window.currentUser.uid,
            studentName: window.currentUser.displayName,
            score: score,
            xpGained: score,
            recordingText: finalTranscript,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('users').doc(window.currentUser.uid).update({
            totalScore: firebase.firestore.FieldValue.increment(score)
        });
        alert("Selamat! XP Bertambah.");
        kembaliKeMenuSpeaking();
    } catch(e) { console.error(e); alert("Gagal simpan."); }
}

// ============================================================
// FIX CHAT SISWA (PAKET LENGKAP) - Paste di student.js
// ============================================================

// 1. FUNGSI MEMBUKA HALAMAN CHAT (Dipanggil saat klik menu)
function loadStudentChat() {
    // Pindah halaman
    showSubPage(document.getElementById('student-dashboard-page'), 'student-chat-page'); 
    
    // Update Judul
    const className = window.currentUserData.className || 'Kelas';
    document.getElementById('student-chat-title').textContent = `Chat: ${className}`; 
    
    // Panggil Logika Chat (Load Pesan)
    loadStudentChatLogic(window.currentUserData.classId);
}

// 2. FUNGSI LOGIKA CHAT (Listener Database)
function loadStudentChatLogic(fixedCid) {
    const msgContainer = document.getElementById('chat-messages-student');
    const inputField = document.getElementById('chat-input-student'); 
    
    // Pastikan input siswa selalu nyala (Unlock)
    if(inputField) {
        inputField.disabled = false;
        inputField.placeholder = "Ketik pesan ke teman sekelas...";
    }

    // Reset container
    msgContainer.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    
    // Matikan listener lama
    if(window.currentChatListener) { window.currentChatListener(); window.currentChatListener = null; } 

    // Mulai sadap database
    window.currentChatListener = db.collection('chats')
        .where('classId', '==', fixedCid)
        .orderBy('timestamp', 'asc') 
        .limitToLast(50)
        .onSnapshot(snapshot => {
            if(snapshot.empty) { 
                msgContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Belum ada percakapan. Mulai dong! 👋</div>'; 
                return; 
            }

            let html = '';
            let lastSender = '';

            snapshot.forEach(doc => {
                const d = doc.data();
                const isMe = d.senderId === window.currentUser.uid;
                const time = d.timestamp ? d.timestamp.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '...';

                // Render Bubble (Mirip WA)
                html += `
                <div class="chat-message ${isMe ? 'self' : 'other'}">
                    <div class="bubble">
                        ${!isMe && lastSender !== d.senderName ? `<span class="chat-sender-name">${d.senderName}</span>` : ''}
                        ${d.text}
                        <span class="chat-timestamp">${time}</span>
                    </div>
                </div>`;
                lastSender = d.senderName;
            });

            msgContainer.innerHTML = html;
            // Auto Scroll ke Bawah
            setTimeout(() => { msgContainer.scrollTop = msgContainer.scrollHeight; }, 100);
        });
}

// 3. FUNGSI KIRIM PESAN SISWA (YANG HILANG TADI!)
async function sendChatMessageStudent() {
    const txtInput = document.getElementById('chat-input-student');
    
    // Validasi elemen
    if(!txtInput) return;

    const text = txtInput.value.trim();
    // Ambil ID Kelas dari data user yang login
    const classId = window.currentUserData ? window.currentUserData.classId : null;

    // Jangan kirim kalau kosong atau gak punya kelas
    if(!text || !classId) return;
    
    txtInput.value = ''; // Kosongkan input
    
    try {
        await db.collection('chats').add({
            classId: classId,
            senderId: window.currentUser.uid,
            senderName: window.currentUser.displayName,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Scroll manual biar responsif
        const m = document.getElementById('chat-messages-student');
        if(m) m.scrollTop = m.scrollHeight;
        
    } catch(e) {
        console.error("Gagal kirim chat siswa:", e);
        // Tidak perlu alert biar tidak mengganggu UX, cukup log saja
    }
}

// ==========================================================
// === BAGIAN 4: GAME KELOMPOK V3 & LAINNYA ===
// ==========================================================

function startStudentRealTimeClock() {
    if(window.studentClockInterval) clearInterval(window.studentClockInterval);
    function updateTime() { 
        const n = new Date(); 
        const dEl = document.getElementById('student-day-date'); 
        const tEl = document.getElementById('student-time');
        if(dEl) dEl.textContent = n.toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'}); 
        if(tEl) tEl.textContent = n.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}); 
    }
    updateTime(); 
    window.studentClockInterval = setInterval(updateTime, 1000);
}

function checkStudentActiveSession(classId) {
    if(!classId) return;
    db.collection('classes').doc(classId).onSnapshot(doc => {
        if(!doc.exists) return;
        const data = doc.data();
        const waitingScreen = document.getElementById('student-waiting-screen');
        const mainContent = document.getElementById('student-main-content');
        const animOverlay = document.getElementById('start-class-animation');
        const timerPanel = document.getElementById('student-timer-panel');
        const statusText = document.getElementById('student-learning-status-text');
        
        let isActive = data.sessionActive === true;
        
        if (data.sessionEndTime) {
            const endTime = data.sessionEndTime.toDate();
            if(endTime > new Date()) {
                isActive = true;
                if(timerPanel) timerPanel.style.display = 'block';
                runStudentCountdown(endTime);
            } else {
                isActive = false;
                if(timerPanel) timerPanel.style.display = 'none';
            }
        } else {
            if(timerPanel) timerPanel.style.display = 'none';
        }

        if (isActive) {
            if (waitingScreen.style.display !== 'none') {
                animOverlay.style.display = 'flex'; 
                setTimeout(() => { animOverlay.style.display = 'none'; }, 3000); 
            }
            waitingScreen.style.display = 'none'; 
            mainContent.style.display = 'block';  
            if(statusText) { statusText.textContent = "Pembelajaran Sedang Berlangsung"; statusText.parentElement.style.background = "#d4edda"; statusText.style.color = "#155724"; }
        } else {
            waitingScreen.style.display = 'block'; 
            mainContent.style.display = 'none';    
            if(statusText) { statusText.textContent = "Menunggu Guru Memulai..."; statusText.parentElement.style.background = "#fff3cd"; statusText.style.color = "#856404"; }
        }
    });
}
// GLOBAL VARIABLES SISWA (Dua Kunci)
window.studWarn20 = false;
window.studWarn10 = false;
// ==========================================
// === LOGIKA TIMER SISWA (ANTI-BISU) ===
// ==========================================

function runStudentCountdown(endTime) {
    // Bersihkan timer lama
    if(window.studentTimerInterval) clearInterval(window.studentTimerInterval);
    
    const display = document.getElementById('student-countdown-display');
    const panel = document.getElementById('student-timer-panel');
    
    // --- FITUR MEMORI (Agar tidak error saat refresh) ---
    // Gunakan endTime sebagai ID unik sesi ini
    const sessionKey20 = "alarm20_played_" + endTime.getTime();
    const sessionKey10 = "alarm10_played_" + endTime.getTime(); // Sebenarnya ini untuk 5 menit
    
    // Cek di memori browser
    let warn20Played = sessionStorage.getItem(sessionKey20) === 'true';
    let warn10Played = sessionStorage.getItem(sessionKey10) === 'true';

    // Cek kondisi saat refresh (Kembalikan warna jika sudah lewat masanya)
    const currentDiff = endTime - new Date();
    
    // Restore Warna Merah (Jika sisa < 5 menit & sudah pernah bunyi)
    if (currentDiff <= 300000 && currentDiff > 0 && warn10Played) {
        if(panel) { panel.style.background = "#f8d7da"; panel.style.border = "2px solid #dc3545"; }
        if(display) display.style.color = "#dc3545";
    }
    // Restore Warna Oranye (Jika sisa < 20 menit & > 5 menit & sudah pernah bunyi)
    else if (currentDiff <= 1200000 && currentDiff > 300000 && warn20Played) {
        if(display) display.style.color = "#e67e22";
    }

    window.studentTimerInterval = setInterval(() => {
        const now = new Date();
        const diff = endTime - now;

        // === ALARM 1: 20 MENIT (1.200.000 ms) ===
        if (diff <= 1200000 && diff > 300000 && !warn20Played) {
            triggerStudentAlarm("⚠️ Waktu tinggal 20 Menit!");
            if(display) display.style.color = "#e67e22"; // Oranye
            
            // Simpan status
            warn20Played = true;
            sessionStorage.setItem(sessionKey20, 'true');
        }

        // === ALARM 2: 5 MENIT (300.000 ms) ===
        if (diff <= 300000 && diff > 0 && !warn10Played) {
            triggerStudentAlarm("🚨 WAKTU TINGGAL 5 MENIT! \nSegera selesaikan tugas.");
            
            if(panel) {
                panel.style.background = "#f8d7da";
                panel.style.border = "1px solid #dc3545";
            }
            if(display) display.style.color = "#dc3545"; // Merah

            // Simpan status
            warn10Played = true;
            sessionStorage.setItem(sessionKey10, 'true');
        }

        // Tampilan Waktu Habis
        if (diff <= 0) { 
            clearInterval(window.studentTimerInterval); 
            if(display) { display.textContent = "WAKTU HABIS"; display.style.color = "red"; }
            if(panel) panel.style.background = "#e74c3c";
        } else {
            // Render Jam
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            const hh = h < 10 ? '0'+h : h;
            const mm = m < 10 ? '0'+m : m;
            const ss = s < 10 ? '0'+s : s;
            if(display) display.textContent = `${hh}:${mm}:${ss}`;
        }
    }, 1000);
}

// FUNGSI TRIGGER ALARM (DENGAN FORCE UNMUTE)
function triggerStudentAlarm(msg) {
    const audio = document.getElementById('sfx-warning');
    
    if(audio) {
        // 🔥 FORCE RESET PROPERTI AUDIO (KUNCI UTAMA) 🔥
        // Ini memastikan audio tidak bisu meskipun pancingan awal gagal
        audio.muted = false;  
        audio.volume = 1.0;   
        audio.currentTime = 0;

        // Coba putar
        var promise = audio.play();
        
        if (promise !== undefined) {
            promise.catch(error => {
                console.log("Autoplay blocked! Memunculkan tombol darurat.");
                
                // Munculkan Tombol Darurat jika browser memblokir
                const btn = document.createElement('button');
                btn.innerHTML = "🔊 KLIK UNTUK DENGAR ALARM";
                btn.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:9999; padding:15px 30px; background:red; color:white; font-weight:bold; border:none; border-radius:50px; box-shadow:0 0 20px rgba(255,0,0,0.5); animation: pulse 1s infinite; cursor:pointer;";
                
                btn.onclick = () => {
                    audio.muted = false; // Pastikan unmute lagi saat diklik manual
                    audio.play();
                    btn.remove();
                };
                document.body.appendChild(btn);
            });
        }
    }

    // Getar & Alert
    if(navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]); 
    
    // Delay alert agar suara sempat keluar duluan
    setTimeout(() => alert(msg), 200);
}


// LOGIC GAME KELOMPOK
async function joinGameSessionStudent() {
    const pinInput = document.getElementById('inp-student-pin') || document.getElementById('game-pin-input'); 
    if (!pinInput) return alert("Error: Input PIN tidak ditemukan.");
    const pin = pinInput.value.trim();
    if (!pin) return alert("Masukkan Kode PIN dulu!");

    try {
        const snapshot = await db.collection('gameSessions').where('pin', '==', pin).where('status', 'in', ['lobby', 'playing']).limit(1).get();
        if (snapshot.empty) return alert("Kode Room tidak ditemukan.");
        const sessionDoc = snapshot.docs[0];
        window.currentGameId = sessionDoc.id;
        window.currentGameData = sessionDoc.data();

        await db.collection('gameSessions').doc(window.currentGameId).collection('players').doc(window.currentUser.uid).set({
            name: window.currentUser.displayName, score: 0, groupName: null, groupColor: null, status: 'lobby', joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        showSubPage(document.getElementById('student-dashboard-page'), 'student-game-lobby-page');
        monitorGameStudentFinal();
    } catch (e) { console.error(e); alert("Gagal masuk room."); }
}

function monitorGameStudentFinal() {
    if(window.gameListener) window.gameListener(); 
    const sfxCorrect = new Audio('assets/sounds/win.mp3'); 
    const sfxWrong = new Audio('assets/sounds/lose.mp3');
    const sfxTimer = new Audio('assets/sounds/countdown.mp3');

    window.gameListener = db.collection('gameSessions').doc(window.currentGameId).onSnapshot(doc => {
        if(!doc.exists) return;
        const data = doc.data();
        if(data.questions) window.currentGameQuestions = data.questions;

        if(data.status === 'playing') {
            showSubPage(document.getElementById('student-dashboard-page'), 'student-game-play-page');
            const idx = data.currentQuestionIndex || 0;
            if (window.lastRenderedIndex !== idx) {
                renderStudentButtons(idx);
                window.lastRenderedIndex = idx;
                resetButtonStyles(); 
                const oldOverlay = document.getElementById('game-result-overlay'); if(oldOverlay) oldOverlay.remove();
            }
        } else if (data.status === 'finished') {
            showSubPage(document.getElementById('student-dashboard-page'), 'student-game-finished-page');
        }

        const btnContainer = document.getElementById('container-game-buttons');
        const statusLbl = document.getElementById('lbl-game-status');
        if(btnContainer && statusLbl) {
            if(data.roundStatus === 'open') {
                btnContainer.style.opacity = '1'; btnContainer.style.pointerEvents = 'auto';
                statusLbl.textContent = "SILAKAN JAWAB SEKARANG!"; statusLbl.style.color = "green";
                if(sfxTimer.paused) sfxTimer.play().catch(()=>{});
            } else {
                btnContainer.style.opacity = '0.6'; btnContainer.style.pointerEvents = 'none';
                statusLbl.textContent = "Menunggu Hasil dari Mam Yanti..."; statusLbl.style.color = "orange";
                sfxTimer.pause(); sfxTimer.currentTime = 0;
            }
        }
        if(data.shufflerId === window.currentUser.uid && !data.teamsFormed) {
             const cp = document.getElementById('student-lobby-chosen'); if(cp) cp.style.display = 'block';
        }
    });

    db.collection('gameSessions').doc(window.currentGameId).collection('players').doc(window.currentUser.uid).onSnapshot(doc => {
        const p = doc.data(); if(!p) return;
        if(p.groupName) {
            const teamBox = document.getElementById('box-team-info');
            if(teamBox) {
                teamBox.style.display = 'block'; teamBox.style.backgroundColor = p.groupColor;
                document.getElementById('lbl-student-team-name').textContent = p.groupName;
                const cp = document.getElementById('student-lobby-chosen'); if(cp) cp.style.display = 'none';
            }
            const badge = document.getElementById('badge-team-name');
            if(badge) { badge.textContent = "TIM " + p.groupName; badge.style.backgroundColor = p.groupColor; }
            window.currentUserData.groupName = p.groupName;
        }
        if (p.currentAnswer !== null && p.currentAnswer !== undefined) { highlightSelectedButton(p.currentAnswer); } 
        else { resetButtonStyles(); }
        
        if (p.triggerTime && (!window.lastTriggerTime || p.triggerTime.toMillis() > window.lastTriggerTime)) {
            window.lastTriggerTime = p.triggerTime.toMillis();
            if(p.lastAnswerStatus === 'correct') { sfxCorrect.play().catch(()=>{}); showResultOverlay('correct', p.score); } 
            else if (p.lastAnswerStatus === 'wrong') { sfxWrong.play().catch(()=>{}); showResultOverlay('wrong', 0); }
        }
        const scoreBadge = document.getElementById('lbl-team-score'); if(scoreBadge) scoreBadge.textContent = (p.score || 0) + " XP";
        const finalScoreEl = document.getElementById('student-game-final-score'); if(finalScoreEl) finalScoreEl.textContent = (p.score || 0) + " XP";
    });
}

// Logic Shuffle (Acak Tim)
async function studentTriggerShuffle() {
    if (!window.currentGameId) return;
    const selectEl = document.getElementById('student-team-count-select');
    const numGroups = selectEl ? parseInt(selectEl.value) : 4; 
    if(!confirm(`Acak teman jadi ${numGroups} tim?`)) return;
    const btn = document.getElementById('student-trigger-shuffle-btn');
    btn.disabled = true; btn.innerHTML = 'Mengacak...';

    try {
        const sessionRef = db.collection('gameSessions').doc(window.currentGameId);
        await sessionRef.update({ numGroups: numGroups });
        const playersSnap = await sessionRef.collection('players').get();
        const players = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (players.length === 0) throw new Error("Belum ada pemain.");
        const shuffled = players.sort(() => Math.random() - 0.5);
        const groups = Array.from({ length: numGroups }, () => []);
        shuffled.forEach((p, i) => groups[i % numGroups].push(p));
        const groupNames = ['MERAH', 'BIRU', 'HIJAU', 'ORANYE', 'UNGU', 'HITAM'];
        const groupColors = ['red', 'blue', 'green', 'orange', 'purple', 'black'];
        const batch = db.batch();
        groups.forEach((groupMembers, i) => {
            const gName = groupNames[i] || `Tim ${i+1}`;
            const gColor = groupColors[i] || 'grey';
            groupMembers.forEach(player => {
                const pRef = sessionRef.collection('players').doc(player.id);
                batch.update(pRef, { groupName: gName, groupColor: gColor });
            });
        });
        await batch.commit();
        await sessionRef.update({ teamsFormed: true });
        document.getElementById('student-lobby-chosen').style.display = 'none';
    } catch (e) { alert("Gagal mengacak."); btn.disabled = false; btn.innerHTML = 'ACAK SEKARANG'; }
}

function renderStudentButtons(index) {
    if(!window.currentGameQuestions) return;
    const currentQ = window.currentGameQuestions[index];
    document.getElementById('student-game-question-text').textContent = currentQ.questionText;
    ['0', '1', '2', '3'].forEach(i => {
        const btn = document.getElementById('btn-opt-' + i); 
        if(btn) {
            btn.style.opacity = "1"; btn.style.transform = "scale(1)"; btn.style.border = "none"; btn.disabled = false;
            btn.querySelector('.opt-text').textContent = currentQ.options[i];
            const newBtn = btn.cloneNode(true); btn.parentNode.replaceChild(newBtn, btn);
            newBtn.onclick = () => submitGameAnswerFinal(parseInt(i));
        }
    });
}

function highlightSelectedButton(idx) {
    ['0', '1', '2', '3'].forEach(i => {
        const btn = document.getElementById('btn-opt-' + i);
        if(btn) { if (i == idx) { btn.style.opacity = "1"; btn.style.border = "4px solid white"; btn.style.transform = "scale(0.95)"; } else { btn.style.opacity = "0.4"; btn.style.border = "none"; btn.style.transform = "scale(1)"; } }
    });
}

function resetButtonStyles() {
    ['0', '1', '2', '3'].forEach(i => { const btn = document.getElementById('btn-opt-' + i); if(btn) { btn.style.opacity = "1"; btn.style.border = "none"; btn.style.transform = "scale(1)"; } });
}

async function submitGameAnswerFinal(idx) {
    await db.collection('gameSessions').doc(window.currentGameId).collection('players').doc(window.currentUser.uid).update({ currentAnswer: idx, status: 'answered' });
}

function showResultOverlay(status, score) {
    const old = document.getElementById('game-result-overlay'); if(old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'game-result-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:white; font-weight:bold; animation:popIn 0.5s ease;';
    if(status === 'correct') {
        overlay.style.background = 'rgba(46, 204, 113, 0.95)';
        overlay.innerHTML = `<div style="font-size:5em;">🤩</div><h1 style="font-size:3em;">BENAR!</h1><p style="font-size:1.5em;">Skor Tim: ${score}</p>`;
    } else {
        overlay.style.background = 'rgba(231, 76, 60, 0.95)';
        overlay.innerHTML = `<div style="font-size:5em;">😭</div><h1 style="font-size:3em;">SALAH...</h1><p style="font-size:1.2em;">Tetap Semangat!</p>`;
    }
    document.body.appendChild(overlay); setTimeout(() => { if(overlay) overlay.remove(); }, 3000);
}

async function claimGameReward() {
    if(!window.currentGameId) return;
    const btn = document.getElementById('claim-game-xp-btn');
    btn.disabled = true; btn.textContent = 'Memproses...';
    try {
        const pDoc = await db.collection('gameSessions').doc(window.currentGameId).collection('players').doc(window.currentUser.uid).get();
        const xpGained = pDoc.data().score || 0;
        if(xpGained > 0) {
            await db.collection('users').doc(window.currentUser.uid).update({ totalScore: firebase.firestore.FieldValue.increment(xpGained) });
            alert(`Selamat! +${xpGained} XP berhasil diklaim!`);
        } else { alert("Belum dapat poin."); }
        showSubPage(document.getElementById('student-dashboard-page'), 'student-main-menu');
    } catch(e) { alert("Gagal klaim."); btn.disabled = false; }
}

// ==========================================================
// === BAGIAN 5: KONTEN LAIN (MATERI, TUGAS, RANK) ===
// ==========================================================

function loadStudentContent(cid) {
    if(window.contentListeners) window.contentListeners.forEach(u=>u());
    window.contentListeners = [];

    loadStudentListeningList(cid);
    loadStudentSpeakingTasks(cid);
    
    window.contentListeners.push(db.collection('announcements').where('classId','in',[cid,'SEMUA KELAS']).orderBy('createdAt','desc').limit(5).onSnapshot(s=>{ 
        let h=''; s.forEach(d=>h+=`<div class="content-item"><strong>${d.data().title}</strong><p>${d.data().content}</p></div>`); 
        document.getElementById('announcement-list').innerHTML=h; 
    }));
   // --- UPDATED MATERIAL LOADER ---
    window.contentListeners.push(db.collection('materials')
        .where('classId', 'in', [cid, 'SEMUA KELAS'])
        .orderBy('createdAt', 'desc')
        .limit(10)
        .onSnapshot(s => { 
            let h = ''; 
            if(s.empty) { 
                document.getElementById('material-list').innerHTML = '<p style="text-align:center; color:#999; font-size:0.9em;">Belum ada materi.</p>'; 
                return;
            }

            s.forEach(d => { 
                const da = d.data();
                
                // Ikon Smart
                let iconClass = 'fa-link'; let color = '#555';
                if(da.type === 'video' || da.url.includes('youtu')) { iconClass = 'fa-youtube'; color = '#ff0000'; }
                else if(da.type === 'pdf' || da.url.includes('drive')) { iconClass = 'fa-file-pdf'; color = '#e74c3c'; }
                else if(da.type === 'doc') { iconClass = 'fa-file-word'; color = '#2980b9'; }
                else if(da.type === 'slide') { iconClass = 'fa-file-powerpoint'; color = '#d35400'; }

                h += `
                <a href="${da.url}" target="_blank" class="content-item" style="display:flex; align-items:center; text-decoration:none; color:#333; transition:0.2s;">
                    <div style="width:40px; height:40px; background:#f8f9fa; border-radius:50%; display:flex; justify-content:center; align-items:center; margin-right:15px; font-size:1.2em;">
                        <i class="fa-brands ${iconClass}" style="color:${color};"></i>
                    </div>
                    <div>
                        <strong style="display:block; font-size:0.95em;">${da.name}</strong>
                        <small style="color:#888;">Klik untuk membuka</small>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="margin-left:auto; color:#ddd;"></i>
                </a>`; 
            }); 
            document.getElementById('material-list').innerHTML = h; 
        })
    );
   loadStudentAssignmentsAdvanced(cid);
}

function checkDailyVocab() {
    const vocabList = [
        { word: "Persevere", meaning: "Pantang Menyerah", example: "You must persevere to achieve your dreams." },
        { word: "Diligent", meaning: "Rajin", example: "bingung isi opo iki is a diligent student." },
        { word: "Confidence", meaning: "Percaya Diri", example: "Speak English with confidence!" }
    ];
    const today = new Date().toDateString();
    if (localStorage.getItem('lastVocabDate') !== today) {
        const v = vocabList[Math.floor(Math.random() * vocabList.length)];
        document.getElementById('vocab-word-text').textContent = v.word;
        document.getElementById('vocab-meaning-text').textContent = v.meaning;
        document.getElementById('vocab-example-text').textContent = v.example;
        document.getElementById('daily-vocab-modal').style.display = 'flex';
        localStorage.setItem('lastVocabDate', today);
    }
}

function startStudentRealtimeUpdates(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();
            const score = data.totalScore || 0;
            document.getElementById('student-welcome').textContent = `${(data.name||'').split(' ')[0]} (${score} XP)`;
            updateStudentRankUI(score);
        }
    });
}

function updateStudentRankUI(totalScore) {
    const rankContainer = document.getElementById('student-rank-display');
    if(!rankContainer) return;
    let rankName = "Beginner", rankIcon = "🥚", bgStyle = "#f1f2f6";
    if (totalScore >= 1000) { rankName = "LEGEND"; rankIcon = "👑"; bgStyle = "#f4ecf7"; }
    else if (totalScore >= 500) { rankName = "MASTER"; rankIcon = "🦅"; bgStyle = "#fdebd0"; }
    else if (totalScore >= 101) { rankName = "ROOKIE"; rankIcon = "🐣"; bgStyle = "#e3f2fd"; }
    rankContainer.innerHTML = `<div class="rank-badge" style="background:${bgStyle};padding:5px 10px;border-radius:15px;font-size:0.9em;"><span>${rankIcon} ${rankName}</span></div>`;
}

async function submitFeedback() {
    const t = document.getElementById('feedback-critic').value;
    if(!t) return alert("Tulis pesan feedback.");
    await db.collection('feedbacks').add({ 
        studentName: window.currentUser.displayName, critic: t, 
        classId: window.currentUserData.classId, 
        dateString: new Date().toISOString().slice(0,10),
        rating: 5, timestamp: firebase.firestore.FieldValue.serverTimestamp() 
    });
    alert("Terima kasih!"); document.getElementById('student-feedback-modal').classList.remove('active');
}

async function joinClass() { 
    const fullName = document.getElementById('join-student-name').value.trim();
    const absNo = document.getElementById('join-student-number').value.trim();
    const code = document.getElementById('class-code-input').value.trim(); 
    if(!fullName || !absNo || !code) return alert("Lengkapi data!");
    const q = await db.collection('classes').where('code','==',code).get(); 
    if(q.empty) return alert('Kode salah.'); 
    const classId = q.docs[0].id;
    const className = q.docs[0].data().name;
    const formattedAbsNo = absNo.length === 1 ? "0" + absNo : absNo;
    const newDisplayName = `${formattedAbsNo}_${fullName}_${className}`;
    await window.currentUser.updateProfile({ displayName: newDisplayName });
    await db.collection('users').doc(window.currentUser.uid).update({
        classId: classId, className: className, name: newDisplayName,        
        originalName: fullName, nomorAbsen: formattedAbsNo, totalScore: 0
    });
    alert('Berhasil Bergabung!'); location.reload(); 
}

// Kuis Individu
// ============================================================
// === FITUR KUIS INDIVIDU (SECURE CLASS & INSTANT SCORE) ===
// ============================================================

// 1. GABUNG KUIS (DENGAN PROTEKSI KELAS)
async function joinQuizSession() {
    const pinInput = document.getElementById('quiz-pin-input');
    const pin = pinInput.value.trim();

    if (!pin) return alert("Masukkan PIN Kuis!");

    const btn = document.getElementById('join-quiz-btn');
    btn.disabled = true; btn.innerHTML = "Mencari...";

    try {
        // Cari Kuis berdasarkan PIN
        const snapshot = await db.collection('quizSessions')
            .where('pin', '==', pin)
            .where('status', 'in', ['lobby', 'in-progress'])
            .limit(1)
            .get();

        if (snapshot.empty) {
            alert("Kuis tidak ditemukan atau sudah ditutup.");
            btn.disabled = false; btn.innerHTML = "Gabung";
            return;
        }

        const sessionDoc = snapshot.docs[0];
        const sessionData = sessionDoc.data();
        const studentClass = window.currentUserData.classId;

        // --- 🔒 VALIDASI KEAMANAN: CEK KELAS SISWA ---
        // Jika kuis untuk "XII IPA 1" tapi siswa dari "XII IPS 2", TOLAK!
        if (sessionData.classId !== studentClass) {
            alert(`⛔ AKSES DITOLAK!\nKuis ini khusus untuk kelas ${sessionData.classId}.\nKamu terdaftar di kelas ${studentClass}.`);
            btn.disabled = false; btn.innerHTML = "Gabung";
            return;
        }
        // ----------------------------------------------

        // Setup Variabel Global
        window.currentQuizSessionId = sessionDoc.id;
        window.currentQuizQuestions = sessionData.questions || [];
        window.currentQuizIndex = 0;
        window.myQuizScore = 0;

        // Hitung Nilai Per Soal (Otomatis 100 / Jumlah Soal)
        const totalSoal = window.currentQuizQuestions.length;
        window.quizPointValue = (totalSoal > 0) ? (100 / totalSoal) : 0;

        // Cek Pemain (Restore jika refresh)
        const myPlayerRef = db.collection('quizSessions').doc(window.currentQuizSessionId).collection('players').doc(window.currentUser.uid);
        const myPlayerSnap = await myPlayerRef.get();

        if (myPlayerSnap.exists && myPlayerSnap.data().status === 'finished') {
            // Jika sudah selesai, langsung tampilkan hasil (Gak perlu nunggu guru lagi)
            window.myQuizScore = myPlayerSnap.data().score || 0;
            finishStudentQuiz(true); // true = mode view only
            return;
        }

        // Daftarkan Pemain Baru
        await myPlayerRef.set({
            name: window.currentUser.displayName,
            score: 0,
            status: 'ready'
        });

        // Masuk Lobi
        showSubPage(document.getElementById('student-dashboard-page'), 'student-quiz-lobby-page');
        document.getElementById('lobby-quiz-title-student').textContent = sessionData.quizTitle;
        
        monitorStudentQuizSession(window.currentQuizSessionId);

        pinInput.value = '';
        btn.disabled = false; btn.innerHTML = "Gabung";

    } catch (e) {
        console.error(e);
        alert("Gagal join: " + e.message);
        btn.disabled = false; btn.innerHTML = "Gabung";
    }
}

// 2. MONITORING (HANYA UNTUK MULAI GAME)
function monitorStudentQuizSession(sessionId) {
    if (window.quizListener) window.quizListener();

    window.quizListener = db.collection('quizSessions').doc(sessionId).onSnapshot(doc => {
        if (!doc.exists) return;
        const data = doc.data();

        // Kalau Guru Klik Mulai -> Pindah ke Soal
        if (data.status === 'in-progress') {
            const gamePage = document.getElementById('student-quiz-game-page');
            if (gamePage.style.display === 'none') {
                document.getElementById('student-quiz-lobby-page').style.display = 'none';
                gamePage.style.display = 'block';
                renderStudentQuizQuestion();
            }
        }
    });

    // List Pemain di Lobi
    db.collection('quizSessions').doc(sessionId).collection('players').onSnapshot(snap => {
        const countEl = document.getElementById('lobby-player-count-student');
        const listEl = document.getElementById('lobby-player-list-student');
        if(countEl) countEl.textContent = snap.size;
        
        let html = '';
        snap.forEach(d => {
            html += `<div class="lobby-player-item"><i class="fa-solid fa-user"></i> ${d.data().name}</div>`;
        });
        if(listEl) listEl.innerHTML = html;
    });
}

// 3. RENDER SOAL (SAFE MODE)
function renderStudentQuizQuestion() {
    const questions = window.currentQuizQuestions;
    const idx = window.currentQuizIndex;

    // Restore HTML jika rusak
    const gameContainer = document.querySelector('.quiz-game-page');
    if (!document.getElementById('student-question-text')) {
        gameContainer.innerHTML = `
            <div class="quiz-game-header"><h2 id="student-question-number">Soal 1</h2></div>
            <h1 class="quiz-question-text" id="student-question-text">...</h1>
            <div class="quiz-answer-options" style="display:grid; gap:10px;"></div>
            <div class="quiz-game-footer">
                <button class="primary" id="student-next-question-btn" disabled>Lanjut</button>
            </div>
        `;
    }

    // Jika soal habis, langsung Finish
    if (idx >= questions.length) {
        finishStudentQuiz(); 
        return;
    }

    const q = questions[idx];
    document.getElementById('student-question-number').textContent = `Soal ${idx + 1} / ${questions.length}`;
    document.getElementById('student-question-text').textContent = q.text;

    const optionsDiv = document.querySelector('.quiz-answer-options');
    optionsDiv.innerHTML = ''; 

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `<span class="opt-label">${['A','B','C','D'][i]}</span> ${opt}`;
        btn.onclick = () => submitQuizAnswer(i, q.correctIndex, btn);
        optionsDiv.appendChild(btn);
    });

    const nextBtn = document.getElementById('student-next-question-btn');
    nextBtn.style.display = 'none';
}

// 4. JAWAB SOAL
async function submitQuizAnswer(chosenIdx, correctIdx, btnElement) {
    const allBtns = document.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (chosenIdx === correctIdx) {
        btnElement.classList.add('correct');
        window.myQuizScore += window.quizPointValue; // Tambah Nilai
    } else {
        btnElement.classList.add('wrong');
        allBtns[correctIdx].classList.add('correct');
    }

    // Update Skor Sementara ke Guru
    await db.collection('quizSessions').doc(window.currentQuizSessionId)
        .collection('players').doc(window.currentUser.uid)
        .update({ score: Math.round(window.myQuizScore) });

    const nextBtn = document.getElementById('student-next-question-btn');
    nextBtn.style.display = 'block';
    nextBtn.disabled = false;
    
    // Cek tombol terakhir
    if (window.currentQuizIndex === window.currentQuizQuestions.length - 1) {
        nextBtn.textContent = "Selesai & Lihat Hasil";
        nextBtn.onclick = () => finishStudentQuiz(); // Langsung Finish, gak pakai nunggu
    } else {
        nextBtn.textContent = "Soal Berikutnya";
        nextBtn.onclick = () => {
            window.currentQuizIndex++;
            renderStudentQuizQuestion();
        };
    }
}

// 5. SELESAI & KLAIM XP (INSTANT)
async function finishStudentQuiz(isViewOnly = false) {
    // Matikan Listener
    if (window.quizListener) { window.quizListener(); window.quizListener = null; }

    const finalScore = Math.round(window.myQuizScore || 0);
    
    if (!isViewOnly) {
        // Update Status Finished di Database
        await db.collection('quizSessions').doc(window.currentQuizSessionId)
            .collection('players').doc(window.currentUser.uid)
            .update({ 
                status: 'finished',
                score: finalScore
            });

        // Tambah XP ke User Profile
        await db.collection('users').doc(window.currentUser.uid).update({
            totalScore: firebase.firestore.FieldValue.increment(finalScore)
        });
    }

    // TAMPILKAN HASIL LANGSUNG (Tanpa Loading "Menunggu Guru")
    showSubPage(document.getElementById('student-dashboard-page'), 'student-quiz-lobby-page');
    
    // Ubah Lobi jadi Rapor Nilai
    document.getElementById('student-lobby-status-text').style.display = 'none';
    document.querySelector('.spinner').style.display = 'none';
    document.getElementById('lobby-player-list-student').style.display = 'none';
    document.getElementById('lobby-player-count-student').parentElement.style.display = 'none';
    
    const resultBox = document.getElementById('student-final-score-display');
    
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
            <div style="text-align:center; animation: popIn 0.5s ease;">
                <i class="fa-solid fa-trophy" style="font-size:4em; color:#f1c40f; margin-bottom:15px;"></i>
                <h2 style="color:#2c3e50; margin:0;">Selamat!</h2>
                <p style="color:#666;">Kamu telah menyelesaikan kuis.</p>
                <div style="background:#f8f9fa; padding:20px; border-radius:15px; margin:20px 0; border:2px solid #eee;">
                    <span style="display:block; font-size:0.9em; color:#888;">NILAI AKHIR</span>
                    <strong style="font-size:3.5em; color:#2ecc71; line-height:1;">${finalScore}</strong>
                    <span style="display:block; font-size:0.9em; color:#888; margin-top:5px;">+${finalScore} XP Ditambahkan</span>
                </div>
                <button onclick="showSubPage(document.getElementById('student-dashboard-page'), 'student-main-menu')" class="primary" style="width:100%;">
                    Kembali ke Menu
                </button>
            </div>
        `;
    }
}
// ============================================================
// === FITUR LEADERBOARD (VERSI DETEKTIF / DEBUG) ===
// ============================================================
// ============================================================
// === FITUR RANKING BARU (RESET TOTAL) ===
// ============================================================
// ============================================================
// === FITUR LEADERBOARD SISWA (ANTI-BLANK & ERROR DETECTOR) ===
// ============================================================

window.loadLeaderboard = function(mode) {
    console.log("Memuat Leaderboard Siswa Mode:", mode);

    // 1. Cek Kelengkapan Data User
    if (mode === 'class' && (!window.currentUserData || !window.currentUserData.classId)) {
        alert("Data kelasmu belum terdeteksi. Coba refresh halaman.");
        return;
    }

    // 2. Atur Tampilan Tab
    const tabGlobal = document.getElementById('rank-tab-global');
    const tabClass = document.getElementById('rank-tab-class');
    if(tabGlobal && tabClass) {
        tabGlobal.classList.toggle('active', mode === 'global');
        tabClass.classList.toggle('active', mode === 'class');
    }
    
    const container = document.getElementById('leaderboard-list');
    if(!container) return;

    // Reset & Loading
    container.className = ''; 
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    
    // Hapus sticky rank lama
    const oldSticky = document.getElementById('my-sticky-rank');
    if(oldSticky) oldSticky.remove();

    // Matikan listener lama
    if (window.currentRankListener) { window.currentRankListener(); window.currentRankListener = null; }
    
    // 3. SIAPKAN QUERY
    let query = db.collection('users').where('role', '==', 'student').orderBy('totalScore', 'desc');
    
    if (mode === 'class') { 
        query = query.where('classId', '==', window.currentUserData.classId); 
    }

    // 4. JALANKAN QUERY
    window.currentRankListener = query.limit(50).onSnapshot(snapshot => {
        if(snapshot.empty) { 
            container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">Belum ada data ranking.</div>'; 
            return; 
        }
        
        let students = [];
        let myData = null;
        let myRank = 0;

        snapshot.forEach((doc, index) => {
            const d = { id: doc.id, ...doc.data() };
            students.push(d);
            if (doc.id === window.currentUser.uid) {
                myData = d;
                myRank = index + 1;
            }
        });

        let html = '';

        // A. Render Podium (Top 3)
        const top3 = students.slice(0, 3);
        if(top3.length > 0) {
            html += '<div class="podium-wrapper">';
            const order = [1, 0, 2];
            order.forEach(idx => {
                if (top3[idx]) {
                    let rankClass = idx === 0 ? 'winner-1' : (idx === 1 ? 'winner-2' : 'winner-3');
                    let initial = (top3[idx].name || '?').charAt(0).toUpperCase();
                    let safeName = (top3[idx].name || 'Siswa').split(' ')[0];
                    
                    html += `
                    <div class="podium-card ${rankClass}">
                        <div class="podium-avatar">${initial}</div>
                        <div class="podium-block">${idx + 1}</div>
                        <div class="podium-name">${safeName}</div>
                        <div class="podium-xp">${top3[idx].totalScore || 0} XP</div>
                    </div>`;
                }
            });
            html += '</div>';
        }

        // B. Render List (Sisa)
        const rest = students.slice(3);
        if(rest.length > 0) {
            html += '<div class="rank-list-wrapper">';
            let r = 4;
            rest.forEach(s => {
                let isMe = s.id === window.currentUser.uid;
                let bgStyle = isMe ? 'background:#e3f2fd; border:1px solid #2196f3;' : '';
                
                html += `
                <div class="rank-row" style="${bgStyle}">
                    <div class="rank-idx">#${r++}</div>
                    <div class="rank-info">
                        <span class="rank-name">${s.name} ${isMe ? '(Anda)' : ''}</span>
                        <span class="rank-cls">${s.className || '-'}</span>
                    </div>
                    <div class="rank-pts">${s.totalScore || 0} XP</div>
                </div>`;
            });
            html += '</div>';
        }
        
        container.innerHTML = html;

        // C. Sticky Rank (Jika saya tidak masuk Top 3 / Layar di scroll)
        if (myData) {
            const stickyDiv = document.createElement('div');
            stickyDiv.id = 'my-sticky-rank';
            stickyDiv.className = 'sticky-my-rank';
            stickyDiv.innerHTML = `
                <div class="rank-row">
                    <div class="rank-idx">#${myRank}</div>
                    <div class="rank-info">
                        <span class="rank-name">${myData.name} (Anda)</span>
                        <span class="rank-cls">Posisi Kamu Saat Ini</span>
                    </div>
                    <div class="rank-pts">${myData.totalScore} XP</div>
                </div>`;
            document.body.appendChild(stickyDiv);
        }

    }, (error) => {
        // 5. PENANGANAN ERROR (KUNCI PERBAIKAN)
        console.error("Error Leaderboard Siswa:", error);
        
        if (error.message.includes('requires an index')) {
            container.innerHTML = `
            <div style="padding:20px; text-align:center; background:#fff3e0; border:1px solid #ffc107; border-radius:10px; color:#856404;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:2em; margin-bottom:10px;"></i>
                <h3>Database Perlu Index</h3>
                <p>Fitur ranking memerlukan pengaturan database satu kali.</p>
                <p style="font-size:0.9em; margin-top:10px;">
                    <strong>Solusi:</strong> Hubungi Guru/Admin untuk membuka Console (F12) dan klik link perbaikan Index Firebase.
                </p>
            </div>`;
        } else {
            container.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat ranking: ${error.message}</p>`;
        }
    });
};
// Tambahkan fungsi ini di student.js atau update yang sudah ada
window.showTaskPage = async function(taskId) {
    try {
        const doc = await db.collection('assignments').doc(taskId).get();
        if(!doc.exists) return alert("Tugas dihapus.");
        const data = doc.data();

        showSubPage(document.getElementById('student-dashboard-page'), 'student-task-page');
        
        // Render Info
        document.getElementById('task-detail-title').textContent = data.title;
        
        // Render Deskripsi + Tombol Link Folder Guru
        let descHtml = `<p>${data.description}</p>`;
        descHtml += `<div style="background:#fff3cd; padding:10px; border-radius:8px; margin:15px 0; border:1px solid #ffeeba;">
            <strong>⏳ Deadline:</strong> ${data.deadline.toDate().toLocaleString('id-ID')}<br>
            <strong>⭐ Max Point:</strong> ${data.maxScore} XP
        </div>`;
        
        if(data.driveLink) {
            descHtml += `<div style="text-align:center; margin-bottom:20px;">
                <p style="font-size:0.9em; color:#666;">Langkah 1: Upload file tugasmu ke folder ini 👇</p>
                <a href="${data.driveLink}" target="_blank" class="primary" style="display:inline-block; text-decoration:none; background:#198754; padding:10px 20px; border-radius:20px; color:white;">
                    <i class="fa-brands fa-google-drive"></i> Buka Folder Pengumpulan
                </a>
            </div>`;
        }

        document.getElementById('task-detail-desc').innerHTML = descHtml;

        // Setup Tombol Kirim di student.js
        const submitBtn = document.getElementById('submit-task-btn');
        // Kita bind/ikat data task ke tombol biar gampang diambil pas klik
        submitBtn.onclick = () => submitStudentTaskLogic(taskId, data);

    } catch(e) { console.error(e); }
};
// TIMPA FUNGSI INI DI student.js (Ganti yang lama)
async function submitStudentTaskLogic(taskId, taskData) {
    const linkInput = document.getElementById('task-link-input');
    const link = linkInput.value.trim();

    if(!link) return alert("Langkah 2: Salin link file kamu dan tempel di sini dulu!");

    const btn = document.getElementById('submit-task-btn');
    btn.disabled = true; btn.textContent = "Mengirim...";

    const now = new Date();
    const deadline = taskData.deadline.toDate();
    
    // 1. Cek Apakah Telat?
    if (now > deadline) {
        alert("Waduh! Deadline sudah lewat. Tugas tidak bisa dikirim.");
        btn.disabled = false; btn.textContent = "Kirim Tugas";
        return;
    }

    // 2. Hitung Sisa Waktu (dalam Jam)
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60); 
    
    // --- PERBAIKAN DI SINI: KITA KASIH NILAI DEFAULT 100 JIKA DATA KOSONG ---
    // Jika taskData.maxScore tidak ada, otomatis pakai angka 100
    const maxXP = taskData.maxScore ? parseInt(taskData.maxScore) : 100;
    
    let finalScore = maxXP;
    let message = "Kamu mengumpulkan tepat waktu. Great job!";
    let isLateBonus = false; 

    // LOGIKA PEMOTONGAN NILAI
    if (diffHours < 1) {
        // Mepet < 1 Jam: Potong 20%
        finalScore = Math.floor(maxXP * 0.8); 
        message = "Kamu mengumpulkan mepet banget (< 1 jam)! Nilai dipotong 20%.";
        isLateBonus = true;
    } else if (diffHours < 24) {
        // H-1: Potong 10%
        finalScore = Math.floor(maxXP * 0.9);
        message = "Kamu mengumpulkan H-1 deadline. Nilai dipotong 10%.";
        isLateBonus = true;
    }

    // Pastikan finalScore benar-benar angka, kalau masih error kita paksa jadi 0
    if (isNaN(finalScore)) finalScore = 0;

    const formattedName = `${window.currentUserData.nomorAbsen || '00'}_${window.currentUser.displayName.split('_')[1] || window.currentUser.displayName}_${taskData.title}`;

    try {
        const check = await db.collection('assignments').doc(taskId).collection('submissions').doc(window.currentUser.uid).get();
        if(check.exists) {
            alert("Kamu sudah mengumpulkan tugas ini sebelumnya.");
            btn.disabled = false; btn.textContent = "Kirim Tugas";
            return;
        }

        // Simpan ke Firebase
        await db.collection('assignments').doc(taskId).collection('submissions').doc(window.currentUser.uid).set({
            studentName: window.currentUser.displayName,
            studentId: window.currentUser.uid,
            link: link,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            score: finalScore, // Nah, sekarang ini pasti ada angkanya!
            status: isLateBonus ? 'Mepet Deadline' : 'On Time',
            submissionTitle: formattedName
        });

        // Update Total Score Siswa
        await db.collection('users').doc(window.currentUser.uid).update({
            totalScore: firebase.firestore.FieldValue.increment(finalScore)
        });

        // Tampilkan Modal Reward
        document.getElementById('task-xp-amount').textContent = `+${finalScore} XP`;
        document.getElementById('task-xp-msg').textContent = message;
        document.getElementById('task-xp-modal').style.display = 'flex';

        // Reset & Kembali
        linkInput.value = '';
        btn.disabled = false; btn.textContent = "Kirim Tugas";
        showSubPage(document.getElementById('student-dashboard-page'), 'student-main-menu');

    } catch(e) {
        console.error("ERROR SAAT SUBMIT:", e); // Cek console kalau masih error
        alert("Gagal mengirim tugas: " + e.message);
        btn.disabled = false; btn.textContent = "Kirim Tugas";
    }
}
// GANTI FUNGSI INI DI student.js AGAR MENGARAH KE FILE BARU
function loadStudentAssignmentsAdvanced(classId) {
    const listContainer = document.getElementById('assignment-list-student');
    if(!listContainer) return;

    // Reset
    listContainer.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

    // Matikan listener lama
    if (window.currentAssignmentListener) window.currentAssignmentListener();

    window.currentAssignmentListener = db.collection('assignments')
        .where('classId', '==', classId)
        .orderBy('deadline', 'desc')
        .onSnapshot(async (snapshot) => {
            if (snapshot.empty) {
                listContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Tidak ada tugas aktif.</div>';
                return;
            }

            // Render Preview di Dashboard (Hanya 3 Teratas agar tidak penuh)
            // Tapi saat diklik, redirect ke tugas_siswa.html
            let html = '';
            
            // Kita proses data secara async untuk cek status submission
            const tasksPromises = snapshot.docs.map(async doc => {
                const task = doc.data();
                const taskId = doc.id;
                
                // Cek status
                const subSnap = await db.collection('assignments').doc(taskId).collection('submissions').doc(window.currentUser.uid).get();
                const isDone = subSnap.exists;
                const isLate = new Date() > task.deadline.toDate();

                let icon = '<i class="fa-regular fa-circle" style="color:#007AFF;"></i>';
                let colorClass = ''; 
                let statusText = 'Kerjakan';

                if (isDone) { 
                    icon = '<i class="fa-solid fa-circle-check" style="color:#34C759;"></i>'; 
                    colorClass = 'done';
                    statusText = 'Selesai';
                } else if (isLate) {
                    icon = '<i class="fa-solid fa-circle-exclamation" style="color:#FF3B30;"></i>';
                    statusText = 'Telat';
                }

                // INI KUNCINYA: onclick menuju file baru dengan membawa ID Tugas
                return `
                <div class="task-item-student ${colorClass}" 
                     onclick="window.location.href='tugas_siswa.html?taskId=${taskId}'" 
                     style="cursor:pointer; transition:0.2s;">
                    
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="flex-grow:1;">
                            <strong style="font-size:0.95em; display:block;">${task.title}</strong>
                            <small style="color:#888;">${task.deadline.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short'})} • ${statusText}</small>
                        </div>
                        <div style="font-size:1.2em;">${icon}</div>
                    </div>
                </div>`;
            });

            const items = await Promise.all(tasksPromises);
            
            // Tampilkan maksimal 5 tugas di dashboard biar rapi
            listContainer.innerHTML = items.slice(0, 5).join('');
            
            // Tambah tombol "Lihat Semua" di bawah
            if (items.length > 5) {
                listContainer.innerHTML += `
                <div style="text-align:center; margin-top:10px;">
                    <a href="tugas_siswa.html" style="font-size:0.9em; color:#007AFF; text-decoration:none; font-weight:bold;">Lihat Semua Tugas &rarr;</a>
                </div>`;
            }
        });
}

// --- TAMBAHKAN DI student.js ---

let recognition; // Variabel Speech Recognition
let currentSpeakingTask = null; // Menyimpan data soal yang sedang dikerjakan
// GANTI FUNGSI keluarDariSpeaking DENGAN INI (VERSI MANUAL & AMAN)
// GANTI FUNGSI keluarDariSpeaking DENGAN INI 👇
window.keluarDariSpeaking = function() {
    console.log("Navigasi kembali ke menu...");

    // 1. Matikan Mic (Supaya tidak error di background)
    try {
        if (typeof recognition !== 'undefined' && recognition) {
            recognition.stop();
        }
        isRecording = false;
        
        // Reset Tampilan Tombol Mic
        const btn = document.getElementById('btn-start-record') || document.getElementById('btn-record-toggle');
        if(btn) {
            btn.classList.remove('listening');
            btn.style.background = '#f5f5f5';
            btn.style.color = '#555';
            // Kembalikan icon mic
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
        const stat = document.getElementById('mic-status') || document.getElementById('mic-status-text');
        if(stat) stat.textContent = "Tap Mic untuk Bicara";

    } catch (e) { 
        console.warn("Mic stop error ignored:", e); 
    }

    // 2. NAVIGASI AMAN (MENGGUNAKAN showSubPage)
    const dashboard = document.getElementById('student-dashboard-page');
    const menuPage = document.getElementById('student-main-menu');

    // Cek apakah elemen menu ada?
    if (dashboard && menuPage) {
        // OPSI UTAMA: Gunakan fungsi standar aplikasi
        if (typeof showSubPage === 'function') {
            showSubPage(dashboard, 'student-main-menu');
        } 
        // OPSI CADANGAN: Manual Class Manipulation (Sesuai CSS template kamu)
        else {
            const speakPage = document.getElementById('student-speaking-page');
            if (speakPage) {
                speakPage.classList.remove('active');
                speakPage.style.display = 'none';
            }
            menuPage.classList.add('active');
            menuPage.style.display = 'block';
            dashboard.style.display = 'block';
        }

        // 3. Refresh List Tugas (Agar tombol berubah jadi Hijau/Selesai)
        if (window.currentUser && window.currentUser.classId && typeof loadStudentContent === 'function') {
            setTimeout(() => {
                loadStudentContent(window.currentUser.classId);
            }, 500); // Delay sedikit biar transisi mulus
        }
    } else {
        // 4. JARING PENGAMAN (DARURAT)
        // Jika navigasi macet total, Reload halaman adalah solusi terbaik daripada layar putih.
        console.error("Elemen menu hilang, melakukan reload paksa...");
        window.location.reload();
    }
};
// 2. BUKA TUGAS SPEAKING
window.openSpeakingTask = async function(taskId) {
    try {
        // Cek Security (Sudah dikerjakan?)
        const check = await db.collection('speakingSubmissions')
            .where('taskId', '==', taskId)
            .where('studentId', '==', window.currentUser.uid).get();

        if(!check.empty) return alert("⛔ Kamu sudah mengerjakan tugas ini!");

        // Ambil Soal
        const doc = await db.collection('speakingTasks').doc(taskId).get();
        if(!doc.exists) return alert("Soal tidak ditemukan.");

        currentSpeakingTask = { id: doc.id, ...doc.data() };

        // Buka Halaman
        showSubPage(document.getElementById('student-dashboard-page'), 'student-speaking-page');
        
        // Render Teks Soal
        document.getElementById('speak-task-title').textContent = currentSpeakingTask.title;
        document.getElementById('speak-target-text').textContent = currentSpeakingTask.targetSentence;

        resetSpeakingUI();

        // SETUP TOMBOL MIC (ID: btn-record-toggle)
        const btnMic = document.getElementById('btn-record-toggle');
        if(btnMic) {
            // Clone node untuk membersihkan event listener lama
            const newBtn = btnMic.cloneNode(true);
            btnMic.parentNode.replaceChild(newBtn, btnMic);
            newBtn.onclick = toggleMicrophone;
        }
        
        // SETUP TOMBOL RETRY
        const btnRetry = document.getElementById('btn-retry-speak');
        if(btnRetry) {
            const newRetry = btnRetry.cloneNode(true);
            btnRetry.parentNode.replaceChild(newRetry, btnRetry);
            newRetry.onclick = resetSpeakingUI;
        }

    } catch(e) { console.error(e); alert("Error: " + e.message); }
};
// 3. LOGIKA MIC (TOGGLE)
function toggleMicrophone() {
    if (isRecording) stopRecording();
    else startRecording();
}
function startRecording() {
    // Cek Browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser tidak support. Gunakan Chrome.");

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.continuous = true; 
    recognition.interimResults = true; 

    recognition.onstart = function() {
        isRecording = true;
        const btn = document.getElementById('btn-record-toggle'); // ID SESUAI HTML
        const stat = document.getElementById('mic-status-text'); // ID SESUAI HTML
        
        if(btn) {
            btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            btn.classList.add('listening'); // Efek denyut
            btn.style.background = '#e74c3c'; // Merah
            btn.style.color = 'white';
        }
        if(stat) stat.textContent = "Mendengarkan... (Klik lagi untuk STOP)";
        
        document.getElementById('speak-live-box').style.display = 'block';
        document.getElementById('speak-result-box').style.display = 'none';
        finalTranscript = '';
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        document.getElementById('speak-live-transcript').textContent = finalTranscript + ' ' + interimTranscript;
    };

    recognition.onerror = function(event) {
        console.error("Mic Error:", event.error);
        stopRecording();
    };

    recognition.start();
}
function stopRecording() {
    if(recognition) { recognition.stop(); recognition = null; }
    isRecording = false;
    
    const btn = document.getElementById('btn-record-toggle'); // ID SESUAI HTML
    const stat = document.getElementById('mic-status-text'); // ID SESUAI HTML

    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        btn.classList.remove('listening');
        btn.style.background = '#f5f5f5';
        btn.style.color = '#555';
    }
    
    if(stat) stat.textContent = "Menganalisis Jawaban...";
    document.getElementById('speak-live-box').style.display = 'none';

    // Jalankan Analisis
    analyzeSpeech(finalTranscript, currentSpeakingTask.targetSentence);
}
// 4. ANALISIS & STABILO
function analyzeSpeech(userText, targetText) {
    if(!userText) return;

    // Bersihkan teks (hanya ambil huruf & angka agar 'Hello.' match dengan 'hello')
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/);
    const cleanTarget = targetText.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/);
    
    let htmlOutput = "";
    let correctCount = 0;

    // Bandingkan kata per kata
    cleanTarget.forEach((targetWord, index) => {
        const userWord = cleanUser[index] || ""; 
        const sim = similarity(userWord, targetWord); // Pastikan fungsi similarity ada di bawah file!
        
        if (sim === 100) {
            htmlOutput += `<span class="word-badge w-perfect">${targetWord}</span> `; // Hijau
            correctCount++;
        } else if (sim >= 70) {
            htmlOutput += `<span class="word-badge w-close">${targetWord}</span> `; // Kuning
            correctCount += 0.5;
        } else {
            htmlOutput += `<span class="word-badge w-wrong">${targetWord}</span> `; // Merah
        }
    });

   // Tampilkan Hasil
    document.getElementById('speak-result-box').style.display = 'block';
    document.getElementById('speak-feedback-text').innerHTML = htmlOutput;
    // Tampilkan apa yang didengar AI untuk debug siswa
    document.getElementById('speak-feedback-text').innerHTML += `<br><small style="color:#aaa; display:block; margin-top:10px;">AI Mendengar: "${userText}"</small>`;
   // Hitung Skor
    let accuracy = 0;
    if(cleanTarget.length > 0) {
        accuracy = Math.round((correctCount / cleanTarget.length) * 100);
    }
    if(accuracy > 100) accuracy = 100;
    
    document.getElementById('speak-final-score').textContent = accuracy + "%";

  // Hitung XP (Fix XP Undefined)
    let maxXP = currentSpeakingTask.maxScore || 100;
    let earnedXP = Math.round((accuracy / 100) * maxXP);

    // Tombol Klaim
    const btnClaim = document.getElementById('btn-claim-speak-xp');
    if(btnClaim) {
        if (accuracy >= 50) {
            btnClaim.style.display = 'block';
            btnClaim.textContent = `🎁 Klaim ${earnedXP} XP`;
            
            // Reset listener tombol klaim
            const newClaim = btnClaim.cloneNode(true);
            btnClaim.parentNode.replaceChild(newClaim, btnClaim);
            newClaim.onclick = () => claimSpeakingXP(earnedXP, userText, accuracy);
        } else {
            btnClaim.style.display = 'none';
            document.getElementById('mic-status-text').textContent = "Nilai belum cukup. Coba lagi!";
        }
    }
}
// 5. RESET UI (Untuk tombol Ulangi & Awal Buka)
function resetSpeakingUI() {
    isRecording = false;
    finalTranscript = '';
    
    document.getElementById('speak-result-box').style.display = 'none';
    document.getElementById('speak-live-box').style.display = 'none';
    
    const stat = document.getElementById('mic-status-text');
    if(stat) stat.textContent = "Tap Mic untuk Bicara";
    
    const btn = document.getElementById('btn-record-toggle');
    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        btn.classList.remove('listening');
        btn.style.background = '#f5f5f5';
    }
}
// 6. SIMPAN NILAI XP
async function claimSpeakingXP(earned, text, acc) {
    const btn = document.getElementById('btn-claim-speak-xp');
    btn.innerHTML = "Menyimpan..."; btn.disabled = true;

    try {
        await db.collection('speakingSubmissions').add({
            taskId: currentSpeakingTask.id,
            studentId: window.currentUser.uid,
            studentName: window.currentUser.displayName,
            score: acc,
            xpGained: earned,
            recordingText: text,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('users').doc(window.currentUser.uid).update({
            totalScore: firebase.firestore.FieldValue.increment(earned)
        });

        alert(`Hore! +${earned} XP Berhasil Disimpan!`);
        keluarDariSpeaking(); // Keluar otomatis agar status jadi hijau

    } catch(e) {
        console.error(e);
        alert("Gagal menyimpan: " + e.message);
        btn.innerHTML = "Coba Lagi"; btn.disabled = false;
    }
}

// --- GANTI FUNGSI evaluateSpeakingResult DI student.js DENGAN INI ---

function evaluateSpeakingResult(userSpeech) {
    const targetSentence = currentSpeakingTask.targetSentence;
    
    // 1. Bersihkan Tanda Baca & Jadiin Array Kata
    const cleanStr = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
    
    const targetWords = cleanStr(targetSentence).split(/\s+/); // Array kata target (Kunci Jawaban)
    const userWords = cleanStr(userSpeech).split(/\s+/);       // Array kata siswa
    
    let totalScore = 0;
    let htmlResult = '';

    // 2. Loop Setiap Kata di Target (Kunci Jawaban)
    // Kita cek apakah kata target ini ada di ucapan siswa?
    
    targetWords.forEach((tWord, index) => {
        // Cari kata paling mirip di input siswa (Logic Fuzzy Match)
        let bestMatchScore = 0;
        
        userWords.forEach(uWord => {
            const sim = similarity(tWord, uWord);
            if (sim > bestMatchScore) bestMatchScore = sim;
        });

        // 3. Tentukan Warna Stabilo Berdasarkan Kemiripan
        if (bestMatchScore === 1) {
            // HIJAU: Sama Persis (100%)
            htmlResult += `<span class="word-badge w-perfect">${targetSentence.split(' ')[index] || tWord}</span> `;
            totalScore += 1; // Poin penuh
        } else if (bestMatchScore >= 0.7) {
            // KUNING: Mirip/Typo Dikit (>= 70%)
            htmlResult += `<span class="word-badge w-close">${targetSentence.split(' ')[index] || tWord}</span> `;
            totalScore += 0.5; // Poin setengah
        } else {
            // MERAH: Salah Jauh / Tidak Terdeteksi (< 70%)
            htmlResult += `<span class="word-badge w-wrong">${targetSentence.split(' ')[index] || tWord}</span> `;
            // Tidak dapat poin
        }
    });

    // 4. Hitung Akurasi Akhir
    // Rumus: (Total Poin / Jumlah Kata Soal) * 100
    let accuracy = Math.round((totalScore / targetWords.length) * 100);
    if (accuracy > 100) accuracy = 100;
    
    // Hitung XP
    const earnedXP = Math.floor((accuracy / 100) * currentSpeakingTask.maxScore);

    // 5. Tampilkan ke Layar
    document.getElementById('speak-result-area').style.display = 'block';
    
    // Hasil text sekarang berwarna-warni!
    document.getElementById('speak-user-text').innerHTML = htmlResult; 
    
    // Feedback text tambahan
    let feedbackMsg = "";
    if(accuracy === 100) feedbackMsg = "Perfect! Pronunciation kamu juara! 🌟";
    else if(accuracy >= 70) feedbackMsg = "Good job! Sedikit lagi sempurna.";
    else feedbackMsg = "Perhatikan kata yang merah ya. Coba lagi!";

    document.getElementById('speak-accuracy').innerHTML = `${accuracy}% <br><span style="font-size:0.6em; color:#666; font-weight:normal;">${feedbackMsg}</span>`;
    
    // Tombol Klaim
    const claimBtn = document.getElementById('btn-claim-speak-xp');
    if (accuracy >= 50) { // Minimal 50% baru boleh klaim
        claimBtn.style.display = 'block';
        claimBtn.textContent = `Klaim ${earnedXP} XP`;
        claimBtn.onclick = () => saveSpeakingResult(earnedXP, userSpeech, accuracy);
        document.getElementById('mic-status').textContent = "Selesai. Silakan klaim poinmu.";
    } else {
        document.getElementById('mic-status').textContent = "Nilai belum cukup (< 50%). Coba rekam ulang!";
        claimBtn.style.display = 'none';
    }
}
// GANTI FUNGSI similarity DENGAN INI 👇
function similarity(s1, s2) {
    if (!s1 || !s2) return 0; // Kalau salah satu kosong, nilainya 0
    
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) { longer = s2; shorter = s1; }
    
    var longerLength = longer.length;
    if (longerLength == 0) return 100; // Kalau dua-duanya kosong dianggap sama
    
    // Rumus Persentase Kemiripan
    return Math.round(((longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)) * 100);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

// --- FUNGSI CEK JAWABAN (DENGAN TOLERANSI TYPO) ---
async function checkListeningAnswers() {
    const task = window.currentListeningTask;
    const keys = task.answerKeys; // Array Kunci: ["went", "bought"]
    const totalQ = keys.length;
    
    let correctCount = 0;
    let studentAnswers = [];

    // Loop setiap input
    for (let i = 0; i < totalQ; i++) {
        const inputEl = document.getElementById(`ans-${i}`);
        const userVal = inputEl.value.trim();
        studentAnswers.push(userVal);

        // Ambil kunci jawaban asli
        const keyVal = keys[i];

        // Hitung Kemiripan (Pakai fungsi similarity yang sudah ada di student.js bagian bawah)
        const simScore = similarity(userVal, keyVal); 

        // LOGIKA PENILAIAN:
        // Jika kemiripan >= 0.75 (75%), kita anggap Benar (Toleransi Typo)
        if (simScore >= 0.75) {
            correctCount++;
            // Visual: Hijau
            inputEl.style.borderBottom = "3px solid #2ecc71";
            inputEl.style.color = "#2ecc71";
            inputEl.style.background = "#e8f5e9";
        } else {
            // Visual: Merah
            inputEl.style.borderBottom = "3px solid #e74c3c";
            inputEl.style.color = "#e74c3c";
            inputEl.style.background = "#ffebee";
            // Opsional: Tampilkan jawaban benar jika mau
            // inputEl.value += ` (${keyVal})`; 
        }
        inputEl.disabled = true; // Kunci input setelah submit
    }

    // Hitung Nilai Akhir (0 - 100)
    const finalScore = Math.round((correctCount / totalQ) * 100);
    const xpGained = finalScore; // XP sama dengan Nilai

    // Tampilkan Hasil (Modal Overlay)
    showListeningResultModal(finalScore, xpGained, studentAnswers);
}

// FUNGSI MENAMPILKAN MODAL HASIL & KLAIM XP
function showListeningResultModal(score, xp, answers) {
    const overlay = document.createElement('div');
    overlay.className = 'result-overlay'; // Pakai style modal yang sudah ada
    overlay.style.display = 'flex';
    
    let emote = score >= 80 ? '🤩' : (score >= 60 ? '🙂' : '😭');
    
    overlay.innerHTML = `
        <div class="result-card">
            <div style="font-size: 5em;">${emote}</div>
            <h2>Hasil Latihan</h2>
            <h1 style="font-size: 4em; color: #6f42c1; margin:0;">${score}</h1>
            <p>Reward: <strong>+${xp} XP</strong></p>
            <button class="primary" id="btn-claim-listening-xp" style="width:100%; margin-top:20px;">
                Klaim XP & Selesai
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-claim-listening-xp').onclick = async function() {
        const btn = this;
        btn.disabled = true;
        btn.textContent = "Menyimpan...";
        
        try {
            // Simpan ke Firebase
            await db.collection('listeningSubmissions').add({
                taskId: window.currentListeningTask.id,
                studentId: window.currentUser.uid,
                studentName: window.currentUser.displayName,
                score: score,
                xpGained: xp,
                answers: answers, // Simpan jawaban siswa
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update User XP
            if(xp > 0) {
                await db.collection('users').doc(window.currentUser.uid).update({
                    totalScore: firebase.firestore.FieldValue.increment(xp)
                });
            }

            alert("XP Berhasil Diklaim!");
            overlay.remove();
            showSubPage(document.getElementById('student-dashboard-page'), 'student-main-menu');
            
        } catch(e) {
            console.error(e);
            alert("Gagal menyimpan nilai.");
            btn.disabled = false;
        }
    };
}
// ============================================================
// === FITUR SMART SPEAKING V3 (FINAL & STABIL) ===
// ============================================================

let smartRec = null;
let smartTaskData = null; // Menyimpan data soal saat ini
let smartIsRec = false;

// 1. BUKA HALAMAN
window.bukaSmartSpeaking = async function(taskId) {
    try {
        // Cek dulu sudah dikerjakan?
        const check = await db.collection('speakingSubmissions')
            .where('taskId', '==', taskId)
            .where('studentId', '==', window.currentUser.uid).get();

        if(!check.empty) return alert("✅ Kamu sudah menyelesaikan tugas ini!");

        // Ambil Data Soal
        const doc = await db.collection('speakingTasks').doc(taskId).get();
        if(!doc.exists) return alert("Soal tidak ditemukan.");
        
        // SIMPAN DATA KE VARIABEL GLOBAL (PENTING!)
        smartTaskData = { id: doc.id, ...doc.data() };

        // Tampilkan Halaman (Metode Paksa)
        document.getElementById('student-main-menu').style.display = 'none';
        document.getElementById('smart-speaking-page').style.display = 'block';
        document.getElementById('student-dashboard-page').style.display = 'block';

        // Isi Teks
        document.getElementById('smart-title').textContent = smartTaskData.title;
        document.getElementById('smart-target-text').textContent = smartTaskData.targetSentence;
        
        resetSmartUI();

    } catch(e) { console.error(e); alert("Error: " + e.message); }
};

// 2. TUTUP HALAMAN
window.tutupSmartSpeaking = function() {
    // Matikan Mic
    if(smartRec) { smartRec.stop(); smartIsRec = false; }

    // Navigasi Balik
    document.getElementById('smart-speaking-page').style.display = 'none';
    document.getElementById('student-main-menu').style.display = 'block';
    
    // Refresh List (Agar status berubah jadi hijau)
    if(window.currentUserData) loadStudentSpeakingTasks(window.currentUserData.classId);
};

// 3. UI & MIC CONTROL
function resetSmartUI() {
    smartIsRec = false;
    document.getElementById('smart-result-box').style.display = 'none';
    document.getElementById('smart-live-box').style.display = 'none';
    document.getElementById('smart-status').innerHTML = "Tap Mic untuk Mulai";
    document.getElementById('smart-mic-ring').style.animation = 'none';
    
    const btn = document.getElementById('smart-mic-btn');
    btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
    btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    
    // Reset tombol listener
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = toggleSmartMic;
    
    document.getElementById('smart-retry-btn').onclick = resetSmartUI;
}

function toggleSmartMic() {
    if(smartIsRec) stopSmartMic();
    else startSmartMic();
}

function startSmartMic() {
    if (!('webkitSpeechRecognition' in window)) return alert("Gunakan Chrome!");
    
    smartRec = new webkitSpeechRecognition();
    smartRec.lang = 'en-US';
    smartRec.continuous = true;
    smartRec.interimResults = true;
    
    let finalTrans = '';

    smartRec.onstart = function() {
        smartIsRec = true;
        document.getElementById('smart-live-box').style.display = 'block';
        document.getElementById('smart-result-box').style.display = 'none';
        document.getElementById('smart-status').textContent = "Mendengarkan...";
        document.getElementById('smart-mic-ring').style.animation = 'pulseBorder 1.5s infinite';
        
        const btn = document.getElementById('smart-mic-btn');
        btn.style.background = "#dc3545"; // Merah
        btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    };

    smartRec.onresult = function(e) {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) finalTrans += e.results[i][0].transcript;
            else interim += e.results[i][0].transcript;
        }
        document.getElementById('smart-transcript').textContent = finalTrans + ' ' + interim;
    };

    smartRec.onend = function() {
        stopSmartUI();
        analisaSmartSpeaking(finalTrans, smartTaskData.targetSentence);
    };

    smartRec.start();
}

function stopSmartMic() {
    if(smartRec) smartRec.stop();
    smartIsRec = false;
}

function stopSmartUI() {
    document.getElementById('smart-mic-ring').style.animation = 'none';
    const btn = document.getElementById('smart-mic-btn');
    btn.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
    btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    document.getElementById('smart-status').textContent = "Menganalisis...";
    document.getElementById('smart-live-box').style.display = 'none';
}

// 4. ANALISIS & KLAIM
function analisaSmartSpeaking(userSpeech, targetText) {
    if(!userSpeech || !targetText) return;

    const cleanUser = userSpeech.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/);
    const cleanTarget = targetText.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/);
    
    let html = "";
    let correct = 0;

    cleanTarget.forEach((word, i) => {
        const uWord = cleanUser[i] || "";
        const sim = similarity(uWord, word); // Pastikan fungsi similarity ada di bawah!
        
        if(sim === 100) {
            html += `<span style="color:#28a745; font-weight:bold;">${word}</span> `;
            correct++;
        } else if(sim >= 70) {
            html += `<span style="color:#ffc107; font-weight:bold;">${word}</span> `;
            correct += 0.5;
        } else {
            html += `<span style="color:#dc3545; text-decoration:line-through;">${word}</span> `;
        }
    });

    document.getElementById('smart-result-box').style.display = 'block';
    document.getElementById('smart-feedback').innerHTML = html + `<br><small style="color:#888; display:block; margin-top:10px;">AI Mendengar: "${userSpeech}"</small>`;
    
    let score = Math.round((correct / cleanTarget.length) * 100);
    if(score > 100) score = 100;
    
    document.getElementById('smart-score').textContent = score + "%";

    // LOGIKA TOMBOL KLAIM
    const btnClaim = document.getElementById('smart-claim-btn');
    if(score >= 50) {
        btnClaim.style.display = 'block';
        let earnedXP = Math.round((score/100) * (smartTaskData.maxScore || 100));
        btnClaim.textContent = `🎁 Klaim ${earnedXP} XP`;
        
        // Hapus listener lama & pasang baru
        const newClaim = btnClaim.cloneNode(true);
        btnClaim.parentNode.replaceChild(newClaim, btnClaim);
        newClaim.onclick = () => simpanSmartXP(earnedXP, userSpeech, score);
        
        document.getElementById('smart-status').innerHTML = "Luar Biasa! 🎉";
    } else {
        btnClaim.style.display = 'none';
        document.getElementById('smart-status').textContent = "Nilai belum cukup (< 50%). Coba lagi!";
    }
}

async function simpanSmartXP(xp, text, score) {
    const btn = document.getElementById('smart-claim-btn');
    btn.disabled = true; btn.textContent = "Menyimpan...";

    try {
        await db.collection('speakingSubmissions').add({
            taskId: smartTaskData.id,
            studentId: window.currentUser.uid,
            studentName: window.currentUser.displayName,
            score: score,
            xpGained: xp,
            recordingText: text,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('users').doc(window.currentUser.uid).update({
            totalScore: firebase.firestore.FieldValue.increment(xp)
        });

        alert("Selamat! XP Berhasil Ditambahkan!");
        tutupSmartSpeaking(); // Otomatis tutup dan refresh

    } catch(e) {
        console.error(e);
        alert("Gagal simpan: " + e.message);
        btn.disabled = false; btn.textContent = "Coba Lagi";
    }
}

// ============================================================
// === FITUR TAMBAHAN: KENAIKAN KELAS (RESET KELAS) ===
// ============================================================

// Fungsi ini dipanggil saat siswa klik tombol "Keluar Kelas"
window.leaveClassLogic = async function() {
    // 1. Konfirmasi Keamanan
    const yakin = confirm("⚠️ Yakin ingin KELUAR dari kelas saat ini?\n\nXP dan Akun kamu TETAP AMAN.\nKamu hanya perlu memasukkan Kode Kelas baru (misal kelas XI) nanti.");
    
    if (!yakin) return;

    // 2. Proses Reset di Database
    const btn = document.getElementById('btn-leave-class'); // Pastikan ID tombol nanti sama
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = "Memproses...";
    }

    try {
        const uid = window.currentUser.uid;
        
        // Kita HANYA menghapus data kelas (classId & className)
        // Data lain (totalScore, name, dll) TETAP DISIMPAN.
        await db.collection('users').doc(uid).update({
            classId: null,      // Reset ID Kelas
            className: null,    // Reset Nama Kelas
            lastAttendanceDate: null // Reset absen harian (opsional)
        });

        alert("✅ Berhasil Keluar Kelas!\nSilakan masukkan kode kelas barumu.");
        
        // 3. Refresh halaman agar kembali ke menu "Gabung Kelas"
        window.location.reload();

    } catch (error) {
        console.error("Gagal keluar kelas:", error);
        alert("Gagal: " + error.message);
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = "Coba Lagi";
        }
    }
};

// GANTI FUNGSI INI DI student.js
window.openStudentHandPage = function() {
    // 1. Cek apakah siswa sudah punya kelas
    if(!window.currentUserData || !window.currentUserData.classId) {
        return alert("Kamu belum masuk kelas!");
    }
    
    // 2. LANGSUNG PINDAH KE FILE KHUSUS
    // Kita tidak pakai showSubPage lagi, tapi redirect ke file HTML terpisah
    window.location.href = 'raise_hand_student.html';
};

// 2. DENGARKAN STATUS SESI DARI GURU
// GANTI FUNGSI listenHandSession DENGAN INI:
function listenHandSession(classId) {
    const statusText = document.getElementById('hand-status-text');
    const btn = document.getElementById('btn-raise-hand');
    const feedback = document.getElementById('hand-feedback');

    // === PENGAMAN DARI COPILOT (NULL CHECK) ===
    // Kalau elemen HTML tidak ditemukan, STOP di sini (Jangan lanjut biar gak error)
    if (!statusText || !btn || !feedback) {
        console.warn("⚠️ PERINGATAN: Elemen 'student-hand-page' tidak ditemukan di HTML.");
        console.warn("Pastikan kode HTML halaman Adu Cepat sudah ditempel di index.html!");
        return; 
    }
    // ============================================

    // Matikan listener lama
    if(handListener) {
        handListener();
        handListener = null;
    }

    handListener = db.collection('handSessions').doc(classId).onSnapshot(doc => {
        const data = doc.data();

        if (data && data.status === 'OPEN') {
            statusText.textContent = "CEPAT TEKAN TOMBOL!";
            statusText.style.color = "#e74c3c";
            
            btn.disabled = false;
            btn.style.background = "#e74c3c"; 
            btn.style.boxShadow = "0 10px 0 #c0392b";
            btn.style.cursor = "pointer";
            btn.style.transform = "scale(1.1)";
            
            btn.onclick = () => doRaiseHand(classId);

        } else {
            statusText.textContent = "Menunggu Guru Membuka Sesi...";
            statusText.style.color = "#7f8c8d";
            
            btn.disabled = true;
            btn.style.background = "#bdc3c7"; 
            btn.style.boxShadow = "0 10px 0 #95a5a6";
            btn.style.cursor = "not-allowed";
            btn.style.transform = "scale(1)";
            
            feedback.textContent = ""; 
            btn.onclick = null;
        }
    });
}

// 3. AKSI SAAT SISWA MENEKAN TOMBOL
async function doRaiseHand(classId) {
    const btn = document.getElementById('btn-raise-hand');
    const feedback = document.getElementById('hand-feedback');

    // Matikan tombol langsung biar gak spam
    btn.disabled = true;
    btn.style.background = "#2ecc71"; // Jadi Hijau
    btn.style.boxShadow = "0 0 0"; // Efek terpencet
    btn.style.transform = "translateY(10px)";
    
    feedback.textContent = "Mengirim Sinyal... 🚀";

    try {
        // Kirim data ke Firebase (Sub-collection 'buzzers')
        await db.collection('handSessions').doc(classId).collection('buzzers').doc(window.currentUser.uid).set({
            studentName: window.currentUserData.name, // Pakai nama asli siswa
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Waktu Server (Adil)
        });

        feedback.textContent = "🎉 BERHASIL! Tunggu Mam Yanti panggil.";
        feedback.style.color = "#27ae60";

    } catch(e) {
        console.error(e);
        feedback.textContent = "Gagal Mengirim! Coba lagi.";
        feedback.style.color = "red";
        
        // Kembalikan tombol merah jika gagal
        btn.disabled = false;
        btn.style.background = "#e74c3c";
        btn.style.transform = "scale(1.1)";
    }
}
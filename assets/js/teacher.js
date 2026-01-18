// ============================================================
// === TEACHER.JS - BAGIAN 1: SETUP & CORE ===
// ============================================================

// --- 1. GLOBAL VARIABLES (WAJIB DI PALING ATAS) ---
// Ini memperbaiki error "Cannot access before initialization"
let currentGradebookData = []; 
let tokenClient = null; 
let currentFeedbackListener = null;
let currentChatListener = null;
let currentGameSessionId = null; // Tambahan untuk Game

// --- 2. GLOBAL FUNCTIONS (WAJIB DI WINDOW AGAR BISA DIKLIK HTML) ---

// Fungsi Beri Poin Manual (Fix ReferenceError)
window.givePoints = async function(uid, inpId) {
    const inputEl = document.getElementById(inpId);
    if(!inputEl) return alert("Input tidak ditemukan");
    
    const val = parseInt(inputEl.value);
    if(!val) return alert("Masukkan angka poin!");
    
    if(confirm(`Yakin beri ${val} poin ke siswa ini?`)) {
        try {
            await db.collection('users').doc(uid).update({ 
                totalScore: firebase.firestore.FieldValue.increment(val) 
            });
            alert("Poin berhasil dikirim! 🌟");
        } catch (e) {
            console.error(e);
            alert("Gagal kirim poin: " + e.message);
        }
    }
};

// Fungsi Ganti Tab Poin/Rank (Fix ReferenceError)
window.switchTeacherPointTab = function(tab) {
    // Update Tombol Aktif
    const btnPoints = document.getElementById('t-tab-points');
    const btnRank = document.getElementById('t-tab-rank');
    
    if(btnPoints && btnRank) {
        btnPoints.classList.toggle('active', tab === 'points');
        btnRank.classList.toggle('active', tab === 'rank');
    }

    // Update Konten Aktif
    const contentPoints = document.getElementById('t-content-points');
    const contentRank = document.getElementById('t-content-rank');

    if(contentPoints) contentPoints.style.display = tab === 'points' ? 'block' : 'none';
    if(contentRank) contentRank.style.display = tab === 'rank' ? 'block' : 'none';

    // Jika buka tab Rank, load datanya
    if(tab === 'rank') loadTeacherLeaderboard();
};

// --- 3. INISIALISASI DASHBOARD ---
function initializeTeacherDashboard(user) {
    console.log("Initializing Teacher Dashboard V-Final...");
    setupLogout('teacher-logout-btn');
    startRealTimeClock();
    loadSpeakingTasks();
    checkActiveSession();

    // A. Navigasi Menu Utama
    const navMap = {
        'go-to-gradebook-btn': 'teacher-gradebook-page',
        'go-to-create-task-btn': 'teacher-task-page',
        'go-to-announcements-btn': 'teacher-announcement-page',
        'go-to-materials-btn': 'teacher-material-page',
        'go-to-attendance-btn': 'teacher-attendance-page',
        'go-to-chat-btn-teacher': 'teacher-chat-page',
        'go-to-quiz-btn': 'teacher-quiz-page',
        'go-to-game-btn': 'teacher-game-page',
        'go-to-points-page-btn': 'teacher-points-page',
        'go-to-feedback-results-btn': 'teacher-feedback-page',
        'go-to-speaking-admin-btn': 'teacher-speaking-page',
        
    };

    for (const [btnId, pageId] of Object.entries(navMap)) {
        const btn = document.getElementById(btnId);
        if(btn) btn.onclick = () => {
            showSubPage(document.getElementById('teacher-dashboard-page'), pageId);
            
            // Trigger Load Data Khusus saat pindah halaman
            if(pageId === 'teacher-gradebook-page') loadClassesForGradebook();
            if(pageId === 'teacher-points-page') loadClassesForPoints();
            if(pageId === 'teacher-feedback-page') { 
                loadClassesForFeedbackDropdown();
                const d = document.getElementById('feedback-date-select');
                if(d) d.valueAsDate = new Date();
            }
            if(pageId === 'teacher-chat-page') loadTeacherChatUI();
        };
    }

    // B. Tombol Fitur CRUD
    const btnCreateClass = document.getElementById('create-class-btn'); if(btnCreateClass) btnCreateClass.onclick = createClass;
    const btnCreateTask = document.getElementById('create-task-btn'); if(btnCreateTask) btnCreateTask.onclick = createAssignment;
    const btnOpenTaskModal = document.getElementById('open-assignment-modal-btn'); 
    if(btnOpenTaskModal) {
        btnOpenTaskModal.onclick = () => {
            // 1. Reset isi form di dalam modal biar bersih
            document.getElementById('assignment-title').value = '';
            document.getElementById('assignment-desc').value = '';
            document.getElementById('assignment-drive-link').value = '';
            document.getElementById('assignment-deadline').value = '';
            document.getElementById('assignment-class-select').value = ''; // Reset dropdown kelas

            // 2. Munculkan Modal
            document.getElementById('create-assignment-modal').style.display = 'flex';
        };
    }
    const btnPubAnnounce = document.getElementById('publish-announcement-btn'); if(btnPubAnnounce) btnPubAnnounce.onclick = publishAnnouncement;
    const btnUploadMat = document.getElementById('upload-material-btn'); if(btnUploadMat) btnUploadMat.onclick = initPicker;
    const btnViewAtt = document.getElementById('view-attendance-btn'); if(btnViewAtt) btnViewAtt.onclick = viewAttendance;
    const btnLoadFb = document.getElementById('load-feedback-btn'); if(btnLoadFb) btnLoadFb.onclick = loadFeedbackResults;

    // C. Chat Listener
    const chatSelect = document.getElementById('chat-class-select-teacher'); 
    if(chatSelect) chatSelect.addEventListener('change', () => loadChat('chat-class-select-teacher', 'chat-messages-teacher', 'chat-input-teacher', 'send-chat-btn-teacher'));
    
    const chatSend = document.getElementById('send-chat-btn-teacher'); 
    if(chatSend) chatSend.onclick = sendChatMessageTeacher;
    
    const chatInput = document.getElementById('chat-input-teacher'); 
    if(chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessageTeacher(); });

    // D. Timer & Feedback Sesi
    const endBtn = document.getElementById('end-session-btn'); if(endBtn) endBtn.onclick = openEndSessionModal;
    const cancelEndBtn = document.getElementById('cancel-end-session-btn'); if(cancelEndBtn) cancelEndBtn.onclick = closeEndSessionModal;
    const confirmEndBtn = document.getElementById('confirm-end-session-btn'); if(confirmEndBtn) confirmEndBtn.onclick = confirmEndSession;
    const startTimerBtn = document.getElementById('start-timer-btn'); if(startTimerBtn) startTimerBtn.onclick = startTeachingTimer;

    // E. Game & Quiz Init (Fungsi ada di PART 3)
    if(typeof initQuizTeacher === 'function') initQuizTeacher(); 
    if(typeof initGameTeacher === 'function') initGameTeacher(); 
    if(typeof initSpeakingFeatureTeacher === 'function') initSpeakingFeatureTeacher();
    if(typeof initListeningTeacher === 'function') initListeningTeacher();

    // F. Load Data Awal
    loadTeacherData();
    setupDeleteListeners();

    // Tampilkan Halaman Awal
    showPage('teacher-dashboard-page');
    showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-main-menu');
    
    const dateInput = document.getElementById('attendance-recap-date');
    if(dateInput) dateInput.valueAsDate = new Date();
}

// GANTI FUNGSI loadTeacherData DENGAN INI 👇👇
function loadTeacherData() {
    if(window.listeners) window.listeners.forEach(u => u());
    window.listeners = [];
    
    const classListEl = document.getElementById('class-code-list');
    
    // Kita pantau data kelas dari Database
    const unsubscribe = db.collection('classes').where('teacherId', '==', window.currentUser.uid).onSnapshot(s => {
        let listHtml = ''; 
        let optionHtml = '<option value="">-- Pilih Kelas --</option>'; 
        let optionAll = optionHtml + '<option value="SEMUA KELAS">SEMUA KELAS</option>';
        
        s.forEach(d => {
            const da = d.data();
            // Isi List Kelas di Menu Utama
            listHtml += `<div class="list-item-teacher">
                            <span>${da.name}<br><strong class="code">${da.code}</strong></span>
                            <button class="delete-btn" data-id="${d.id}" data-collection="classes">Hapus</button>
                         </div>`;
            // Isi Opsi Dropdown
            optionHtml += `<option value="${d.id}">${da.name}</option>`;
            optionAll += `<option value="${d.id}">${da.name}</option>`;
        });
        
        if(classListEl) classListEl.innerHTML = s.empty ? '<p style="text-align:center;">Belum ada kelas.</p>' : listHtml;
        
        // --- BAGIAN PENTING: UPDATE SEMUA DROPDOWN ---
        const ids = [
            'assignment-class-select', 
            'task-class-target', 
            'attendance-recap-class', 
            'chat-class-select-teacher', 
            'quiz-class-target', 
            'timer-class-target', 
            'speaking-class-target', 
            'listening-class-target', 
            'gradebook-class-select', 
            'points-class-select', 
            'feedback-class-select', 
            'material-class-target', 
            'announcement-class-target', 
            'end-session-class-select', 
            'game-class-select-final',
            'listening-bracket-class',
            'speaking-new-class',
            'auto-listen-class'
        ];

        ids.forEach(id => { 
            const el = document.getElementById(id); 
            // Cek kalau elemennya ada, baru diisi (biar gak error)
            if(el) {
                // Jika itu dropdown pengumuman/materi, pakai opsi "SEMUA KELAS", selain itu pakai "Kelas Spesifik"
                el.innerHTML = (id.includes('announcement') || id.includes('material')) ? optionAll : optionHtml;
            }
        });

        loadTeacherMaterials(); 
    });
    
    window.listeners.push(unsubscribe);
    loadTeacherAnnouncements();
    loadAssignmentsForList();
}

// ============================================================
// === TEACHER.JS - BAGIAN 2: POIN, GRADEBOOK, CHAT, DRIVE ===
// ============================================================

// --- 5. POIN & RANKING (FIX REFERENCE ERROR) ---
// Gunakan window. agar bisa dipanggil onclick HTML
window.givePoints = async function(uid, inpId) {
    const val = parseInt(document.getElementById(inpId).value);
    if(!val) return alert("Masukkan angka.");
    if(confirm(`Beri ${val} poin?`)) {
        try {
            await db.collection('users').doc(uid).update({ totalScore: firebase.firestore.FieldValue.increment(val) });
            alert("Terkirim!");
        } catch(e) { alert("Gagal: " + e.message); }
    }
};

window.switchTeacherPointTab = function(tab) {
    const p = document.getElementById('t-tab-points');
    const r = document.getElementById('t-tab-rank');
    if(p && r) {
        p.classList.toggle('active', tab==='points');
        r.classList.toggle('active', tab==='rank');
    }
    const cp = document.getElementById('t-content-points');
    const cr = document.getElementById('t-content-rank');
    if(cp) cp.style.display = tab==='points'?'block':'none';
    if(cr) cr.style.display = tab==='rank'?'block':'none';
    
    if(tab==='rank') loadTeacherLeaderboard();
};

async function loadClassesForPoints() {
    const el = document.getElementById('points-class-select');
    const src = document.getElementById('task-class-target');
    if(src && el) { 
        el.innerHTML = src.innerHTML;
        el.value = ""; 
    }
    el.onchange = loadStudentsForPoints;
}

function loadStudentsForPoints() {
    const cid = document.getElementById('points-class-select').value;
    const l = document.getElementById('student-list-for-points');
    
    if(!cid) return l.innerHTML='<p style="text-align:center">Pilih kelas dulu.</p>';
    l.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    
    if(window.currentPointStudentListener) { window.currentPointStudentListener(); window.currentPointStudentListener = null; }

    window.currentPointStudentListener = db.collection('users').where('classId','==',cid).where('role','==','student').orderBy('name').onSnapshot(s => {
        if(s.empty) return l.innerHTML='<p style="text-align:center">Belum ada siswa.</p>';
        let h=''; 
        s.forEach(d => {
            const da=d.data();
            h+=`<div class="student-point-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
                <span><strong>${da.name}</strong><br><small>${da.totalScore||0} XP</small></span>
                <div style="display:flex; gap:5px;">
                    <input type="number" id="pt-${d.id}" value="10" style="width:60px; padding:5px;"> 
                    <button onclick="window.givePoints('${d.id}','pt-${d.id}')" class="secondary" style="padding:5px 10px;"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>`;
        }); 
        l.innerHTML=h;
    });
}

/// GANTI FUNGSI loadTeacherLeaderboard di teacher.js

// ============================================================
// === FITUR RANKING GURU (ANTI-BLANK & ERROR DETECTOR) ===
// ============================================================

function loadTeacherLeaderboard() {
    const container = document.getElementById('teacher-rank-list');
    if(!container) return;

    // Reset isi & Tampilkan Loading
    container.className = ''; 
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

    // Matikan listener lama biar gak numpuk
    if(window.currentRankListener) { window.currentRankListener(); window.currentRankListener = null; }

    // QUERY DATABASE
    window.currentRankListener = db.collection('users')
        .where('role','==','student')
        .orderBy('totalScore','desc')
        .limit(50)
        .onSnapshot(snapshot => {
            // 1. JIKA DATA KOSONG
            if(snapshot.empty) {
                container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">Belum ada data siswa.</div>';
                return;
            }

            let students = [];
            snapshot.forEach(doc => students.push({ id:doc.id, ...doc.data() }));

            let html = '';

            // 2. RENDER PODIUM (TOP 3)
            const top3 = students.slice(0, 3);
            if (top3.length > 0) {
                html += '<div class="podium-wrapper">';
                const order = [1, 0, 2]; // Urutan: Juara 2 (Kiri), Juara 1 (Tengah), Juara 3 (Kanan)
                
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

            // 3. RENDER LIST SISANYA (Rank 4-50)
            const rest = students.slice(3);
            if (rest.length > 0) {
                html += '<div class="rank-list-wrapper">';
                let currentRank = 4;
                rest.forEach(s => {
                    html += `
                    <div class="rank-row">
                        <div class="rank-idx">#${currentRank++}</div>
                        <div class="rank-info">
                            <span class="rank-name">${s.name}</span>
                            <span class="rank-cls">${s.className || '-'}</span>
                        </div>
                        <div class="rank-pts">${s.totalScore || 0} XP</div>
                    </div>`;
                });
                html += '</div>';
            }

            container.innerHTML = html;

        }, (error) => {
            // 4. PENANGANAN ERROR (JIKA BLANK/MACET)
            console.error("Error Leaderboard Guru:", error);
            
            if (error.message.includes('requires an index')) {
                // Tampilkan Link Perbaikan Index
                container.innerHTML = `
                <div style="padding:15px; background:#fff3e0; border:1px solid #ffc107; border-radius:10px; text-align:center; color:#856404;">
                    <h3>⚠️ DATABASE PERLU SETUP</h3>
                    <p>Firebase menolak karena Index belum dibuat.</p>
                    <p style="font-size:0.9em;">Buka <b>Console Browser (Tekan F12)</b> di Laptop, lihat pesan error merah, dan klik link panjang di sana untuk membuat index secara otomatis.</p>
                </div>`;
            } else {
                container.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat: ${error.message}</p>`;
            }
        });
}
// Fungsi helper ambil inisial nama (Misal: Mukhamad Miftah -> MM)
function getInitials(name) {
    if(!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
// --- 6. GRADEBOOK (FIXED INITIALIZATION) ---
function loadClassesForGradebook() {
    const select = document.getElementById('gradebook-class-select');
    const source = document.getElementById('task-class-target');
    if(source && select) { select.innerHTML = source.innerHTML; select.value = ""; }
    
    select.onchange = () => loadGradebookData(select.value);
    const refreshBtn = document.getElementById('refresh-gradebook-btn');
    if(refreshBtn) refreshBtn.onclick = () => loadGradebookData(select.value);
}

async function loadGradebookData(classId) {
    const tbody = document.getElementById('gradebook-tbody');
    const exportBtn = document.getElementById('export-excel-btn');
    
    if(!classId) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Pilih kelas.</td></tr>'; exportBtn.disabled = true; return; }
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;"><div class="spinner"></div> Loading...</td></tr>';

    try {
        const s = await db.collection('users').where('classId','==',classId).where('role','==','student').orderBy('name').get();
        if(s.empty) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Kosong.</td></tr>'; exportBtn.disabled = true; return; }

        let html = ''; currentGradebookData = []; let no = 1; 
        s.forEach(doc => {
            const d = doc.data(); 
            const xp = d.totalScore || 0; 
            const att = d.totalAttendance || 0;
            let rank = xp>=1000?"LEGEND":(xp>=500?"MASTER":(xp>=100?"ROOKIE":"Beginner"));
            
            currentGradebookData.push({ No: no, Nama: d.name, Hadir: att, XP: xp, Rank: rank });
            html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;">${no++}</td><td style="padding:10px;"><strong>${d.name}</strong></td><td style="text-align:center;">${att}</td><td>${xp} XP</td><td>${rank}</td></tr>`;
        });
        tbody.innerHTML = html;
        exportBtn.disabled = false; 
        exportBtn.onclick = () => downloadExcel();
    } catch(e) { console.error(e); tbody.innerHTML = '<tr><td colspan="5" style="color:red;">Error loading data.</td></tr>'; }
}

function downloadExcel() {
    if(currentGradebookData.length === 0) return alert("Data kosong.");
    let csv = "No,Nama,Total Hadir,Total XP,Rank Saat Ini\n";
    currentGradebookData.forEach(r => csv += `${r.No},"${r.Nama}",${r.Hadir},${r.XP},${r.Rank}\n`);
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    link.download = "Rekap_Nilai.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// ============================================================
// FIX CHAT GURU (teacher.js) - NAMA FUNGSI SPESIFIK
// ============================================================

function loadTeacherChatUI() {
    // Panggil fungsi logic KHUSUS GURU
    loadTeacherChatLogic();

    // Event listener tombol kirim
    const btn = document.getElementById('send-chat-btn-teacher');
    const input = document.getElementById('chat-input-teacher');
    
    if(btn) btn.onclick = sendChatMessageTeacher;
    if(input) {
        input.onkeypress = (e) => {
            if (e.key === 'Enter') sendChatMessageTeacher();
        };
    }
}

// GANTI NAMA FUNGSI DARI loadChat JADI loadTeacherChatLogic
function loadTeacherChatLogic() {
    const classSelect = document.getElementById('chat-class-select-teacher');
    const msgContainer = document.getElementById('chat-messages-teacher');
    const inputField = document.getElementById('chat-input-teacher');
    const sendBtn = document.getElementById('send-chat-btn-teacher');

    if (classSelect) {
        classSelect.onchange = function() {
            const cid = classSelect.value;
            
            // Logika Kunci/Buka Input
            if (!cid) {
                msgContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">⬅️ Pilih kelas dulu.</div>';
                if(inputField) { inputField.disabled = true; inputField.style.background = "#eee"; }
                if(sendBtn) sendBtn.disabled = true;
                return;
            }

            if(inputField) {
                inputField.disabled = false;
                inputField.placeholder = "Ketik pesan...";
                inputField.style.background = "#fff";
                inputField.focus();
            }
            if(sendBtn) sendBtn.disabled = false;

            // Load Pesan
            if(window.currentChatListener) { window.currentChatListener(); window.currentChatListener = null; }
            
            msgContainer.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

            window.currentChatListener = db.collection('chats')
                .where('classId', '==', cid)
                .orderBy('timestamp', 'asc')
                .limitToLast(50)
                .onSnapshot(s => {
                    if(s.empty) {
                        msgContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Belum ada pesan.</div>';
                        return;
                    }
                    
                    let h = '';
                    let lastSender = '';
                    s.forEach(d => {
                        const da = d.data();
                        const isMe = da.senderId === window.currentUser.uid;
                        const time = da.timestamp ? da.timestamp.toDate().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '...';
                        
                        h += `
                        <div class="chat-message ${isMe ? 'self' : 'other'}">
                            <div class="bubble">
                                ${!isMe && lastSender !== da.senderName ? `<span class="chat-sender-name">${da.senderName}</span>` : ''}
                                ${da.text}
                                <span class="chat-timestamp">${time}</span>
                            </div>
                        </div>`;
                        lastSender = da.senderName;
                    });
                    
                    msgContainer.innerHTML = h;
                    setTimeout(() => { msgContainer.scrollTop = msgContainer.scrollHeight; }, 100);
                });
        };
        
        // Pancing onchange jika nilai tersimpan
        if(classSelect.value) classSelect.onchange();
    }
}

async function sendChatMessageTeacher() {
    const txtInput = document.getElementById('chat-input-teacher');
    const classSelect = document.getElementById('chat-class-select-teacher');
    
    if(!txtInput || !classSelect) return;
    const text = txtInput.value.trim();
    const cid = classSelect.value;
    
    if(!text || !cid) return; 
    
    txtInput.value = ''; 
    
    try {
        await db.collection('chats').add({
            classId: cid,
            senderId: window.currentUser.uid,
            senderName: window.currentUser.displayName,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch(e) { console.error(e); alert("Gagal kirim."); }
}
// --- 8. GOOGLE PICKER (FIX TOKEN SCOPE) ---
function initPicker() {
    const c = document.getElementById('material-class-target').value;
    if(!c) return alert("Pilih kelas.");
    
    if(typeof google === 'undefined') return alert("Google API belum siap. Refresh halaman.");

    // Gunakan Variabel Global tokenClient yang sudah dideklarasikan di BAGIAN 1
    if (!tokenClient) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: (r) => {
                if(r.error) throw r;
                createPicker(r.access_token, c);
            }
        });
    }
    tokenClient.requestAccessToken({prompt: 'consent'});
}

async function createPicker(t, c) {
    await gapi.client.init({apiKey:GOOGLE_API_KEY});
    const v = new google.picker.View(google.picker.ViewId.DOCS);
    v.setMimeTypes("application/pdf,application/vnd.google-apps.presentation,application/vnd.google-apps.document");
    
    const p = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setAppId(APP_ID).setOAuthToken(t).addView(v).setDeveloperKey(GOOGLE_API_KEY)
        .setCallback((d)=>{
            if(d.action === google.picker.Action.PICKED) {
                const f = d.docs[0];
                db.collection('materials').add({name:f.name, url:f.url, iconUrl:f.iconUrl, classId:c, createdAt:firebase.firestore.FieldValue.serverTimestamp()});
                alert("Materi Berhasil Diupload!");
            }
        }).build();
    p.setVisible(true);
}

// --- 9. FUNGSI CRUD STANDAR ---
async function createClass() { const n=document.getElementById('class-name-input').value.trim(); if(!n)return; const c=generateClassCode(); await db.collection('classes').add({name:n,code:c,teacherId:window.currentUser.uid,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); alert(`Kelas ${n} dibuat: ${c}`); document.getElementById('class-name-input').value=''; }
// ============================================================
// FITUR TUGAS (ASSIGNMENT) - DENGAN DEADLINE & REKAP
// ============================================================
// 2. UPDATE FUNGSI createAssignment (Baca Pilihan Kelas yang Benar)
async function createAssignment() {
    // Ambil data dari Modal
    const title = document.getElementById('assignment-title').value;
    const desc = document.getElementById('assignment-desc').value;
    const driveLink = document.getElementById('assignment-drive-link').value;
    const deadlineInput = document.getElementById('assignment-deadline').value;
    const maxScore = parseInt(document.getElementById('assignment-max-score').value) || 100;
    
    // AMBIL ID KELAS DARI DROPDOWN BARU DI DALAM MODAL
    const classSelect = document.getElementById('assignment-class-select'); 
    const classId = classSelect ? classSelect.value : null;

    // Cek Validasi
    if (!classId) return alert("⚠️ Pilih KELAS TUJUAN dulu di bagian paling atas!");
    if (!title) return alert("⚠️ Judul Tugas wajib diisi!");
    if (!desc) return alert("⚠️ Deskripsi wajib diisi!");
    if (!deadlineInput) return alert("⚠️ Deadline wajib diatur!");

    try {
        const btn = document.querySelector('#create-assignment-modal .primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Menerbitkan...'; btn.disabled = true;

        await db.collection('assignments').add({
            classId: classId,
            teacherId: window.currentUser.uid,
            title: title,
            description: desc,
            driveLink: driveLink || '', 
            deadline: new Date(deadlineInput),
            maxScore: maxScore,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Tugas berhasil diterbitkan!");
        document.getElementById('create-assignment-modal').style.display = 'none';
        
        // Reset form
        document.getElementById('assignment-title').value = '';
        document.getElementById('assignment-desc').value = '';
        document.getElementById('assignment-drive-link').value = '';
        document.getElementById('assignment-deadline').value = '';
        
        btn.innerHTML = originalText; btn.disabled = false;

    } catch (e) {
        console.error(e);
        alert("Gagal: " + e.message);
        document.querySelector('#create-assignment-modal .primary').disabled = false;
    }
}
// 2. FUNGSI MENAMPILKAN LIST TUGAS (Update: Tampilkan Info Deadline)
function loadAssignments() {
    const classSelect = document.getElementById('assignment-class-select');
    const list = document.getElementById('teacher-assignment-list');
    
    // Logic Dropdown Kelas
    if (classSelect) {
        classSelect.onchange = () => loadAssignmentsByClass(classSelect.value, list);
        if(classSelect.value) loadAssignmentsByClass(classSelect.value, list);
    }
}

function loadAssignmentsByClass(cid, container) {
    if(!cid) return;
    
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    
    db.collection('assignments')
        .where('classId', '==', cid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            if(snapshot.empty) {
                container.innerHTML = '<div class="empty-state">Belum ada tugas di kelas ini.</div>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const deadlineDate = data.deadline.toDate();
                const now = new Date();
                const isExpired = now > deadlineDate;

                // Format Tanggal Cantik (Senin, 12 Jan 2025 - 23:59)
                const deadlineStr = deadlineDate.toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                });

                html += `
                <div class="card assignment-card" style="border-left: 5px solid ${isExpired ? '#e74c3c' : '#2ecc71'};">
                    <div style="flex-grow:1;">
                        <h4 style="margin-bottom:5px;">${data.title}</h4>
                        <div style="font-size:0.85em; color:#666; margin-bottom:10px;">
                            <i class="fa-regular fa-clock"></i> Deadline: <strong>${deadlineStr}</strong>
                            ${isExpired ? '<span class="badge-danger" style="margin-left:5px; font-size:0.8em; padding:2px 6px; background:#ffebee; color:#c62828; border-radius:4px;">Berakhir</span>' : ''}
                        </div>
                        <p style="font-size:0.9em; color:#444;">${data.description.substring(0, 80)}...</p>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:5px; min-width:100px;">
                        <button class="btn-small" onclick="openAssignmentRecap('${doc.id}', '${data.title}', '${deadlineStr}')" style="background:#3498db; color:white;">
                            <i class="fa-solid fa-eye"></i> Rekap
                        </button>
                        <button class="btn-small delete-btn" onclick="deleteAssignment('${doc.id}')">
                            <i class="fa-solid fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
}

// 3. FUNGSI HAPUS TUGAS
async function deleteAssignment(id) {
    if(confirm("Hapus tugas ini? Data pengumpulan siswa juga akan hilang.")) {
        await db.collection('assignments').doc(id).delete();
    }
}

// 4. FUNGSI BUKA MODAL REKAP (FITUR BARU UNTUK MAM YANTI)
function openAssignmentRecap(assignmentId, title, deadlineStr) {
    const modal = document.getElementById('assignment-recap-modal');
    const header = document.getElementById('recap-header-info');
    const tbody = document.getElementById('recap-list-body');
    
    // Set Info Header
    header.innerHTML = `
        <strong>Tugas:</strong> ${title}<br>
        <strong>Deadline:</strong> ${deadlineStr}
    `;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Memuat data...</td></tr>';
    modal.style.display = 'flex';

    // Ambil Sub-Collection 'submissions' dari tugas tersebut
    db.collection('assignments').doc(assignmentId).collection('submissions')
        .orderBy('submittedAt', 'asc') // Urutkan dari yang paling cepat kumpul
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Belum ada siswa yang mengumpulkan.</td></tr>';
                return;
            }

            let rows = '';
            snapshot.forEach(doc => {
                const sub = doc.data();
                const submitTime = sub.submittedAt.toDate();
                const submitTimeStr = submitTime.toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
                
                // Cek Status (Tepat Waktu / Telat / Mepet)
                // Logic ini nanti sinkron dengan kalkulasi di sisi siswa
                let statusBadge = '';
                if (sub.isLate) {
                    statusBadge = '<span style="color:red; font-weight:bold;">Terlambat</span>';
                } else if (sub.isEarlyBonus) {
                    statusBadge = '<span style="color:green; font-weight:bold;">Gercep! 🔥</span>';
                } else {
                    statusBadge = '<span style="color:blue;">Tepat Waktu</span>';
                }

                rows += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">
                        <div style="font-weight:bold;">${sub.studentName}</div>
                    </td>
                    <td style="padding:10px; font-size:0.9em;">${submitTimeStr}</td>
                    <td style="padding:10px; font-size:0.8em;">${statusBadge}</td>
                    <td style="padding:10px;">
                        <span style="background:#e3f2fd; color:#1565c0; padding:3px 8px; border-radius:10px; font-weight:bold;">${sub.score} XP</span>
                    </td>
                </tr>`;
            });
            tbody.innerHTML = rows;
        });
}
// ============================================================
// === PERBAIKAN FITUR PENGUMUMAN ===
// ============================================================

// 1. FUNGSI PUBLISH (TAMBAHKAN TEACHER ID)
async function publishAnnouncement() {
    const titleInp = document.getElementById('announcement-title');
    const contentInp = document.getElementById('announcement-content');
    const classInp = document.getElementById('announcement-class-target');
    
    const t = titleInp.value.trim();
    const c = contentInp.value.trim();
    const cl = classInp.value;

    if(!t || !c || !cl) return alert("⚠️ Mohon lengkapi Judul, Isi, dan Kelas!");

    const btn = document.getElementById('publish-announcement-btn');
    btn.innerHTML = "Menerbitkan..."; btn.disabled = true;

    try {
        await db.collection('announcements').add({
            teacherId: window.currentUser.uid, // <--- INI KUNCINYA (Dulu lupa ini)
            teacherName: window.currentUser.displayName,
            classId: cl,
            title: t,
            content: c,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Pengumuman Terbit!");
        
        // Reset Form
        titleInp.value = '';
        contentInp.value = '';
        btn.innerHTML = 'Publikasikan'; btn.disabled = false;

    } catch(e) {
        console.error(e);
        alert("Gagal terbit: " + e.message);
        btn.innerHTML = 'Publikasikan'; btn.disabled = false;
    }
}

// ============================================================
// === FITUR REKAP ABSENSI GURU (VERSI BARU & FINAL) ===
// ============================================================

window.viewAttendance = async function() { 
    const dateInput = document.getElementById('attendance-recap-date');
    const classInput = document.getElementById('attendance-recap-class');
    const listContainer = document.getElementById('attendance-recap-list'); 
    
    // 1. Validasi Input
    if(!dateInput.value || !classInput.value) {
        return alert("⚠️ Mohon pilih Tanggal dan Kelas terlebih dahulu!");
    }
    
    // 2. Tampilkan Loading
    listContainer.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>'; 
    
    // Ambil value tanggal (Contoh: "2026-01-08")
    const selectedDate = dateInput.value; 
    const selectedClass = classInput.value;

    try {
        // 3. Query Database Baru
        // Kita cari data di koleksi 'attendance' yang cocok TANGGAL dan KELAS-nya
        const snapshot = await db.collection('attendance')
            .where('dateSort', '==', selectedDate)
            .where('classId', '==', selectedClass)
            .orderBy('timestamp', 'asc') // Urutkan dari yang paling pagi
            .get();

        // 4. Jika Kosong
        if (snapshot.empty) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding:20px; background:#f8f9fa; border-radius:10px;">
                    <i class="fa-solid fa-folder-open" style="font-size:2em; color:#ccc;"></i>
                    <p style="color:#666; margin-top:10px;">Belum ada siswa yang absen pada tanggal ini.</p>
                </div>`;
            return;
        }

        // 5. Render Data ke Layar
        let html = ''; 
        let count = 0;

        snapshot.forEach(doc => { 
            const data = doc.data();
            count++;
            
            html += `
            <div class="list-item-teacher" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
                <div>
                    <span style="font-weight:bold; font-size:1.1em; color:#333;">
                        ${data.number}. ${data.studentName}
                    </span>
                    <br>
                    <small style="color:#666;">
                        <i class="fa-regular fa-clock"></i> Masuk: <strong>${data.time}</strong>
                    </small>
                </div>
                <span style="background:#d4edda; color:#155724; padding:4px 10px; border-radius:15px; font-size:0.8em; font-weight:bold;">
                    Hadir ✅
                </span>
            </div>`; 
        }); 
        
        // Tambahkan Header Jumlah Total
        listContainer.innerHTML = `
            <div style="margin-bottom:10px; padding:10px; background:#e3f2fd; border-radius:8px; color:#0d47a1; font-weight:bold;">
                <i class="fa-solid fa-users"></i> Total Hadir: ${count} Siswa
            </div>
            ${html}
        `;

    } catch (e) {
        console.error("Error Rekap:", e);
        
        // Handle Error Index (Paling sering terjadi di Firebase)
        if (e.message.includes('requires an index')) {
            listContainer.innerHTML = '<p style="color:red; text-align:center;">⚠️ Database perlu "Index Baru". Cek Console Browser (Tekan F12) lalu klik link error yang muncul.</p>';
        } else if (e.code === 'permission-denied') {
            listContainer.innerHTML = '<p style="color:red; text-align:center;">🔒 Izin Ditolak. Pastikan Rules Database sudah diatur "allow read, write: if request.auth != null;".</p>';
        } else {
            listContainer.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat data: ${e.message}</p>`;
        }
    }
};

function loadTeacherAnnouncements() { const l=document.getElementById('teacher-announcement-list'); db.collection('announcements').where('teacherId','==',window.currentUser.uid).orderBy('createdAt','desc').limit(5).onSnapshot(s=>{ let h=''; s.forEach(d=>{ h+=`<div class="list-item-teacher"><span>${d.data().title}</span><button class="delete-btn" onclick="db.collection('announcements').doc('${d.id}').delete()">Hapus</button></div>`; }); l.innerHTML=h; }); }
// GANTI FUNGSI loadTeacherMaterials DENGAN INI
function loadTeacherMaterials() { 
    const l = document.getElementById('teacher-material-list'); 
    const select = document.getElementById('material-class-target');
    
    if(!select) return;

    // Ambil ID kelas yang valid dari dropdown
    const classIds = Array.from(select.options)
        .map(o => o.value)
        .filter(v => v && v !== 'SEMUA KELAS'); // Filter value kosong

    // CEGAH ERROR: Jika tidak ada kelas, jangan panggil database!
    if (classIds.length === 0) {
        l.innerHTML = '<p style="text-align:center; color:#666;">Belum ada materi (Buat kelas dulu).</p>';
        return;
    }

    // Ambil max 10 kelas (batasan Firestore 'in' query)
    const safeClassIds = classIds.slice(0, 10);

    db.collection('materials')
        .where('classId', 'in', safeClassIds)
        .limit(10)
        .onSnapshot(s => { 
            let h = ''; 
            s.forEach(d => { 
                const da = d.data();
                // Tentukan ikon berdasarkan link
                let icon = '<i class="fa-solid fa-file"></i>';
                if(da.iconUrl) icon = `<img src="${da.iconUrl}" style="width:16px; margin-right:5px;">`;
                
                h += `<div class="list-item-teacher">
                        <span><a href="${da.url}" target="_blank" style="text-decoration:none; color:inherit;">${icon} ${da.name}</a></span>
                        <button class="delete-btn" onclick="if(confirm('Hapus materi?')) db.collection('materials').doc('${d.id}').delete()">Hapus</button>
                      </div>`; 
            }); 
            l.innerHTML = h || '<p style="text-align:center;">Belum ada materi.</p>'; 
        }); 
}
function loadAssignmentsForList() { 
    const l = document.getElementById('teacher-assignment-list'); 
    if(!l) return; 

    db.collection('assignments')
        .where('teacherId','==',window.currentUser.uid)
        .orderBy('deadline','desc')
        .onSnapshot(s => { 
            let h=''; 
            if(s.empty) {
                l.innerHTML = '<p style="text-align:center; color:#999;">Belum ada tugas dibuat.</p>';
                return;
            }

            s.forEach(d => { 
                const data = d.data();
                // Format deadline
                const deadlineStr = data.deadline ? data.deadline.toDate().toLocaleDateString() : '-';
                
                // Perhatikan onclick="viewSubmissions(...)" di bawah ini:
                h += `
                <div class="list-item-teacher" onclick="viewSubmissions('${d.id}', '${data.title}')" style="cursor:pointer; transition:0.2s;">
                    <div style="flex-grow:1;">
                        <span style="font-weight:bold; font-size:1em; display:block;">${data.title}</span>
                        <small style="color:#666;"><i class="fa-regular fa-clock"></i> Deadline: ${deadlineStr} &bull; ${data.maxScore} XP</small>
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); if(confirm('Hapus tugas?')) db.collection('assignments').doc('${d.id}').delete()">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>`; 
            }); 
            l.innerHTML = h; 
        }); 
}
function viewSubmissions(aid, at) { const l=document.getElementById('submission-list-container'); document.getElementById('teacher-view-submissions-div').style.display='block'; document.getElementById('submission-list-title').textContent=`Rekap: ${at}`; l.innerHTML='Loading...'; showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-task-page'); window.listeners.push(db.collection('assignments').doc(aid).collection('submissions').orderBy('timestamp','desc').onSnapshot(s=>{ if(s.empty){l.innerHTML='<p>Belum ada.</p>';return;} let h=''; s.forEach(d=>{ const da=d.data(); h+=`<div class="content-item"><strong>${da.studentName}</strong><p><a href="${da.link}" target="_blank">Link Tugas</a></p></div>`; }); l.innerHTML=h; })); }
function setupDeleteListeners() { document.getElementById('app-container').addEventListener('click', async e => { if(e.target.classList.contains('delete-btn') && confirm('Hapus?')) await db.collection(e.target.dataset.collection).doc(e.target.dataset.id).delete(); }); }
function startRealTimeClock() { if(window.clockInterval) clearInterval(window.clockInterval); function u() { const n = new Date(); const dEl = document.getElementById('live-day-date'); if(dEl) dEl.textContent = n.toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'}); const tEl = document.getElementById('live-time'); if(tEl) tEl.textContent = n.toLocaleTimeString('id-ID', {hour12: false}); } u(); window.clockInterval = setInterval(u, 1000); }


// GANTI FUNGSI startTeachingTimer YANG RUSAK DENGAN INI:
async function startTeachingTimer() { 
    // 1. AMBIL INPUT DARI HTML
    const classSelect = document.getElementById('timer-class-target');
    const timeInput = document.getElementById('session-end-time-input');
    const btn = document.getElementById('start-timer-btn');

    const classId = classSelect.value;
    const timeStr = timeInput.value.trim(); // Format "13:30"

    // 2. VALIDASI INPUT
    if(!classId) return alert("⚠️ Pilih kelas dulu, Mam!");
    if(!timeStr) return alert("⚠️ Masukkan jam selesai (Contoh: 10:30)!");

    // 3. PARSE WAKTU (Ubah jam teks jadi format Date)
    const now = new Date();
    // Support pemisah titik (.) atau titik dua (:)
    const [hrs, mins] = timeStr.replace('.', ':').split(':'); 
    
    const endTime = new Date();
    endTime.setHours(parseInt(hrs), parseInt(mins), 0, 0);

    // Validasi: Waktu tidak boleh masa lalu
    if(endTime < now) return alert("⚠️ Waktu sudah lewat! Masukkan waktu masa depan.");

    // 🔥 4. PANCING AUDIO (Agar browser mengizinkan autoplay nanti) 🔥
    const audio = document.getElementById('sfx-warning');
    if(audio) {
        audio.volume = 0; // Mute sebentar biar gak kaget
        audio.play().then(() => {
            audio.pause(); 
            audio.currentTime = 0; 
            audio.volume = 1; // Balikin volume
        }).catch(e => console.log("Audio unlock fail:", e));
    }

    // 5. SIMPAN KE DATABASE
    btn.disabled = true; 
    btn.textContent = "Memulai...";

    try {
        await db.collection('classes').doc(classId).update({
            sessionActive: true,
            sessionEndTime: firebase.firestore.Timestamp.fromDate(endTime),
            feedbackSessionActive: false // Reset sesi feedback
        });
        
        alert(`✅ Kelas Dimulai! Timer berjalan sampai ${timeStr}`);
        btn.disabled = false; 
        btn.textContent = "Mulai Countdown";
        
        // 6. JALANKAN TIMER DI LAYAR GURU
        runCountdownLogic(endTime, 'countdown-display', 'class-timer-panel');

    } catch(e) {
        console.error(e);
        alert("Gagal memulai timer: " + e.message);
        btn.disabled = false;
        btn.textContent = "Mulai Countdown";
    }
}
// Fungsi Helper untuk memutar suara di Guru
function playWarningSound(msg) {
    const audio = document.getElementById('sfx-warning');
    if(audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio error:", e));
    }
    // Gunakan Toast/Log kecil daripada Alert agar tidak memblokir layar guru terus menerus
    console.log(msg); 
    // Jika mau alert tetap muncul:
    // alert(msg);
}
function openEndSessionModal() { document.getElementById('teacher-end-session-modal').classList.add('active'); loadClassesForFeedbackDropdown(true); }
function closeEndSessionModal() { document.getElementById('teacher-end-session-modal').classList.remove('active'); }
async function confirmEndSession() { const classId = document.getElementById('end-session-class-select').value; if(!classId) return alert('Pilih kelas!'); await db.collection('classes').doc(classId).update({ sessionActive: false, sessionEndTime: null, feedbackSessionActive: true, feedbackTimestamp: firebase.firestore.FieldValue.serverTimestamp() }); alert('Sesi Diakhiri.'); document.getElementById('teacher-end-session-modal').classList.remove('active'); if(window.teachingInterval) clearInterval(window.teachingInterval); document.getElementById('class-timer-panel').style.display = 'none'; document.getElementById('start-teaching-card').style.display = 'block'; }
async function loadClassesForFeedbackDropdown(isModal=false) { const el = document.getElementById(isModal ? 'end-session-class-select' : 'feedback-class-select'); if(!el) return; const s = await db.collection('classes').where('teacherId','==',window.currentUser.uid).get(); let h='<option value="">-- Pilih Kelas --</option>'; s.forEach(d=>{ h+=`<option value="${d.id}">${d.data().name}</option>`; }); el.innerHTML=h; }
function loadFeedbackResults() { const classId = document.getElementById('feedback-class-select').value, dateStr = document.getElementById('feedback-date-select').value, container = document.getElementById('feedback-list-container'); if(!classId || !dateStr) return alert("Pilih Kelas & Tanggal."); container.innerHTML = '<div class="spinner"></div>'; if(window.currentFeedbackListener) { window.currentFeedbackListener(); window.currentFeedbackListener = null; } window.currentFeedbackListener = db.collection('feedbacks').where('classId', '==', classId).where('dateString', '==', dateStr).orderBy('timestamp', 'desc').onSnapshot(snapshot => { if(snapshot.empty) { container.innerHTML = `<p style="text-align:center;">Tidak ada feedback.</p>`; return; } let html = ''; snapshot.forEach(doc => { const data = doc.data(); html += `<div style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 15px; margin-bottom: 15px;"><strong>${data.studentName}</strong> (${data.rating} Bintang)<p>"${data.critic}"</p></div>`; }); container.innerHTML = html; }); }
// ============================================================
// === TEACHER.JS - BAGIAN 3: GAME V3 & KUIS LIVE ===
// ============================================================

// --- 9. MANAJEMEN KUIS (UPLOAD & LIVE SESSION) ---

function initQuizTeacher() {
    const btnUpload = document.getElementById('upload-quiz-txt-btn');
    if(btnUpload) btnUpload.onclick = uploadQuizFile;
    
    const btnStart = document.getElementById('start-quiz-session-btn');
    if(btnStart) btnStart.onclick = createLiveQuizSession;
    
    const btnFinish = document.getElementById('finish-quiz-session-btn');
    if(btnFinish) btnFinish.onclick = finishQuizSession;
    
    loadTeacherQuizzes(); 
}

// A. UPLOAD FILE SOAL (.TXT)
async function uploadQuizFile() {
    const fileInput = document.getElementById('quiz-file-upload');
    const titleInput = document.getElementById('quiz-title-input');
    const file = fileInput.files[0];

    if (!file || !titleInput.value) return alert("Isi Judul Kuis & Pilih File TXT dulu!");

    const reader = new FileReader();
    reader.onload = async function(e) {
        const text = e.target.result;
        const questions = parseQuizTXT(text); 

        if (questions.length === 0) return alert("Gagal membaca soal. Pastikan formatnya benar:\nQ: Soal\nA: Opsi A\nKEY: A");

        try {
            await db.collection('quizzes').add({
                title: titleInput.value,
                questions: questions,
                questionCount: questions.length,
                teacherId: window.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`✅ Kuis "${titleInput.value}" berhasil disimpan (${questions.length} soal).`);
            loadTeacherQuizzes(); 
            titleInput.value = '';
            fileInput.value = '';
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan ke database.");
        }
    };
    reader.readAsText(file);
}

// B. PARSER FORMAT SOAL
function parseQuizTXT(text) {
    const lines = text.split(/\r?\n/);
    const questions = [];
    let currentQ = null;

    lines.forEach(line => {
        const l = line.trim();
        if (!l) return; 

        if (l.startsWith('Q:')) {
            if (currentQ) questions.push(currentQ);
            currentQ = { text: l.substring(2).trim(), options: [], correctIndex: 0 };
        } 
        else if (l.match(/^[A-D][:.]/)) {
            if (currentQ) currentQ.options.push(l.substring(2).trim());
        } 
        else if (l.startsWith('KEY:') || l.startsWith('JAWABAN:')) {
            if (currentQ) {
                const prefix = l.includes('KEY:') ? 4 : 8;
                const keyChar = l.substring(prefix).trim().toUpperCase();
                const keyMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                currentQ.correctIndex = keyMap[keyChar] !== undefined ? keyMap[keyChar] : 0;
            }
        }
    });
    if (currentQ) questions.push(currentQ);
    return questions;
}

// C. LOAD DAFTAR KUIS
function loadTeacherQuizzes() {
    const listContainer = document.getElementById('quiz-list-container');
    const selectDropdown = document.getElementById('quiz-select-list');
    
    if(!listContainer) return;

    db.collection('quizzes')
        .where('teacherId','==',window.currentUser.uid)
        .orderBy('createdAt','desc')
        .onSnapshot(s => {
            let listHtml = '';
            let optionHtml = '<option value="">-- Pilih Bank Soal --</option>';
            
            if(s.empty) {
                listContainer.innerHTML = '<p style="text-align:center; color:#888;">Belum ada bank soal.</p>';
                if(selectDropdown) selectDropdown.innerHTML = optionHtml;
                return;
            }

            s.forEach(d => { 
                const da = d.data(); 
                listHtml += `
                    <div class="list-item-teacher">
                        <span><strong>${da.title}</strong> <small>(${da.questionCount} Soal)</small></span>
                        <button class="delete-btn" onclick="if(confirm('Hapus kuis ini?')) db.collection('quizzes').doc('${d.id}').delete()">Hapus</button>
                    </div>`;
                optionHtml += `<option value="${d.id}">${da.title}</option>`;
            }); 
            
            listContainer.innerHTML = listHtml;
            if(selectDropdown) selectDropdown.innerHTML = optionHtml;
        });
}

// D. MULAI SESI UJIAN LIVE
async function createLiveQuizSession() {
    const quizId = document.getElementById('quiz-select-list').value;
    const classId = document.getElementById('quiz-class-target').value;

    if (!quizId || !classId) return alert("Pilih Bank Soal & Kelas dulu!");

    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    const quizData = quizDoc.data();
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    const sessionRef = await db.collection('quizSessions').add({
        pin: pin,
        quizId: quizId,
        quizTitle: quizData.title,
        questions: quizData.questions,
        classId: classId,
        teacherId: window.currentUser.uid,
        status: 'lobby', 
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showQuizLobbyTeacher(sessionRef.id, pin, quizData.title);
}

// E. MONITORING LOBBY & GAME
function showQuizLobbyTeacher(sessionId, pin, title) {
    showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-quiz-lobby-page');
    document.getElementById('lobby-pin-display').textContent = pin;
    document.getElementById('lobby-quiz-title-teacher').textContent = title;
    
    if(window.currentLobbyListener) window.currentLobbyListener();
    
    window.currentLobbyListener = db.collection('quizSessions').doc(sessionId).collection('players').onSnapshot(snap => {
        document.getElementById('lobby-player-count-teacher').textContent = snap.size;
        let html = '';
        snap.forEach(d => {
            html += `<div class="lobby-player-item"><i class="fa-solid fa-user"></i> ${d.data().name}</div>`;
        });
        document.getElementById('lobby-player-list-teacher').innerHTML = html || '<p>Menunggu siswa...</p>';
    });

    document.getElementById('start-quiz-game-btn').onclick = async () => {
        if(confirm("Mulai ujian sekarang?")) {
            await db.collection('quizSessions').doc(sessionId).update({ status: 'in-progress' });
            monitorLiveQuiz(sessionId, title);
        }
    };
}

function monitorLiveQuiz(sessionId, title) {
    showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-quiz-game-page');
    document.getElementById('teacher-leaderboard-quiz-title').textContent = title;

    if(window.currentLiveQuizListener) window.currentLiveQuizListener();
    
    window.currentLiveQuizListener = db.collection('quizSessions').doc(sessionId).collection('players')
        .orderBy('score', 'desc')
        .onSnapshot(snap => {
            let html = '';
            let rank = 1;
            snap.forEach(d => {
                const p = d.data();
                const badge = p.status === 'finished' ? '<span class="badge-finished">Selesai</span>' : '<span class="badge-working">Mengerjakan</span>';
                html += `
                <div class="live-score-card">
                    <div class="score-left">
                        <div class="rank-circle ${rank===1?'gold':(rank===2?'silver':'bronze')}">${rank}</div>
                        <div><strong>${p.name}</strong><br>${badge}</div>
                    </div>
                    <div class="score-right"><strong>${p.score}</strong></div>
                </div>`;
                rank++;
            });
            document.getElementById('teacher-leaderboard-container').innerHTML = html;
        });
        
    window.currentQuizSessionId = sessionId;
}

async function finishQuizSession() {
    if(confirm("Akhiri sesi ujian? Siswa akan otomatis berhenti.")) {
        if(window.currentQuizSessionId) {
            await db.collection('quizSessions').doc(window.currentQuizSessionId).update({ status: 'finished' });
        }
        alert("Sesi Ujian Ditutup.");
        showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-quiz-page');
    }
}

// --- 10. GAME KELOMPOK V3 (CANGGIH) ---

function initGameTeacher() {
    const btnUpload = document.getElementById('game-file-upload-final'); if (btnUpload) btnUpload.onchange = handleFileUpload;
    const btnCreate = document.getElementById('btn-create-lobby-final'); if (btnCreate) btnCreate.onclick = createGameLobby;
    const btnShuffle = document.getElementById('btn-shuffle-teams'); if (btnShuffle) btnShuffle.onclick = shuffleTeamsFinal;
    const btnStart = document.getElementById('btn-start-game-final'); if (btnStart) btnStart.onclick = startGameFinal;
    const btnOpen = document.getElementById('btn-open-answer'); if (btnOpen) btnOpen.onclick = openAnswersFinal;
    const btnClose = document.getElementById('btn-close-answer'); if (btnClose) btnClose.onclick = closeAnswersFinal;
    const btnEnd = document.getElementById('btn-end-game'); if (btnEnd) btnEnd.onclick = () => { if (confirm("Akhiri sesi?")) { if (window.currentGameSessionId) { db.collection('gameSessions').doc(window.currentGameSessionId).update({ status: 'finished' }); } location.reload(); } };
    const btnRand = document.getElementById('allow-student-randomize-btn'); if(btnRand) btnRand.onclick = pickStudentToShuffle;
    
    // Tombol Verifikasi Manual (PENTING)
    const btnVerify = document.getElementById('btn-verify-manual');
    if(btnVerify) btnVerify.onclick = verifyAnswersManual;
    
    // Tombol Next Soal
    const btnNext = document.getElementById('btn-next-q');
    if(btnNext) btnNext.onclick = nextGameQuestion;
}

function handleFileUpload() {
    const file = this.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result, lines = text.split(/\r?\n/), questions = []; let currentQ = null;
        lines.forEach(line => {
            const l = line.trim();
            if(l.startsWith('Soal:')) { if(currentQ) questions.push(currentQ); currentQ = { questionText: l.substring(5).trim(), options: ['','','',''], correctAnswerIndex: 0 }; }
            else if(l.startsWith('A:')) currentQ.options[0] = l.substring(2).trim(); else if(l.startsWith('B:')) currentQ.options[1] = l.substring(2).trim();
            else if(l.startsWith('C:')) currentQ.options[2] = l.substring(2).trim(); else if(l.startsWith('D:')) currentQ.options[3] = l.substring(2).trim();
            else if(l.startsWith('Jawaban:')) { const ans = l.substring(8).trim().toUpperCase(); currentQ.correctAnswerIndex = ans === 'B' ? 1 : ans === 'C' ? 2 : ans === 'D' ? 3 : 0; }
        });
        if(currentQ) questions.push(currentQ);
        sessionStorage.setItem('gameQuestionsFinal', JSON.stringify(questions));
        document.getElementById('game-upload-status').style.display = 'block'; 
        document.getElementById('game-q-count').textContent = questions.length;
    }; reader.readAsText(file);
}

async function createGameLobby() {
    const classSelect = document.getElementById('game-class-select-final');
    if (!classSelect || !classSelect.value) return alert("Pilih kelas & Upload soal dulu!");
    const storedQ = sessionStorage.getItem('gameQuestionsFinal'); if(!storedQ) return alert("Upload soal dulu!");
    
    const ref = await db.collection('gameSessions').add({
        pin: Math.floor(100000 + Math.random() * 900000).toString(),
        classId: classSelect.value, 
        className: classSelect.options[classSelect.selectedIndex].text,
        teacherId: window.currentUser.uid, 
        status: 'lobby', 
        questions: JSON.parse(storedQ), 
        currentQuestionIndex: 0, 
        roundStatus: 'closed', 
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    window.currentGameSessionId = ref.id;
    document.getElementById('panel-game-setup').style.display = 'none'; 
    document.getElementById('panel-game-lobby').style.display = 'block';
    
    const d = await ref.get(); 
    document.getElementById('lbl-game-pin').textContent = d.data().pin; 
    document.getElementById('lbl-game-class-name').textContent = d.data().className;
    
    db.collection('gameSessions').doc(ref.id).collection('players').onSnapshot(snap => {
        document.getElementById('lbl-player-count').textContent = snap.size; 
        let html = '';
        snap.forEach(d => { 
            const p = d.data(); 
            html += `<div style="padding:5px;">${p.name} <span style="background:${p.groupColor};color:white;">${p.groupName||''}</span></div>`; 
        });
        document.getElementById('list-game-players').innerHTML = html;
    });
}

async function shuffleTeamsFinal() {
    const numGroups = parseInt(document.getElementById('sel-team-count').value);
    const snap = await db.collection('gameSessions').doc(window.currentGameSessionId).collection('players').get();
    const players = snap.docs.map(d => d.id).sort(() => Math.random() - 0.5);
    const names = ['MERAH', 'BIRU', 'HIJAU', 'ORANYE', 'UNGU', 'HITAM'], colors = ['red', 'blue', 'green', 'orange', 'purple', 'black'];
    const batch = db.batch();
    
    players.forEach((uid, idx) => { 
        batch.update(db.collection('gameSessions').doc(window.currentGameSessionId).collection('players').doc(uid), 
        { groupName: names[idx%numGroups], groupColor: colors[idx%numGroups], score: 0 }); 
    });
    
    await batch.commit(); 
    await db.collection('gameSessions').doc(window.currentGameSessionId).update({ teamsFormed: true });
}

async function pickStudentToShuffle() {
    if(!window.currentGameSessionId) return;
    const snap = await db.collection('gameSessions').doc(window.currentGameSessionId).collection('players').get();
    if(snap.empty) return alert("Belum ada siswa!");
    const p = snap.docs[Math.floor(Math.random()*snap.size)];
    await db.collection('gameSessions').doc(window.currentGameSessionId).update({ shufflerId: p.id, teamsFormed: false });
    alert(`Terpilih: ${p.data().name}`);
}

async function startGameFinal() {
    await db.collection('gameSessions').doc(window.currentGameSessionId).update({ status: 'playing', currentQuestionIndex: 0, roundStatus: 'closed' });
    document.getElementById('panel-game-lobby').style.display = 'none'; 
    document.getElementById('panel-game-running').style.display = 'block';
    renderTeacherGameQuestion(JSON.parse(sessionStorage.getItem('gameQuestionsFinal'))[0], 0);
    monitorLiveLeaderboard(window.currentGameSessionId);
}

function renderTeacherGameQuestion(q, idx) {
    document.getElementById('t-q-num').textContent = idx + 1; 
    document.getElementById('t-q-text').textContent = q.questionText;
    let h=''; 
    q.options.forEach((o,i)=>{ 
        h+=`<div style="${i===q.correctAnswerIndex?'color:green;font-weight:bold':''}">${['A','B','C','D'][i]}. ${o}</div>`; 
    });
    document.getElementById('t-q-options').innerHTML = h; 
    document.getElementById('btn-verify-manual').style.display = 'none';
}

async function nextGameQuestion() {
    const q = JSON.parse(sessionStorage.getItem('gameQuestionsFinal'));
    const ref = db.collection('gameSessions').doc(window.currentGameSessionId);
    let i = (await ref.get()).data().currentQuestionIndex + 1;
    
    if(i < q.length) { 
        await ref.update({ currentQuestionIndex: i, roundStatus: 'closed' }); 
        renderTeacherGameQuestion(q[i], i); 
        document.getElementById('lbl-game-timer').textContent="STOP"; 
        document.getElementById('btn-open-answer').disabled=false; 
        document.getElementById('btn-close-answer').disabled=true; 
    } else {
        alert("Soal habis!");
    }
}

async function openAnswersFinal() {
    document.getElementById('btn-open-answer').disabled=true; 
    document.getElementById('btn-close-answer').disabled=false;
    
    await db.collection('gameSessions').doc(window.currentGameSessionId).update({ roundStatus: 'open' });
    
    let t=10; 
    document.getElementById('lbl-game-timer').textContent=t;
    if(window.gameTimer) clearInterval(window.gameTimer);
    
    window.gameTimer = setInterval(()=>{ 
        t--; 
        document.getElementById('lbl-game-timer').textContent=t; 
        if(t<=0) closeAnswersFinal(); 
    }, 1000);
}

async function closeAnswersFinal() {
    clearInterval(window.gameTimer); 
    document.getElementById('lbl-game-timer').textContent="STOP";
    document.getElementById('btn-open-answer').disabled=false; 
    document.getElementById('btn-close-answer').disabled=true; 
    document.getElementById('btn-verify-manual').style.display='inline-block';
    
    await db.collection('gameSessions').doc(window.currentGameSessionId).update({ roundStatus: 'closed' });
}

async function verifyAnswersManual() {
    const btn = document.getElementById('btn-verify-manual'); 
    btn.disabled=true; btn.textContent="Menghitung...";
    
    const ref = db.collection('gameSessions').doc(window.currentGameSessionId);
    const snap = await ref.collection('players').get();
    const q = JSON.parse(sessionStorage.getItem('gameQuestionsFinal'));
    const idx = parseInt(document.getElementById('t-q-num').textContent)-1;
    const key = q[idx].correctAnswerIndex;
    
    const batch = db.batch();
    const teams = {};
    
    snap.forEach(d => { 
        const p=d.data(); 
        if(p.groupName) { 
            if(!teams[p.groupName]) teams[p.groupName]=[]; 
            teams[p.groupName].push({id:d.id, ans:p.currentAnswer}); 
        } 
    });
    
    let rep = "Hasil:\n";
    for(const [t, m] of Object.entries(teams)) {
        const compact = m.every(x => x.ans === m[0].ans && x.ans !== null && x.ans !== undefined);
        const correct = m[0].ans === key;
        
        if(compact && correct) { 
            rep+=`✅ ${t}: BENAR (+100)\n`; 
            m.forEach(x => batch.update(ref.collection('players').doc(x.id), { 
                score: firebase.firestore.FieldValue.increment(100), 
                lastAnswerStatus: 'correct', 
                triggerTime: firebase.firestore.FieldValue.serverTimestamp() 
            })); 
        } else { 
            rep+=`❌ ${t}: SALAH/TDK KOMPAK\n`; 
            m.forEach(x => batch.update(ref.collection('players').doc(x.id), { 
                lastAnswerStatus: 'wrong', 
                triggerTime: firebase.firestore.FieldValue.serverTimestamp() 
            })); 
        }
        // Reset jawaban
        m.forEach(x => batch.update(ref.collection('players').doc(x.id), { currentAnswer: null }));
    }
    
    await batch.commit(); 
    alert(rep); 
    btn.style.display='none'; 
    btn.disabled=false; 
    btn.innerHTML='<i class="fa-solid fa-check-double"></i> CEK JAWABAN';
}

function monitorLiveLeaderboard(sid) {
    db.collection('gameSessions').doc(sid).collection('players').onSnapshot(s => {
        let sc = {}; 
        s.forEach(d => { 
            const p=d.data(); 
            if(p.groupName) { 
                if(!sc[p.groupName]) sc[p.groupName]=0; 
                sc[p.groupName]+=p.score||0; 
            } 
        });
        
        let h=''; 
        Object.entries(sc).sort((a,b)=>b[1]-a[1]).forEach(([t,s])=>{ 
            h+=`<div style="display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid #eee;">
                <strong>${t}</strong><strong style="color:purple">${s} XP</strong>
            </div>`; 
        });
        document.getElementById('list-game-leaderboard').innerHTML=h;
    });
}
// --- INIT SPEAKING TEACHER (UPDATE HALAMAN BARU) ---
function initSpeakingFeatureTeacher() {
    // 1. Navigasi dari Menu Utama
    const btnNav = document.getElementById('go-to-speaking-admin-btn');
    if(btnNav) btnNav.onclick = () => showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-speaking-page');

    // 2. Tombol Simpan
    const btnCreate = document.getElementById('btn-create-speaking-task');
    if(btnCreate) btnCreate.onclick = createSpeakingTaskV2;

    // 3. Load Data
    loadTeacherSpeakingListV2();
}

// FUNGSI BUAT SOAL (VERSI 2 - HALAMAN BARU)
async function createSpeakingTaskV2() {
    const titleInp = document.getElementById('speaking-new-title');
    const textInp = document.getElementById('speaking-new-sentence');
    const xpInp = document.getElementById('speaking-new-xp');
    const classInp = document.getElementById('speaking-new-class');

    const title = titleInp.value.trim();
    const sentence = textInp.value.trim();
    const xp = parseInt(xpInp.value) || 100;
    const classId = classInp.value;

    if(!title || !sentence || !classId) {
        return alert("⚠️ Mohon lengkapi Judul, Kalimat, dan Kelas!");
    }

    // Validasi Kalimat (Harus ada huruf)
    if (!/[a-zA-Z]/.test(sentence)) {
        return alert("⚠️ Kalimat harus mengandung huruf Bahasa Inggris!");
    }

    const btn = document.getElementById('btn-create-speaking-task');
    btn.disabled = true; btn.innerHTML = "Menyimpan...";

    try {
        await db.collection('speakingTasks').add({
            teacherId: window.currentUser.uid,
            classId: classId,
            title: title,
            targetSentence: sentence, // Kalimat kunci untuk AI
            maxScore: xp,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Speaking Challenge Terbit!");
        
        // Reset Form
        titleInp.value = '';
        textInp.value = '';
        xpInp.value = '100';
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Terbitkan Tantangan';

    } catch(e) {
        console.error(e);
        alert("Gagal menyimpan: " + e.message);
        btn.disabled = false; btn.innerHTML = "Coba Lagi";
    }
}

// FUNGSI LOAD LIST (VERSI 2)
function loadTeacherSpeakingListV2() {
    const list = document.getElementById('teacher-speaking-list-container');
    if(!list) return;
    
    db.collection('speakingTasks')
        .where('teacherId', '==', window.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(s => {
            let html = '';
            if(s.empty) { 
                list.innerHTML = '<p style="text-align:center; color:#999;">Belum ada tantangan speaking.</p>'; 
                return; 
            }
            
            s.forEach(d => {
                const da = d.data();
                html += `
                <div class="list-item-teacher">
                    <div style="flex-grow:1;">
                        <strong style="font-size:1.1em;">${da.title}</strong>
                        <div style="background:#f0f8ff; padding:5px; border-radius:5px; margin-top:5px; border-left:3px solid #007bff; font-style:italic; font-size:0.9em; color:#555;">
                            "${da.targetSentence}"
                        </div>
                        <div style="margin-top:5px; font-size:0.85em; color:#666;">
                            <span style="background:#fff3e0; color:#e67e22; padding:2px 6px; border-radius:4px; font-weight:bold;">${da.maxScore} XP</span>
                            • Kelas ID: ${da.classId}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="if(confirm('Hapus tugas ini?')) db.collection('speakingTasks').doc('${d.id}').delete()">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>`;
            });
            list.innerHTML = html;
        });
}

// ==========================================
// === FITUR LISTENING (BRACKET PARSER) ===
// ==========================================

// 1. INISIALISASI (DIPANGGIL DI AWAL)
function initListeningTeacher() {
    // Navigasi Menu
    const btnNav = document.getElementById('go-to-listening-admin-btn');
    if(btnNav) btnNav.onclick = () => showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-listening-page');
    
    // Tombol Upload (ID harus sesuai index.html: btn-auto-upload-listen)
    const btnUpload = document.getElementById('btn-auto-upload-listen');
    if(btnUpload) {
        btnUpload.onclick = uploadListeningBracketMode; // Hubungkan ke fungsi
    } else {
        console.error("Tombol Upload Listening tidak ditemukan!");
    }
    
    // Load Daftar Soal
    loadListeningTasks();
}

// 2. FUNGSI UPLOAD & PARSING (YANG HILANG TADI)
async function uploadListeningBracketMode() {
    // Ambil Elemen berdasarkan ID di index.html
    const titleInput = document.getElementById('auto-listen-title');
    const linkInput = document.getElementById('auto-listen-link');
    const classInput = document.getElementById('auto-listen-class');
    const fileInput = document.getElementById('auto-listen-file');

    // Validasi Elemen Ada
    if (!titleInput || !classInput || !fileInput) {
        return alert("Error: Elemen input tidak ditemukan di HTML.");
    }

    // Validasi Isi
    if (!titleInput.value || !classInput.value || fileInput.files.length === 0) {
        return alert("⚠️ Mohon lengkapi Judul, Kelas, dan File .txt!");
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        const rawText = e.target.result;
        
        // --- LOGIKA PARSING (MEMISAHKAN SOAL & KUNCI) ---
        let answerKey = []; 
        
        // Regex: Cari kata di dalam kurung siku [...]
        // Ganti [went] menjadi ___ untuk soal yang akan tampil di siswa
        // Simpan "went" ke dalam array kunci jawaban
        const cleanText = rawText.replace(/\[(.*?)\]/g, function(match, p1) {
            answerKey.push(p1.trim()); 
            return "___"; 
        });

        if (answerKey.length === 0) {
            return alert("⚠️ Format salah! Tidak ditemukan tanda kurung [...].\nContoh yang benar: I [went] to school.");
        }

        // Tampilkan loading di tombol
        const btn = document.getElementById('btn-auto-upload-listen');
        const oldText = btn.innerHTML;
        btn.innerHTML = "Mengupload..."; btn.disabled = true;

        try {
            // Simpan ke Firebase
            await db.collection('listeningTasks').add({
                title: titleInput.value,
                link: linkInput.value || "", // Simpan Link Audio/Video (Opsional)
                story: cleanText,       // Teks soal (sensor)
                answerKeys: answerKey,  // Kunci jawaban
                classId: classInput.value,
                type: 'fill_blank',     
                teacherId: window.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`✅ Berhasil! Terdeteksi ${answerKey.length} kata kunci.`);
            
            // Reset Form
            titleInput.value = '';
            if(linkInput) linkInput.value = '';
            fileInput.value = '';
            
        } catch (err) {
            console.error(err);
            alert("Gagal upload: " + err.message);
        } finally {
            // Kembalikan tombol
            btn.innerHTML = oldText; btn.disabled = false;
        }
    };

    // Baca file sebagai teks
    reader.readAsText(file);
}

// 3. LOAD DAFTAR SOAL (AGAR LIST MUNCUL)
function loadListeningTasks() {
    const list = document.getElementById('teacher-listening-list');
    if(!list) return;
    
    db.collection('listeningTasks')
        .where('teacherId', '==', window.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(s => {
            let h = '';
            if(s.empty) { 
                list.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Belum ada soal listening.</p>'; 
                return; 
            }

            s.forEach(d => {
                const da = d.data();
                // Format tanggal singkat
                const dateStr = da.createdAt ? da.createdAt.toDate().toLocaleDateString() : '';
                
                h += `
                <div class="list-item-teacher">
                    <div style="flex-grow:1;">
                        <span style="font-weight:bold; font-size:1.1em;">${da.title}</span><br>
                        <small style="color:#666;">
                            <i class="fa-solid fa-key"></i> ${da.answerKeys.length} Soal • Kelas: ${da.classId} • ${dateStr}
                        </small>
                    </div>
                    <button class="delete-btn" onclick="if(confirm('Hapus soal ini?')) db.collection('listeningTasks').doc('${d.id}').delete()">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>`;
            });
            list.innerHTML = h;
        });
}

// ============================================================
// === TAMBAHAN FITUR REKAP TUGAS (VIEW SUBMISSIONS) ===
// ============================================================

let currentSubmissionListener = null; // Variabel global untuk listener rekap

// 1. Fungsi Membuka Halaman Rekap & Filter
window.viewSubmissions = function(assignmentId, assignmentTitle) {
    // Arahkan ke halaman tugas guru
    showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-task-page');
    
    // Munculkan DIV rekap yang tadi kita buat di HTML
    const rekapDiv = document.getElementById('teacher-view-submissions-div');
    if(rekapDiv) rekapDiv.style.display = 'block';

    // Scroll ke bawah biar langsung kelihatan
    rekapDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Update Judul & Siapkan Filter Kelas
    const titleEl = document.getElementById('submission-list-title');
    if(titleEl) {
        titleEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
                <span style="font-size:1.2em; color:#333;">📂 Rekap: <strong>${assignmentTitle}</strong></span>
                <label style="font-size:0.8em; color:#666;">Filter Kelas:</label>
                <select id="recap-filter-class" style="padding:8px; border:1px solid #4A90E2; border-radius:5px; background:#f0f7ff; font-weight:bold;">
                    <option value="ALL">-- Tampilkan Semua Kelas --</option>
                </select>
            </div>
        `;
    }

    // Isi Dropdown Filter (Ambil opsi dari dropdown "Buat Tugas" yang sudah ada datanya)
    const sourceSelect = document.getElementById('assignment-class-select'); 
    const filterSelect = document.getElementById('recap-filter-class');
    
    if(sourceSelect && filterSelect) {
        // Bersihkan dulu biar gak dobel
        filterSelect.innerHTML = '<option value="ALL">-- Tampilkan Semua Kelas --</option>';
        
        Array.from(sourceSelect.options).forEach(opt => {
            if(opt.value && opt.value !== "") { 
                const newOpt = document.createElement('option');
                newOpt.value = opt.value; 
                newOpt.textContent = opt.text; 
                filterSelect.appendChild(newOpt);
            }
        });
        
        // Kalau Guru milih kelas tertentu, panggil ulang datanya
        filterSelect.onchange = () => loadSubmissionData(assignmentId, filterSelect.value);
    }

    // Panggil Data Pertama Kali (Mode: Semua Kelas)
    loadSubmissionData(assignmentId, 'ALL');
};

// 2. Fungsi Mengambil Data dari Firebase & Render Tabel
window.loadSubmissionData = function(assignmentId, classFilter) {
    const container = document.getElementById('submission-list-container');
    if(!container) return;
    
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

    // Reset listener lama
    if (currentSubmissionListener) {
        currentSubmissionListener();
        currentSubmissionListener = null;
    }

    // Ambil data dari sub-collection 'submissions'
    currentSubmissionListener = db.collection('assignments').doc(assignmentId)
        .collection('submissions')
        .orderBy('submittedAt', 'desc')
        .onSnapshot(async (snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Belum ada siswa yang mengumpulkan tugas ini.</div>';
                return;
            }

            let submissions = [];
            snapshot.forEach(doc => submissions.push({ id: doc.id, ...doc.data() }));

            // --- LOGIKA FILTER KELAS (CLIENT SIDE) ---
            if (classFilter !== 'ALL') {
                const filteredSubs = [];
                // Cek kelas user satu-satu (Async)
                await Promise.all(submissions.map(async (sub) => {
                    const userDoc = await db.collection('users').doc(sub.studentId).get();
                    if (userDoc.exists && userDoc.data().classId === classFilter) {
                        filteredSubs.push(sub);
                    }
                }));
                submissions = filteredSubs;
            }

            // --- RENDER TABEL HTML ---
            if (submissions.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">Tidak ada data siswa di kelas ini.</div>';
                return;
            }

            let html = '<div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse; font-size:0.9em;">';
            html += `
                <tr style="background:#f8f9fa; border-bottom:2px solid #ddd; text-align:left;">
                    <th style="padding:10px;">Nama Siswa</th>
                    <th style="padding:10px;">Status</th>
                    <th style="padding:10px;">Nilai</th>
                    <th style="padding:10px;">Aksi</th>
                </tr>`;

            submissions.forEach(sub => {
                const dateStr = sub.submittedAt ? sub.submittedAt.toDate().toLocaleString('id-ID') : '-';
                
                // Badge Status
                let statusBadge = '<span style="color:green; font-weight:bold; background:#e8f5e9; padding:2px 6px; border-radius:4px;">On Time</span>';
                if (sub.status && sub.status.includes('Mepet')) statusBadge = '<span style="color:orange; font-weight:bold; background:#fff3e0; padding:2px 6px; border-radius:4px;">Mepet</span>';
                if (sub.status && sub.status.includes('Late')) statusBadge = '<span style="color:red; font-weight:bold; background:#ffebee; padding:2px 6px; border-radius:4px;">Telat</span>';

                html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">
                        <strong>${sub.studentName}</strong><br>
                        <small style="color:#666;">${dateStr}</small>
                    </td>
                    <td style="padding:10px;">${statusBadge}</td>
                    <td style="padding:10px; font-weight:bold; color:#4A90E2;">+${sub.score} XP</td>
                    <td style="padding:10px;">
                        <a href="${sub.link}" target="_blank" style="background:#4A90E2; color:white; padding:6px 12px; border-radius:20px; text-decoration:none; font-size:0.8em; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                            <i class="fa-brands fa-google-drive"></i> Buka
                        </a>
                    </td>
                </tr>`;
            });
            html += '</table></div>';
            
            container.innerHTML = html;
        });
};

// ==========================================
// === FITUR SPEAKING (TEACHER) - FINAL ===
// ==========================================

// 1. FUNGSI BUKA MODAL (PENTING: Reset Form Dulu)
window.openSpeakingModal = function() {
    // Reset isi input biar bersih
    document.getElementById('speaking-title').value = '';
    document.getElementById('speaking-sentence').value = '';
    document.getElementById('speaking-xp').value = '100';
    
    // Reset Dropdown Kelas (Penting!)
    // Pastikan ID 'speaking-class-target' sudah kamu masukkan ke loadTeacherData tadi ya!
    document.getElementById('speaking-class-target').value = ''; 

    // Munculkan Modal
    document.getElementById('create-speaking-modal').style.display = 'flex';
};

// 2. FUNGSI SIMPAN SOAL (Sesuai kode sebelumnya, tapi kita rapikan dikit)
window.createSpeakingTask = async function() {
    // Ambil data dari MODAL (Karena form di halaman utama sudah dihapus, pasti ambil yg ini)
    const title = document.getElementById('speaking-title').value;
    const sentence = document.getElementById('speaking-sentence').value;
    const classId = document.getElementById('speaking-class-target').value;
    const maxScore = parseInt(document.getElementById('speaking-xp').value) || 100;

    // Validasi
    if(!title || !sentence || !classId) {
        return alert("⚠️ Mohon lengkapi Judul, Kalimat Soal, dan pilih KELAS!");
    }

    try {
        const btn = document.querySelector('#create-speaking-modal .primary');
        btn.innerHTML = 'Menerbitkan...'; btn.disabled = true;

        await db.collection('speakingTasks').add({
            teacherId: window.currentUser.uid,
            classId: classId,
            title: title,
            targetSentence: sentence,
            maxScore: maxScore,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Speaking Challenge Terbit!");
        document.getElementById('create-speaking-modal').style.display = 'none';
        
        btn.innerHTML = 'Terbitkan'; btn.disabled = false;
        
    } catch(e) {
        console.error(e);
        alert("Gagal: " + e.message);
        document.querySelector('#create-speaking-modal .primary').disabled = false;
    }
};

// 3. FUNGSI MENAMPILKAN DAFTAR SOAL
// (Agar Guru bisa lihat soal yang sudah dibuat)
window.loadSpeakingTasks = function() {
    const list = document.getElementById('teacher-speaking-list');
    if(!list) return;

    db.collection('speakingTasks')
        .where('teacherId', '==', window.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            let html = '';
            if(snapshot.empty) {
                list.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Belum ada soal speaking.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                html += `
                <div class="list-item-teacher">
                    <div style="flex-grow:1;">
                        <span style="font-weight:bold; font-size:1em;">${data.title}</span><br>
                        <small style="color:#666; font-style:italic;">"${data.targetSentence}"</small>
                    </div>
                    <div style="text-align:right;">
                        <span style="background:#fff3e0; color:#f57c00; padding:2px 8px; border-radius:10px; font-size:0.8em; font-weight:bold;">${data.maxScore} XP</span>
                        <button class="delete-btn" onclick="if(confirm('Hapus soal ini?')) db.collection('speakingTasks').doc('${doc.id}').delete()" style="margin-top:5px;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>`;
            });
            list.innerHTML = html;
        });
};

// ============================================================
// === FITUR MANAJEMEN DATA SISWA (HAPUS / BERSIH-BERSIH) ===
// ============================================================

// 1. BUKA HALAMAN & LOAD KELAS
function initStudentManager() {
    const btnOpen = document.getElementById('btn-open-student-manager');
    const btnLoad = document.getElementById('btn-load-students-delete');
    
    // Listener Tombol Menu
    if(btnOpen) {
        btnOpen.onclick = () => {
            showSubPage(document.getElementById('teacher-dashboard-page'), 'teacher-student-manager-page');
            loadClassesForManager(); // Isi dropdown kelas
        };
    }

    // Listener Tombol Tampilkan
    if(btnLoad) {
        btnLoad.onclick = () => loadStudentsForDeletion();
    }
}

// Panggil fungsi ini di dalam initializeTeacherDashboard() agar aktif!
// initializeTeacherDashboard() biasanya ada di paling atas file teacher.js

// 2. ISI DROPDOWN KELAS
async function loadClassesForManager() {
    const select = document.getElementById('manager-class-select');
    select.innerHTML = '<option value="">Loading...</option>';
    
    try {
        const snap = await db.collection('classes').orderBy('name').get();
        let html = '<option value="">-- Pilih Kelas --</option>';
        snap.forEach(doc => {
            html += `<option value="${doc.id}">${doc.data().name}</option>`;
        });
        select.innerHTML = html;
    } catch(e) { console.error(e); }
}

// 3. LOAD DAFTAR SISWA (UNTUK DIHAPUS)
async function loadStudentsForDeletion() {
    const classId = document.getElementById('manager-class-select').value;
    const container = document.getElementById('manager-student-list-container');
    const listDiv = document.getElementById('manager-list-content');
    const countSpan = document.getElementById('manager-count');

    if(!classId) return alert("Pilih kelas dulu Mam!");

    listDiv.innerHTML = '<div class="spinner"></div>';
    container.style.display = 'block';

    try {
        // Ambil data siswa di kelas tersebut
        const snap = await db.collection('users')
            .where('role', '==', 'student')
            .where('classId', '==', classId)
            .orderBy('name')
            .get();

        countSpan.textContent = snap.size;

        if (snap.empty) {
            listDiv.innerHTML = '<p style="text-align:center; color:#999;">Kelas ini sudah kosong/bersih.</p>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const s = doc.data();
            html += `
            <div class="content-item" style="display:flex; justify-content:space-between; align-items:center; border-left:4px solid #e74c3c;">
                <div>
                    <strong>${s.name}</strong>
                    <div style="font-size:0.8em; color:#666;">${s.totalScore || 0} XP</div>
                </div>
                <button onclick="deleteOneStudent('${doc.id}', '${s.name}')" style="background:#ffebee; color:#c0392b; border:1px solid #e74c3c; padding:5px 10px; border-radius:5px; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
            </div>`;
        });
        listDiv.innerHTML = html;

    } catch(e) {
        console.error(e);
        listDiv.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`;
    }
}

// 4. HAPUS SATU SISWA
window.deleteOneStudent = async function(uid, name) {
    if(!confirm(`Yakin ingin menghapus data siswa: ${name}?\nData tidak bisa dikembalikan.`)) return;

    try {
        await db.collection('users').doc(uid).delete();
        alert(`Siswa ${name} berhasil dihapus.`);
        loadStudentsForDeletion(); // Refresh list
    } catch(e) {
        alert("Gagal hapus: " + e.message);
    }
};

// 5. HAPUS SATU KELAS SEKALIGUS (NUKE)
window.nukeClassData = async function() {
    const classId = document.getElementById('manager-class-select').value;
    const count = document.getElementById('manager-count').textContent;

    if(count == "0") return alert("Kelas sudah kosong.");

    // Konfirmasi Ganda agar tidak salah pencet
    const confirm1 = confirm(`⚠️ BAHAYA!\n\nAnda akan menghapus ${count} siswa di kelas ini.\nApakah Anda yakin?`);
    if(!confirm1) return;

    const code = prompt("Ketik 'SETUJU' untuk menghapus semua siswa di kelas ini secara permanen.");
    if(code !== 'SETUJU') return alert("Penghapusan dibatalkan.");

    const listDiv = document.getElementById('manager-list-content');
    listDiv.innerHTML = '<div class="spinner"></div><p style="text-align:center;">Sedang menghapus...</p>';

    try {
        const snap = await db.collection('users')
            .where('role', '==', 'student')
            .where('classId', '==', classId)
            .get();

        // Hapus pakai Batch (agar cepat & aman)
        const batch = db.batch();
        snap.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        alert("BERHASIL! Data kelas sekarang sudah plong/kosong. 🧹✨");
        loadStudentsForDeletion(); // Refresh (harus kosong)

    } catch(e) {
        console.error(e);
        alert("Terjadi kesalahan saat menghapus massal.");
        loadStudentsForDeletion();
    }
};

// JANGAN LUPA: Panggil initStudentManager() di dalam fungsi inisialisasi utama teacher.js!
initStudentManager();

// ============================================================
// === FITUR RAISE HAND (GURU) ===
// ============================================================

let currentHandListener = null;

// 1. LOAD KELAS KE DROPDOWN
async function loadClassesForHand() {
    const select = document.getElementById('hand-class-select');
    select.innerHTML = '<option value="">Loading...</option>';
    try {
        const snap = await db.collection('classes').orderBy('name').get();
        let html = '<option value="">-- Pilih Kelas --</option>';
        snap.forEach(doc => html += `<option value="${doc.id}">${doc.data().name}</option>`);
        select.innerHTML = html;
        
        // Pasang Event Listener Tombol
        document.getElementById('btn-start-hand').onclick = startHandSession;
        document.getElementById('btn-reset-hand').onclick = resetHandSession;
    } catch(e) { console.error(e); }
}

// 2. MULAI SESI (BUKA TOMBOL SISWA)
async function startHandSession() {
    const classId = document.getElementById('hand-class-select').value;
    if(!classId) return alert("Pilih kelas dulu!");

    const btnStart = document.getElementById('btn-start-hand');
    const btnReset = document.getElementById('btn-reset-hand');

    btnStart.disabled = true; btnStart.style.opacity = '0.5';
    btnReset.disabled = false; btnReset.style.opacity = '1';

    try {
        // Buat/Reset Dokumen Sesi di Database
        await db.collection('handSessions').doc(classId).set({
            status: 'OPEN',
            startedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Hapus data penekanan tombol sebelumnya (Sub-collection)
        // Note: Menghapus subcollection di client agak tricky, kita filter by time saja nanti
        // Atau guru harus klik RESET dulu sebelum mulai baru.
        
        monitorHandBuzzers(classId); // Mulai pantau siapa yang tekan

    } catch(e) { alert("Error: " + e.message); }
}

// 3. MONITOR SISWA YANG MENEKAN (REALTIME LIST)
function monitorHandBuzzers(classId) {
    const list = document.getElementById('hand-result-list');
    
    // Matikan listener lama
    if(currentHandListener) currentHandListener();

    // Dengarkan Sub-collection 'buzzers' urutkan berdasarkan waktu server
    currentHandListener = db.collection('handSessions').doc(classId).collection('buzzers')
        .orderBy('timestamp', 'asc') // Yang paling kecil (awal) muncul paling atas
        .onSnapshot(snapshot => {
            const countEl = document.getElementById('hand-count');
            countEl.textContent = snapshot.size + " Siswa";

            if(snapshot.empty) {
                list.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">Menunggu siswa menekan...</p>';
                return;
            }

            let html = '';
            let rank = 1;

            snapshot.forEach(doc => {
                const d = doc.data();
                
                // Animasi masuk untuk yang baru muncul
                html += `
                <div class="content-item" style="display:flex; justify-content:space-between; align-items:center; animation: popIn 0.3s ease; border-left: 5px solid ${rank===1 ? '#e74c3c' : '#ddd'};">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:35px; height:35px; background:${rank===1 ? '#e74c3c' : '#eee'}; color:${rank===1 ? 'white' : '#555'}; border-radius:50%; display:flex; justify-content:center; align-items:center; font-weight:bold;">${rank}</div>
                        <div>
                            <strong style="font-size:1.1em;">${d.studentName}</strong>
                            <div style="font-size:0.7em; color:#888;">${new Date(d.timestamp?.toDate()).toLocaleTimeString()}</div>
                        </div>
                    </div>
                    
                    <button onclick="giveHandPoint('${doc.id}', '${d.studentName}')" class="primary" style="padding:5px 15px; font-size:0.8em; background:#2ecc71;">
                        +10 XP
                    </button>
                </div>`;
                rank++;
            });

            list.innerHTML = html;
        });
}

// 4. STOP / RESET SESI
async function resetHandSession() {
    const classId = document.getElementById('hand-class-select').value;
    if(!classId) return;

    // Matikan UI Guru
    document.getElementById('btn-start-hand').disabled = false;
    document.getElementById('btn-start-hand').style.opacity = '1';
    document.getElementById('btn-reset-hand').disabled = true;
    document.getElementById('btn-reset-hand').style.opacity = '0.5';
    document.getElementById('hand-result-list').innerHTML = '<p style="text-align:center;">Sesi direset.</p>';

    // Matikan UI Siswa (Update Status)
    await db.collection('handSessions').doc(classId).update({
        status: 'CLOSED'
    });

    // Opsional: Hapus data buzzer (Sangat disarankan pakai Cloud Function, tapi ini cara manual client)
    // Kita biarkan saja tertumpuk, nanti pas START baru kita filter (atau logic sederhana: abaikan data lama)
    // Cara paling aman: Saat START, kita update 'startedAt', dan di query 'buzzers' kita hanya ambil yang timestamp > startedAt.
    // TAPI untuk simpelnya, kita hapus manual subcollection (agak berat di client) atau biarkan tertimpa visualnya.
}

// 5. BERI POIN (JIKA JAWABAN BENAR)
async function giveHandPoint(studentId, studentName) {
    if(!confirm(`Beri 10 Poin untuk ${studentName}?`)) return;

    try {
        await db.collection('users').doc(studentId).update({
            totalScore: firebase.firestore.FieldValue.increment(10)
        });
        alert(`Poin diberikan ke ${studentName}!`);
    } catch(e) { alert("Gagal beri poin."); }
}
// ============================================================
// === FITUR TIMER & PERSISTENCE (PASTIKAN DI PALING BAWAH) ===
// ============================================================

// 1. FUNGSI CEK SESI AKTIF (Agar Timer Muncul Lagi Pas Refresh)
function checkActiveSession() {
    db.collection('classes')
        .where('teacherId', '==', window.currentUser.uid)
        .where('sessionActive', '==', true)
        .limit(1) // Ambil 1 sesi aktif saja
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                
                // Cek apakah waktu masih ada?
                const endTime = data.sessionEndTime.toDate();
                const now = new Date();

                if (endTime > now) {
                    console.log("♻️ Mengembalikan sesi aktif...");
                    
                    // 1. Kembalikan Tampilan Dropdown & Input
                    const select = document.getElementById('timer-class-target');
                    if(select) {
                        // Kita perlu tunggu dropdown terisi dulu (karena async), baru set value
                        // Atau paksa set option kalau belum ada
                        if(select.options.length <= 1) {
                            const opt = document.createElement('option');
                            opt.value = doc.id;
                            opt.text = data.name; // Nama kelas
                            select.add(opt);
                        }
                        select.value = doc.id;
                    }

                    // 2. Kembalikan Jam di Input
                    const hours = endTime.getHours().toString().padStart(2, '0');
                    const mins = endTime.getMinutes().toString().padStart(2, '0');
                    const timeInput = document.getElementById('session-end-time-input');
                    if(timeInput) timeInput.value = `${hours}:${mins}`;

                    // 3. Matikan Tombol Start (Biar gak dipencet lagi)
                    const btn = document.getElementById('start-timer-btn');
                    if(btn) {
                        btn.disabled = true;
                        btn.textContent = "Sesi Sedang Berjalan...";
                        btn.style.background = "#bdc3c7"; // Abu-abu
                    }

                    // 4. JALANKAN TIMERNYA!
                    runCountdownLogic(endTime, 'countdown-display', 'class-timer-panel');
                } else {
                    // Kalau waktu sudah habis tapi status masih true, biarkan saja atau otomatis close
                    console.log("Sesi aktif ditemukan tapi waktu sudah habis.");
                }
            }
        })
        .catch(err => console.error("Gagal cek sesi:", err));
}
// ============================================================
// === BAGIAN AKHIR: LOGIKA TIMER & PERSISTENCE (JANGAN DIHAPUS) ===
// ============================================================

// GLOBAL VARIABLES (Dua Kunci Pengaman)
window.warn20Played = false; 
window.warn10Played = false;

// 1. LOGIKA TIMER UTAMA (YANG TADI ERROR "NOT DEFINED")
function runCountdownLogic(endTime, displayId, panelId) { 
    // Bersihkan interval lama jika ada
    if(window.teachingInterval) clearInterval(window.teachingInterval); 
    
    const display = document.getElementById(displayId);
    const panel = document.getElementById(panelId);
    
    // Tampilkan Panel
    if(panel) {
        panel.style.display = 'block';
        panel.style.background = "#fff3cd"; 
        panel.style.border = "1px solid #ffeeba";
    }
    if(display) display.style.color = "#856404";

    // Reset status bunyi
    window.warn20Played = false;
    window.warn10Played = false;

    // Mulai Interval Detik
    window.teachingInterval = setInterval(() => { 
        const now = new Date();
        const diff = endTime - now; 

        // === SKENARIO 1: SISA 20 MENIT (1.200.000 ms) ===
        if (diff <= 1200000 && diff > 600000 && !window.warn20Played) {
            playWarningSound("⚠️ PERINGATAN: Waktu tinggal 20 Menit!");
            if(display) display.style.color = "#d35400"; // Oranye
            window.warn20Played = true; 
        }

        // === SKENARIO 2: SISA 5 MENIT (300.000 ms) ===
        // Kita ubah jadi 5 menit sesuai request terakhir
        if (diff <= 300000 && diff > 0 && !window.warn10Played) {
            playWarningSound("⚠️ DARURAT: Waktu tinggal 5 Menit! Segera akhiri.");
            
            // Ubah Tampilan jadi Merah Tegang
            if(panel) {
                panel.style.background = "#f8d7da"; 
                panel.style.border = "2px solid #dc3545";
                panel.classList.add('pulse-animation');
            }
            if(display) display.style.color = "#dc3545"; // Merah
            
            window.warn10Played = true; 
        }

        if(diff <= 0) { 
            clearInterval(window.teachingInterval); 
            if(display) display.textContent = "WAKTU HABIS"; 
            if(panel) panel.style.background = "#e74c3c";
        } else { 
            const hh = Math.floor((diff/(1000*60*60))%24);
            const mm = Math.floor((diff/(1000*60))%60);
            const ss = Math.floor((diff/1000)%60); 
            if(display) display.textContent = `${hh<10?'0'+hh:hh}:${mm<10?'0'+mm:mm}:${ss<10?'0'+ss:ss}`; 
        } 
    }, 1000); 
}

// 2. FUNGSI CEK SESI AKTIF (Agar Timer Muncul Lagi Pas Refresh)
function checkActiveSession() {
    db.collection('classes')
        .where('teacherId', '==', window.currentUser.uid)
        .where('sessionActive', '==', true)
        .limit(1)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                const endTime = data.sessionEndTime.toDate();
                const now = new Date();

                if (endTime > now) {
                    console.log("♻️ Mengembalikan sesi aktif...");
                    
                    // Kembalikan Tampilan Dropdown
                    const select = document.getElementById('timer-class-target');
                    if(select) {
                        if(select.options.length <= 1) {
                            const opt = document.createElement('option');
                            opt.value = doc.id;
                            opt.text = data.name;
                            select.add(opt);
                        }
                        select.value = doc.id;
                    }

                    // Matikan Tombol Start
                    const btn = document.getElementById('start-timer-btn');
                    if(btn) {
                        btn.disabled = true;
                        btn.textContent = "Sesi Sedang Berjalan...";
                    }

                    // JALANKAN TIMER
                    runCountdownLogic(endTime, 'countdown-display', 'class-timer-panel');
                }
            }
        });
}

// 3. FUNGSI HELPER AUDIO
function playWarningSound(msg) {
    const audio = document.getElementById('sfx-warning');
    if(audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio error:", e));
    }
    console.log(msg);
}
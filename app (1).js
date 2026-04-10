const SUPABASE_URL = 'https://fxqrftjwouzlqeyxkawd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ificAA7lRt8jvUXioywAQg_wTU5YSlG';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let photoDataURL = null;

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) { currentUser = session.user; await enterDash(); }
  startClock();
});

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!email || !pass) { errEl.textContent = 'Completa todos los campos.'; return; }
  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { errEl.textContent = 'Correo o contraseña incorrectos.'; return; }
  currentUser = data.user;
  await enterDash();
}

async function handleRegister() {
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');
  errEl.textContent = '';
  if (!email || !pass) { errEl.textContent = 'Completa todos los campos.'; return; }
  if (pass.length < 6) { errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
  const { data, error } = await db.auth.signUp({ email, password: pass });
  if (error) { errEl.textContent = 'No se pudo crear la cuenta: ' + error.message; return; }
  currentUser = data.user;
  await enterDash();
}

async function handleLogout() {
  await db.auth.signOut();
  currentUser = null; photoDataURL = null;
  closeEdit(); toggleMenu(true);
  showScreen('authScreen');
}

async function enterDash() {
  // openEdit / closeEdit panel
}function openEdit() {
  document.getElementById("editPanel").classList.add("open");
  document.getElementById("editOverlay").classList.add("open");
}
function closeEdit() {
  document.getElementById("editPanel").classList.remove("open");
  document.getElementById("editOverlay").classList.remove("open");
}
async function _enterDash() {
  await loadProfile();
  showScreen('dashScreen');
}

async function loadProfile() {
  const { data } = await db.from('carnets').select('*').eq('user_id', currentUser.id).single();
  if (data) {
    document.getElementById('fNombres').value = data.nombres || '';
    document.getElementById('fApellidos').value = data.apellidos || '';
    document.getElementById('fCarrera').value = data.carrera || '';
    document.getElementById('fCodigo').value = data.codigo || '';
    if (data.foto_url) { photoDataURL = data.foto_url; setPhotoPreview(data.foto_url); }
    syncCard();
  }
}

async function saveProfile() {
  const payload = {
    user_id: currentUser.id,
    nombres: document.getElementById('fNombres').value.toUpperCase(),
    apellidos: document.getElementById('fApellidos').value.toUpperCase(),
    carrera: document.getElementById('fCarrera').value.toUpperCase(),
    codigo: document.getElementById('fCodigo').value,
    foto_url: photoDataURL || null,
    updated_at: new Date().toISOString()
  };
  const { error } = await db.from('carnets').upsert(payload, { onConflict: 'user_id' });
  const statusEl = document.getElementById('saveStatus');
  if (error) { statusEl.style.color = '#c0392b'; statusEl.textContent = 'Error al guardar.'; }
  else {
    statusEl.style.color = '#27ae60'; statusEl.textContent = '✓ Guardado';
    setTimeout(() => { statusEl.textContent = ''; closeEdit(); }, 1200);
  }
}

function handlePhoto(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    photoDataURL = ev.target.result;
    setPhotoPreview(photoDataURL);
    document.getElementById('cardPhoto').src = photoDataURL;
  };
  reader.readAsDataURL(file);
}

function setPhotoPreview(src) {
  const thumb = document.getElementById('photoThumb');
  thumb.src = src; thumb.style.display = 'block';
  document.getElementById('photoHint').style.display = 'none';
  document.getElementById('cardPhoto').src = src;
}

function syncCard() {
  const n = document.getElementById('fNombres').value.toUpperCase() || 'NOMBRES';
  const a = document.getElementById('fApellidos').value.toUpperCase() || 'APELLIDOS';
  const c = document.getElementById('fCarrera').value.toUpperCase() || 'CARRERA';
  const cod = document.getElementById('fCodigo').value || '00000000';
  document.getElementById('cNombres').textContent = n;
  document.getElementById('cApellidos').textContent = a;
  document.getElementById('cCarrera').textContent = c;
  document.getElementById('cCodigo').textContent = cod;
  drawBarcode(cod);
}

function drawBarcode(code) {
  const svg = document.getElementById('barcodeEl');
  const chars = String(code).split('');
  const pattern = [];
  for (let i = 0; i < 60; i++) {
    const seed = (i * 7 + (chars[i % chars.length]?.charCodeAt(0) || 50)) % 3;
    pattern.push(seed === 0 ? 1 : seed === 1 ? 2 : 3);
  }
  const total = pattern.reduce((a, b) => a + b, 0);
  const scale = 196 / total;
  let bars = ''; let x = 2;
  pattern.forEach((p, j) => {
    const w = Math.max(1, Math.round(p * scale));
    if (j % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="44" fill="#c0392b"/>`;
    x += w;
  });
  svg.innerHTML = bars;
}

function startClock() {
  function tick() {
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const ampm = h >= 12 ? 'p. m.' : 'a. m.';
    h = h % 12 || 12;
    const pad = n => String(n).padStart(2, '0');
    const t = `${pad(h)}:${pad(m)}:${pad(s)} ${ampm}`;
    const c = document.getElementById('cardClock');
    const st = document.getElementById('statusTime');
    if (c) c.textContent = t;
    if (st) st.textContent = `${pad(h)}:${pad(m)}`;
  }
  tick(); setInterval(tick, 1000);
}

function toggleMenu(forceClose) {
  const m = document.getElementById('dropMenu');
  if (forceClose) { m.classList.remove('open'); return; }
  m.classList.toggle('open');
}

function openEdit() {
  document.getElementById('editModal').classList.add('open');
  document.getElementById('dropMenu').classList.remove('open');
}

function closeEdit() {
  document.getElementById('editModal').classList.remove('open');
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('editModal')) closeEdit();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

drawBarcode('00000000');

// Update statusbar time
function updateStatusTime() {
  var el = document.getElementById('appTime');
  if (!el) return;
  var now = new Date();
  var h = now.getHours() % 12 || 12;
  var m = String(now.getMinutes()).padStart(2,'0');
  el.textContent = h + ':' + m;
}
setInterval(updateStatusTime, 1000);
updateStatusTime();

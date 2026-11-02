/* ==========================================================
   Pustaka Terbuka — script.js
   Satu file JS bersama; tiap halaman punya fungsi init sendiri
   yang dipilih lewat atribut <body data-page="...">.
   Data dummy ada di js/data.js (dimuat sebelum file ini).
   ========================================================== */
"use strict";

/* ---------- Utilitas dasar ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const KEY = { session: "pt_session", users: "pt_users", stok: "pt_stok", cart: "pt_cart", orders: "pt_orders" };

const store = {
  get(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage penuh/diblokir */ } },
  del(key) { try { localStorage.removeItem(key); } catch { /* abaikan */ } },
};

const ICONS = {
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12H19l2-8H6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.5 7.5C3.8 9.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4-.9"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
const ico = (name) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const toNum = (rp) => parseInt(String(rp).replace(/\D/g, ""), 10) || 0;
const rupiah = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const pad = (n) => String(n).padStart(2, "0");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const fmtTanggal = (iso) => {
  const d = new Date(String(iso).replace(" ", "T"));
  return isNaN(d) ? iso : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};
const fmtWaktu = (s) => {
  const d = new Date(String(s).replace(" ", "T"));
  return isNaN(d) ? s : d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":").replace(",", " ·");
};

/* ---------- Pengguna & sesi ---------- */
const semuaPengguna = () => [...dataPengguna, ...store.get(KEY.users, [])];
const sesi = () => store.get(KEY.session, null);

/* ---------- Katalog (data.js + tambahan dari localStorage) ---------- */
function muatKatalog() {
  const extra = store.get(KEY.stok, []);
  extra.forEach((b) => { if (!dataKatalogBuku.some((x) => x.kodeBarang === b.kodeBarang)) dataKatalogBuku.push(b); });
}
const cariBuku = (kode) => dataKatalogBuku.find((b) => b.kodeBarang === kode);

/* ---------- Pesanan (data tracking + pesanan baru) ---------- */
const LANGKAH = ["Diproses", "Dikirim", "Dalam Perjalanan", "Selesai"];
function indeksLangkah(o) {
  const last = (o.perjalanan || []).slice(-1)[0];
  if (last && /^selesai/i.test(last.keterangan)) return 3;
  const i = LANGKAH.indexOf(o.status);
  return i < 0 ? 0 : i;
}
const statusEfektif = (o) => LANGKAH[indeksLangkah(o)];
const pesananLokal = () => store.get(KEY.orders, []);
function semuaPesanan() {
  const seed = Object.values(dataTracking).map((o) => ({ ...o, metode: "Transfer Bank", sumber: "data" }));
  return [...pesananLokal().map((o) => ({ ...o, sumber: "lokal" })), ...seed];
}
const cariPesanan = (no) => semuaPesanan().find((o) => o.nomorDO === no);

/* ---------- Keranjang ---------- */
const keranjang = () => store.get(KEY.cart, []);
const simpanKeranjang = (c) => { store.set(KEY.cart, c); perbaruiBadgeKeranjang(); };
function tambahKeKeranjang(kode, qty = 1) {
  const c = keranjang();
  const item = c.find((i) => i.kode === kode);
  const buku = cariBuku(kode);
  if (!buku) return false;
  const baru = (item ? item.qty : 0) + qty;
  if (baru > buku.stok) { toast("Jumlah melebihi stok tersedia (" + buku.stok + ")", "error"); return false; }
  if (item) item.qty = baru; else c.push({ kode, qty });
  simpanKeranjang(c);
  return true;
}
function perbaruiBadgeKeranjang() {
  const n = keranjang().reduce((a, i) => a + i.qty, 0);
  $$("[data-cart-count]").forEach((el) => { el.textContent = n; el.hidden = n === 0; });
}

/* ---------- UI: toast, dialog ---------- */
function toast(pesan, tipe = "", html = false) {
  let wrap = $(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; wrap.setAttribute("role", "status"); wrap.setAttribute("aria-live", "polite"); document.body.append(wrap); }
  const t = document.createElement("div");
  t.className = "toast " + tipe;
  if (html) t.innerHTML = pesan; else t.textContent = pesan;
  wrap.append(t);
  setTimeout(() => t.remove(), 3800);
}

function bukaDialog(dlg) {
  if (!dlg.open) dlg.showModal();
}
function tutupDialog(dlg) { if (dlg.open) dlg.close(); }
function pasangDialog() {
  $$("dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
  });
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => {
    const d = document.getElementById(b.dataset.open);
    if (d) { $$(".field", d).forEach((f) => f.classList.remove("invalid")); bukaDialog(d); const first = $("input,select", d); if (first) setTimeout(() => first.focus(), 30); }
  }));
}

/* Alert modal generik (pengganti alert() bawaan browser) */
function tampilAlert({ judul, pesan, tipe = "info", tombol = "Mengerti", aksi = null, batal = null }) {
  let dlg = $("#dlg-alert");
  if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "dlg-alert"; dlg.setAttribute("aria-labelledby", "alert-judul"); document.body.append(dlg); dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); }
  const simbol = { error: ico("alert"), success: ico("check"), info: ico("alert") }[tipe];
  dlg.innerHTML = `<div class="dlg-body">
    <div class="dlg-icon ${tipe}">${simbol}</div>
    <h2 id="alert-judul">${esc(judul)}</h2>
    <p class="muted">${esc(pesan)}</p>
    <div class="dlg-actions">
      ${batal ? `<button type="button" class="btn btn-ghost" data-act="batal">${esc(batal)}</button>` : ""}
      <button type="button" class="btn ${tipe === "error" && batal ? "btn-danger" : "btn-primary"}" data-act="ok" autofocus>${esc(tombol)}</button>
    </div></div>`;
  $('[data-act="ok"]', dlg).onclick = () => { dlg.close(); if (aksi) aksi(); };
  const b = $('[data-act="batal"]', dlg); if (b) b.onclick = () => dlg.close();
  bukaDialog(dlg);
}

/* ---------- Validasi form ---------- */
function setError(input, pesan) {
  const f = input.closest(".field");
  if (!f) return !pesan;
  f.classList.toggle("invalid", !!pesan);
  const e = $(".err", f);
  if (e) e.textContent = pesan || "";
  input.setAttribute("aria-invalid", pesan ? "true" : "false");
  return !pesan;
}
/* aturan: array fungsi (value) => pesan error | "" */
function validasi(input, aturan) {
  const v = input.value.trim();
  for (const r of aturan) { const msg = r(v); if (msg) return setError(input, msg); }
  return setError(input, "");
}
const wajib = (label) => (v) => (v ? "" : `${label} wajib diisi.`);
const minLen = (n, label) => (v) => (v.length >= n ? "" : `${label} minimal ${n} karakter.`);
const emailOk = (v) => (isEmail(v) ? "" : "Format email tidak valid (contoh: nama@email.com).");
const polaOk = (re, msg) => (v) => (re.test(v) ? "" : msg);
function liveValidate(form, peta) {
  Object.entries(peta).forEach(([id, aturan]) => {
    const el = $("#" + id, form);
    if (!el) return;
    el.addEventListener("blur", () => validasi(el, aturan));
    el.addEventListener("input", () => { if (el.closest(".field").classList.contains("invalid")) validasi(el, aturan); });
  });
  return () => {
    let ok = true, first = null;
    Object.entries(peta).forEach(([id, aturan]) => {
      const el = $("#" + id, form);
      if (el && !validasi(el, aturan)) { ok = false; first = first || el; }
    });
    if (first) first.focus();
    return ok;
  };
}

function pasangTogglePassword() {
  $$(".pw-toggle").forEach((btn) => btn.addEventListener("click", () => {
    const input = $("#" + btn.dataset.target);
    const tampil = input.type === "password";
    input.type = tampil ? "text" : "password";
    btn.innerHTML = ico(tampil ? "eyeoff" : "eye");
    btn.setAttribute("aria-label", tampil ? "Sembunyikan password" : "Tampilkan password");
  }));
}

/* ---------- Header umum (halaman setelah login) ---------- */
function initHeader() {
  const s = sesi();
  const page = document.body.dataset.page;
  $$(".site-nav a").forEach((a) => { if (a.dataset.nav === page) a.setAttribute("aria-current", "page"); });
  const un = $("#user-nama"); if (un && s) un.textContent = s.nama;
  const av = $("#user-avatar"); if (av && s) av.textContent = s.nama.charAt(0).toUpperCase();
  const out = $("#btn-logout");
  if (out) out.addEventListener("click", () => tampilAlert({ judul: "Keluar dari akun?", pesan: "Sesi Anda akan diakhiri dan Anda kembali ke halaman login.", tipe: "info", tombol: "Ya, keluar", batal: "Batal", aksi: () => { store.del(KEY.session); location.href = "index.html"; } }));
  const tg = $(".nav-toggle"), nav = $(".site-nav");
  if (tg && nav) tg.addEventListener("click", () => { const o = nav.classList.toggle("open"); tg.setAttribute("aria-expanded", o); });
  perbaruiBadgeKeranjang();
}

/* ==========================================================
   HALAMAN: LOGIN (index.html)
   ========================================================== */
function initLogin() {
  if (sesi()) { location.replace("dashboard.html"); return; }
  const form = $("#form-login");
  const cek = liveValidate(form, {
    email: [wajib("Email"), emailOk],
    password: [wajib("Password"), minLen(4, "Password")],
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cek()) return;
    const email = $("#email").value.trim().toLowerCase();
    const pw = $("#password").value;
    const user = semuaPengguna().find((u) => u.email.toLowerCase() === email && u.password === pw);
    if (!user) {
      tampilAlert({ judul: "Login gagal", pesan: "Email/password yang anda masukkan salah", tipe: "error", tombol: "Coba lagi" });
      $("#password").value = ""; $("#password").focus();
      return;
    }
    store.set(KEY.session, { id: user.id, nama: user.nama, email: user.email, role: user.role });
    $("#btn-masuk").disabled = true; $("#btn-masuk").textContent = "Masuk…";
    location.href = "dashboard.html";
  });

  // akun demo (mengisi otomatis)
  $$("[data-demo]").forEach((b) => b.addEventListener("click", () => {
    const [em, pw] = b.dataset.demo.split("|");
    $("#email").value = em; $("#password").value = pw;
    $$(".field", form).forEach((f) => f.classList.remove("invalid"));
  }));

  // Lupa password (modal)
  const fLupa = $("#form-lupa");
  const cekLupa = liveValidate(fLupa, { "lupa-email": [wajib("Email"), emailOk] });
  fLupa.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cekLupa()) return;
    const em = $("#lupa-email").value.trim().toLowerCase();
    const u = semuaPengguna().find((x) => x.email.toLowerCase() === em);
    if (!u) { setError($("#lupa-email"), "Email tidak terdaftar di sistem kami."); return; }
    tutupDialog($("#dlg-lupa"));
    fLupa.reset();
    tampilAlert({ judul: "Tautan terkirim", pesan: `Instruksi reset password telah dikirim ke ${em} (simulasi). Periksa kotak masuk Anda.`, tipe: "success" });
  });

  // Daftar (modal)
  const fDaftar = $("#form-daftar");
  const cekDaftar = liveValidate(fDaftar, {
    "reg-nama": [wajib("Nama lengkap"), minLen(3, "Nama")],
    "reg-email": [wajib("Email"), emailOk],
    "reg-password": [wajib("Password"), minLen(6, "Password"), polaOk(/\d/, "Password harus mengandung minimal satu angka.")],
    "reg-ulang": [wajib("Konfirmasi password"), (v) => (v === $("#reg-password").value ? "" : "Konfirmasi password tidak sama.")],
  });
  fDaftar.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cekDaftar()) return;
    const em = $("#reg-email").value.trim().toLowerCase();
    if (semuaPengguna().some((u) => u.email.toLowerCase() === em)) { setError($("#reg-email"), "Email sudah terdaftar. Silakan login."); return; }
    const baru = { id: Date.now(), nama: $("#reg-nama").value.trim(), email: em, password: $("#reg-password").value, role: "User" };
    store.set(KEY.users, [...store.get(KEY.users, []), baru]);
    tutupDialog($("#dlg-daftar"));
    fDaftar.reset();
    $("#email").value = em; $("#password").value = "";
    tampilAlert({ judul: "Pendaftaran berhasil", pesan: "Akun Anda sudah dibuat. Silakan login dengan email dan password tadi.", tipe: "success", aksi: () => $("#password").focus() });
  });
}

/* ==========================================================
   HALAMAN: DASHBOARD
   ========================================================== */
function sapaan(h) {
  if (h >= 4 && h < 11) return "Selamat Pagi";
  if (h >= 11 && h < 15) return "Selamat Siang";
  if (h >= 15 && h < 18) return "Selamat Sore";
  return "Selamat Malam";
}
function initDashboard() {
  const s = sesi();
  const g = $("#greeting");
  const tick = () => {
    const now = new Date();
    g.innerHTML = `${sapaan(now.getHours())}, <span>${esc(s.nama.split(" ")[0])}</span>`;
    $("#jam").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    $("#tanggal").textContent = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  tick(); setInterval(tick, 1000);
  $("#role").textContent = s.role;

  const stat = {
    judul: dataKatalogBuku.length,
    stok: dataKatalogBuku.reduce((a, b) => a + b.stok, 0),
    pesanan: semuaPesanan().length,
    keranjang: keranjang().reduce((a, i) => a + i.qty, 0),
  };
  $$("[data-count]").forEach((el) => {
    const target = stat[el.dataset.count], t0 = performance.now(), dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("id-ID");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* ==========================================================
   HALAMAN: STOK / KATALOG
   ========================================================== */
function initStok() {
  const tbody = $("#tbody-stok"), grid = $("#grid-buku"), tabelWrap = $("#tabel-wrap");
  let tampilan = store.get("pt_view", "tabel");
  let barisBaru = null;
  const maxStok = () => Math.max(...dataKatalogBuku.map((b) => b.stok), 1);

  const cover = (b, cls) => b.cover
    ? `<img class="${cls}" src="${esc(b.cover)}" alt="Sampul buku ${esc(b.namaBarang)}" loading="lazy">`
    : `<div class="cover-ph" aria-hidden="true">${esc(b.namaBarang.charAt(0))}</div>`;
  const bar = (b) => {
    const p = Math.max(4, Math.round((b.stok / maxStok()) * 100));
    const k = b.stok < 100 ? "crit" : b.stok < 200 ? "low" : "";
    return `<div class="stock-bar" aria-hidden="true"><i class="${k}" style="width:${p}%"></i></div>`;
  };
  const isBaru = (b) => store.get(KEY.stok, []).some((x) => x.kodeBarang === b.kodeBarang);

  function daftar() {
    const q = $("#cari").value.trim().toLowerCase();
    const urut = $("#urut").value;
    let arr = dataKatalogBuku.filter((b) => [b.kodeBarang, b.namaBarang, b.jenisBarang].join(" ").toLowerCase().includes(q));
    const cmp = {
      nama: (a, b) => a.namaBarang.localeCompare(b.namaBarang),
      stokDesc: (a, b) => b.stok - a.stok,
      stokAsc: (a, b) => a.stok - b.stok,
      hargaAsc: (a, b) => toNum(a.harga) - toNum(b.harga),
      hargaDesc: (a, b) => toNum(b.harga) - toNum(a.harga),
    }[urut];
    if (cmp) arr = [...arr].sort(cmp);
    return arr;
  }

  function render() {
    const arr = daftar();
    $("#jumlah-hasil").textContent = `${arr.length} dari ${dataKatalogBuku.length} judul`;
    tabelWrap.hidden = tampilan !== "tabel";
    grid.hidden = tampilan !== "grid";
    $$("[data-view]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === tampilan));
    $("#total-stok").textContent = arr.reduce((a, b) => a + b.stok, 0).toLocaleString("id-ID");
    const kosong = `<div class="empty">${ico("search")}<p>Tidak ada buku yang cocok dengan pencarian.</p></div>`;

    tbody.innerHTML = arr.length ? arr.map((b) => `
      <tr data-kode="${esc(b.kodeBarang)}" class="${b.kodeBarang === barisBaru ? "row-new" : ""}">
        <td>${cover(b, "cover-thumb")}</td>
        <td><span class="kode">${esc(b.kodeBarang)}</span></td>
        <td><span class="book-title">${esc(b.namaBarang)}</span>${isBaru(b) ? '<span class="tag">Baru</span>' : ""}</td>
        <td>${esc(b.jenisBarang)}</td>
        <td class="num">${esc(b.edisi)}</td>
        <td class="num">${b.stok.toLocaleString("id-ID")}${bar(b)}</td>
        <td class="num">${esc(b.harga)}</td>
        <td><div class="row-actions">
          <button class="btn btn-dark btn-sm" data-pesan="${esc(b.kodeBarang)}" aria-label="Pesan ${esc(b.namaBarang)}">${ico("cart")} Pesan</button>
          ${isBaru(b) ? `<button class="btn btn-danger btn-sm" data-hapus="${esc(b.kodeBarang)}" aria-label="Hapus ${esc(b.namaBarang)}">${ico("trash")}</button>` : ""}
        </div></td>
      </tr>`).join("") : `<tr><td colspan="8">${kosong}</td></tr>`;

    grid.innerHTML = arr.length ? arr.map((b) => `
      <article class="book-card">
        ${b.cover ? cover(b, "cover-lg") : `<div class="cover-ph cover-lg" style="width:100%;aspect-ratio:2/3;height:auto;font-size:3rem">${esc(b.namaBarang.charAt(0))}</div>`}
        <span class="kode">${esc(b.kodeBarang)} · Edisi ${esc(b.edisi)}</span>
        <h3>${esc(b.namaBarang)}${isBaru(b) ? '<span class="tag">Baru</span>' : ""}</h3>
        <div class="price">${esc(b.harga)}</div>
        <div class="muted" style="font-size:.84rem">Stok: ${b.stok.toLocaleString("id-ID")}</div>${bar(b)}
        <div class="actions"><button class="btn btn-dark btn-sm" data-pesan="${esc(b.kodeBarang)}">${ico("cart")} Pesan</button>${isBaru(b) ? `<button class="btn btn-danger btn-sm" data-hapus="${esc(b.kodeBarang)}" aria-label="Hapus">${ico("trash")}</button>` : ""}</div>
      </article>`).join("") : kosong;
    barisBaru = null;
  }

  $("#cari").addEventListener("input", render);
  $("#urut").addEventListener("change", render);
  $$("[data-view]").forEach((b) => b.addEventListener("click", () => { tampilan = b.dataset.view; store.set("pt_view", tampilan); render(); }));

  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-pesan]");
    if (p) {
      const b = cariBuku(p.dataset.pesan);
      if (tambahKeKeranjang(p.dataset.pesan)) toast(`“${b.namaBarang}” masuk keranjang. <a href="checkout.html">Checkout →</a>`, "success", true);
    }
    const h = e.target.closest("[data-hapus]");
    if (h) {
      const b = cariBuku(h.dataset.hapus);
      tampilAlert({ judul: "Hapus baris stok?", pesan: `“${b.namaBarang}” akan dihapus dari katalog.`, tipe: "error", tombol: "Hapus", batal: "Batal", aksi: () => {
        dataKatalogBuku.splice(dataKatalogBuku.indexOf(b), 1);
        store.set(KEY.stok, store.get(KEY.stok, []).filter((x) => x.kodeBarang !== b.kodeBarang));
        simpanKeranjang(keranjang().filter((i) => i.kode !== b.kodeBarang));
        render(); toast("Baris stok dihapus.");
      } });
    }
  });

  // Form tambah stok (manipulasi DOM + validasi)
  const form = $("#form-stok");
  const cek = liveValidate(form, {
    kode: [wajib("Kode barang"), polaOk(/^[A-Za-z]{4}\d{4}$/, "Format kode: 4 huruf + 4 angka (contoh: EKMA4501).")],
    nama: [wajib("Nama barang"), minLen(3, "Nama barang")],
    jenis: [wajib("Jenis barang")],
    edisi: [wajib("Edisi"), polaOk(/^[1-9]\d?$/, "Edisi berupa angka 1–99.")],
    stokBaru: [wajib("Stok"), polaOk(/^\d{1,6}$/, "Stok harus angka bulat ≥ 0.")],
    hargaBaru: [wajib("Harga"), polaOk(/^[1-9]\d{3,8}$/, "Harga berupa angka tanpa titik (min. 1000).")],
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cek()) return;
    const kode = $("#kode").value.trim().toUpperCase();
    if (cariBuku(kode)) { setError($("#kode"), "Kode barang sudah ada di katalog."); $("#kode").focus(); return; }
    const buku = {
      kodeBarang: kode, namaBarang: $("#nama").value.trim(), jenisBarang: $("#jenis").value,
      edisi: $("#edisi").value.trim(), stok: parseInt($("#stokBaru").value, 10),
      harga: rupiah(parseInt($("#hargaBaru").value, 10)), cover: "",
    };
    dataKatalogBuku.push(buku);
    store.set(KEY.stok, [...store.get(KEY.stok, []), buku]);
    barisBaru = kode;
    $("#cari").value = "";
    $("#urut").value = "";
    render();
    tutupDialog($("#dlg-stok")); form.reset();
    toast("Baris stok baru berhasil ditambahkan.", "success");
    setTimeout(() => { const r = $(`tr[data-kode="${kode}"]`); if (r) r.scrollIntoView({ behavior: "smooth", block: "center" }); }, 80);
  });
  render();
}

/* ==========================================================
   HALAMAN: CHECKOUT / PEMESANAN
   ========================================================== */
const ONGKIR = { JNE: 15000, "Pos Indonesia": 12000, "J&T Express": 18000, SiCepat: 14000 };
function initCheckout() {
  const s = sesi();
  const tbody = $("#tbody-keranjang");
  $("#nama-pemesan").value = s.nama; $("#email-pemesan").value = s.email;

  // dropdown tambah buku
  const sel = $("#pilih-buku");
  sel.innerHTML = '<option value="">— Pilih buku untuk ditambahkan —</option>' +
    dataKatalogBuku.map((b) => `<option value="${esc(b.kodeBarang)}">${esc(b.namaBarang)} — ${esc(b.harga)}</option>`).join("");

  const subtotal = () => keranjang().reduce((a, i) => { const b = cariBuku(i.kode); return a + (b ? toNum(b.harga) * i.qty : 0); }, 0);
  const ongkir = () => (keranjang().length ? ONGKIR[$("#ekspedisi").value] || 0 : 0);

  function render() {
    const c = keranjang().filter((i) => cariBuku(i.kode));
    if (c.length !== keranjang().length) simpanKeranjang(c);
    tbody.innerHTML = c.length ? c.map((i) => {
      const b = cariBuku(i.kode);
      return `<tr data-kode="${esc(i.kode)}">
        <td><span class="book-title">${esc(b.namaBarang)}</span><br><span class="kode">${esc(b.kodeBarang)} · stok ${b.stok}</span></td>
        <td class="num">${esc(b.harga)}</td>
        <td><div class="qty"><button type="button" data-min aria-label="Kurangi">−</button><input type="number" min="1" max="${b.stok}" value="${i.qty}" aria-label="Jumlah ${esc(b.namaBarang)}" data-qty><button type="button" data-plus aria-label="Tambah">+</button></div></td>
        <td class="num"><strong>${rupiah(toNum(b.harga) * i.qty)}</strong></td>
        <td><button type="button" class="btn btn-danger btn-sm" data-del aria-label="Hapus ${esc(b.namaBarang)}">${ico("trash")}</button></td>
      </tr>`;
    }).join("") : `<tr><td colspan="5"><div class="empty">${ico("cart")}<p>Keranjang masih kosong. Tambahkan buku di bawah atau dari <a href="stok.html">halaman katalog</a>.</p></div></td></tr>`;
    hitung();
  }
  function hitung() {
    const st = subtotal(), ok = ongkir();
    $("#sum-sub").textContent = rupiah(st);
    $("#sum-ongkir").textContent = rupiah(ok);
    $("#sum-total").textContent = rupiah(st + ok);
    $("#sum-item").textContent = keranjang().reduce((a, i) => a + i.qty, 0) + " item";
  }

  tbody.addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-kode]"); if (!tr) return;
    const kode = tr.dataset.kode, c = keranjang(), it = c.find((i) => i.kode === kode), b = cariBuku(kode);
    if (e.target.closest("[data-plus]")) { if (it.qty < b.stok) it.qty++; else toast("Mentok di stok tersedia.", "error"); }
    else if (e.target.closest("[data-min]")) { it.qty = Math.max(1, it.qty - 1); }
    else if (e.target.closest("[data-del]")) { c.splice(c.indexOf(it), 1); toast("Item dihapus dari keranjang."); }
    else return;
    simpanKeranjang(c); render();
  });
  tbody.addEventListener("change", (e) => {
    if (!e.target.matches("[data-qty]")) return;
    const kode = e.target.closest("tr").dataset.kode, c = keranjang(), it = c.find((i) => i.kode === kode), b = cariBuku(kode);
    let n = parseInt(e.target.value, 10);
    if (!n || n < 1) n = 1;
    if (n > b.stok) { n = b.stok; toast("Jumlah disesuaikan dengan stok (" + b.stok + ").", "error"); }
    it.qty = n; simpanKeranjang(c); render();
  });
  $("#btn-tambah").addEventListener("click", () => {
    if (!sel.value) { toast("Pilih buku terlebih dahulu.", "error"); sel.focus(); return; }
    if (tambahKeKeranjang(sel.value, parseInt($("#qty-tambah").value, 10) || 1)) { render(); sel.value = ""; $("#qty-tambah").value = 1; }
  });
  $("#ekspedisi").addEventListener("change", hitung);
  $$('input[name="metode"]').forEach((r) => r.addEventListener("change", () => $(".pay-options").classList.remove("invalid")));
  $("#btn-kosong").addEventListener("click", () => {
    if (!keranjang().length) return;
    tampilAlert({ judul: "Kosongkan keranjang?", pesan: "Semua item akan dihapus dari keranjang.", tipe: "error", tombol: "Kosongkan", batal: "Batal", aksi: () => { simpanKeranjang([]); render(); } });
  });

  // validasi form pemesan + pembayaran
  const form = $("#form-checkout");
  const cek = liveValidate(form, {
    "nama-pemesan": [wajib("Nama pemesan"), minLen(3, "Nama")],
    "email-pemesan": [wajib("Email"), emailOk],
    telepon: [wajib("No. telepon"), polaOk(/^(\+62|62|0)8\d{8,11}$/, "Nomor HP tidak valid (contoh: 081234567890).")],
    alamat: [wajib("Alamat"), minLen(10, "Alamat")],
    kodepos: [wajib("Kode pos"), polaOk(/^\d{5}$/, "Kode pos harus 5 digit angka.")],
    ekspedisi: [wajib("Ekspedisi")],
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const c = keranjang();
    const formOk = cek();
    const metode = $('input[name="metode"]:checked');
    $(".pay-options").classList.toggle("invalid", !metode);
    if (!c.length) { tampilAlert({ judul: "Keranjang kosong", pesan: "Tambahkan minimal satu buku sebelum memesan.", tipe: "error" }); return; }
    if (!formOk) { toast("Lengkapi data yang bertanda merah.", "error"); return; }
    if (!metode) { toast("Pilih metode pembayaran.", "error"); return; }

    const nomorDO = String(new Date().getFullYear()) + String(Math.floor(1000 + Math.random() * 9000));
    const total = subtotal() + ongkir();
    const now = new Date();
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const pesanan = {
      nomorDO, nama: $("#nama-pemesan").value.trim(), status: "Diproses", ekspedisi: $("#ekspedisi").value,
      tanggalKirim: stamp.slice(0, 10), paket: "PKT" + nomorDO.slice(-4) + "-" + c.length, total: rupiah(total),
      metode: metode.value, alamat: $("#alamat").value.trim() + " " + $("#kodepos").value, email: $("#email-pemesan").value.trim(),
      items: c.map((i) => ({ kode: i.kode, nama: cariBuku(i.kode).namaBarang, qty: i.qty })),
      perjalanan: [{ waktu: stamp, keterangan: "Pesanan diterima dan sedang diproses oleh Pustaka Terbuka" }],
    };
    store.set(KEY.orders, [pesanan, ...pesananLokal()]);
    simpanKeranjang([]);
    render(); form.reset();
    $("#nama-pemesan").value = s.nama; $("#email-pemesan").value = s.email;

    const dlg = $("#dlg-sukses");
    $("#do-sukses").textContent = nomorDO;
    $("#total-sukses").textContent = rupiah(total);
    $("#link-lacak").href = "tracking.html?do=" + nomorDO;
    bukaDialog(dlg);
  });
  render();
}

/* ==========================================================
   HALAMAN: TRACKING
   ========================================================== */
function initTracking() {
  const form = $("#form-tracking"), out = $("#hasil");
  const input = $("#nomor-do");

  const chips = $("#chips");
  const contoh = [...new Set([...pesananLokal().slice(0, 2).map((o) => o.nomorDO), ...Object.keys(dataTracking)])];
  chips.innerHTML = '<span>Coba:</span>' + contoh.map((n) => `<button type="button" class="chip" data-do="${esc(n)}">${esc(n)}</button>`).join("");
  chips.addEventListener("click", (e) => { const c = e.target.closest("[data-do]"); if (c) { input.value = c.dataset.do; cari(); } });

  function cari() {
    const no = input.value.trim();
    if (!validasi(input, [wajib("Nomor Delivery Order"), polaOk(/^\d{6,12}$/, "Nomor DO berupa angka 6–12 digit.")])) { out.innerHTML = ""; return; }
    const o = cariPesanan(no);
    if (!o) {
      out.innerHTML = "";
      setError(input, "Nomor DO tidak ditemukan. Periksa kembali nomor Anda.");
      tampilAlert({ judul: "Pesanan tidak ditemukan", pesan: `Tidak ada pengiriman dengan nomor DO ${no}.`, tipe: "error" });
      return;
    }
    tampilHasil(o);
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); cari(); });
  input.addEventListener("input", () => setError(input, ""));

  function tampilHasil(o) {
    const idx = indeksLangkah(o), status = LANGKAH[idx];
    const persen = Math.round((idx / (LANGKAH.length - 1)) * 100);
    const ikon = ["box", "truck", "truck", "check"];
    const rute = [...(o.perjalanan || [])].reverse();
    out.innerHTML = `
      <div class="result">
        <section class="card" aria-labelledby="h-hasil">
          <div class="result-head">
            <div><div class="eyebrow">Nomor DO ${esc(o.nomorDO)}</div><h2 id="h-hasil" style="margin:0">${esc(o.nama)}</h2><span class="muted">Nama pemesan</span></div>
            <span class="status-pill st-${status.toLowerCase().replace(/ /g, "-")}">${esc(status)}</span>
          </div>
          <ol class="stepper" aria-label="Tahapan pengiriman">
            ${LANGKAH.map((l, i) => `<li class="${i < idx || (i === idx && idx === 3) ? "done" : i === idx ? "current" : ""}" ${i === idx ? 'aria-current="step"' : ""}><div class="dot">${i < idx || (i === idx && idx === 3) ? ico("check") : ico(ikon[i])}</div>${l}</li>`).join("")}
          </ol>
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${persen}" aria-label="Progres pengiriman"><i data-w="${persen}"></i></div>
        </section>
        <section class="card" aria-labelledby="h-detail">
          <h3 id="h-detail">Detail pengiriman</h3>
          <dl class="detail-grid">
            <div><dt>Ekspedisi</dt><dd>${esc(o.ekspedisi)}</dd></div>
            <div><dt>Tanggal kirim</dt><dd>${esc(fmtTanggal(o.tanggalKirim))}</dd></div>
            <div><dt>Jenis paket</dt><dd>${esc(o.paket)}</dd></div>
            <div><dt>Total pembayaran</dt><dd>${esc(o.total)}</dd></div>
          </dl>
        </section>
        <section class="card" aria-labelledby="h-rute">
          <h3 id="h-rute">Riwayat perjalanan</h3>
          <ol class="timeline">${rute.map((r, i) => `<li class="${i === 0 ? "latest" : ""}"><time>${esc(fmtWaktu(r.waktu))}</time>${esc(r.keterangan)}</li>`).join("")}</ol>
        </section>
      </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { const b = $(".progress i", out); if (b) b.style.width = b.dataset.w + "%"; }));
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const q = new URLSearchParams(location.search).get("do");
  if (q) { input.value = q; cari(); }
}

/* ==========================================================
   HALAMAN: LAPORAN PEMESANAN
   ========================================================== */
function initLaporan() {
  const data = semuaPesanan();
  const total = data.reduce((a, o) => a + toNum(o.total), 0);
  $("#lap-jumlah").textContent = data.length;
  $("#lap-total").textContent = rupiah(total);
  $("#lap-rata").textContent = rupiah(data.length ? total / data.length : 0);
  $("#lap-selesai").textContent = data.filter((o) => indeksLangkah(o) === 3).length;

  const kelompok = (fn) => data.reduce((m, o) => { const k = fn(o); m[k] = (m[k] || 0) + toNum(o.total); return m; }, {});
  const gambarBar = (el, obj, fmt) => {
    const mx = Math.max(...Object.values(obj), 1);
    el.innerHTML = Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
      <div class="bar-row"><span>${esc(k)}</span><div class="track"><i data-w="${Math.round((v / mx) * 100)}"></i></div><span class="val">${fmt(v)}</span></div>`).join("") || '<p class="muted">Belum ada data.</p>';
  };
  gambarBar($("#bar-ekspedisi"), kelompok((o) => o.ekspedisi), rupiah);
  gambarBar($("#bar-status"), data.reduce((m, o) => { const k = statusEfektif(o); m[k] = (m[k] || 0) + 1; return m; }, {}), (v) => v + " pesanan");
  gambarBar($("#bar-stok"), Object.fromEntries(dataKatalogBuku.map((b) => [b.namaBarang, b.stok])), (v) => v.toLocaleString("id-ID"));
  requestAnimationFrame(() => requestAnimationFrame(() => $$(".track i").forEach((i) => (i.style.width = i.dataset.w + "%"))));
}

/* ==========================================================
   HALAMAN: HISTORY TRANSAKSI
   ========================================================== */
function initRiwayat() {
  const tbody = $("#tbody-riwayat");
  function render() {
    const q = $("#cari-riwayat").value.trim().toLowerCase(), st = $("#filter-status").value;
    const arr = semuaPesanan()
      .filter((o) => (!st || statusEfektif(o) === st) && [o.nomorDO, o.nama, o.ekspedisi].join(" ").toLowerCase().includes(q))
      .sort((a, b) => String(b.tanggalKirim).localeCompare(String(a.tanggalKirim)) || b.nomorDO.localeCompare(a.nomorDO));
    $("#jumlah-riwayat").textContent = arr.length + " transaksi";
    tbody.innerHTML = arr.length ? arr.map((o) => {
      const s = statusEfektif(o);
      return `<tr>
        <td><span class="kode">${esc(o.nomorDO)}</span></td>
        <td>${esc(fmtTanggal(o.tanggalKirim))}</td>
        <td><span class="book-title">${esc(o.nama)}</span>${o.sumber === "lokal" ? '<span class="tag">Baru</span>' : ""}</td>
        <td>${esc(o.ekspedisi)}</td>
        <td>${esc(o.metode || "—")}</td>
        <td class="num">${esc(o.total)}</td>
        <td><span class="status-pill st-${s.toLowerCase().replace(/ /g, "-")}">${esc(s)}</span></td>
        <td><a class="btn btn-ghost btn-sm" href="tracking.html?do=${esc(o.nomorDO)}">${ico("eye")} Lacak</a></td>
      </tr>`;
    }).join("") : `<tr><td colspan="8"><div class="empty">${ico("search")}<p>Tidak ada transaksi yang cocok.</p></div></td></tr>`;
  }
  $("#cari-riwayat").addEventListener("input", render);
  $("#filter-status").addEventListener("change", render);
  render();
}

/* ---------- Bootstrap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  muatKatalog();
  pasangDialog();
  pasangTogglePassword();
  if (page === "login") { initLogin(); return; }
  if (!sesi()) { location.replace("index.html"); return; }
  initHeader();
  ({ dashboard: initDashboard, stok: initStok, checkout: initCheckout, tracking: initTracking, laporan: initLaporan, riwayat: initRiwayat }[page] || (() => {}))();
});

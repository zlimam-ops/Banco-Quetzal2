/* =========================================================
   Banco Quetzal - Lógica del sistema (HTML + CSS + JS)
   "Base de datos": localStorage del navegador (clave DB_KEY)
   Usuario de pruebas: admin / 2026
   ========================================================= */
const DB_KEY = "bancoQuetzalDB";
const SERVICES = ["Energía eléctrica (EEGSA)", "Agua potable (EMPAGUA)", "Telefonía móvil", "Internet residencial", "Cable TV"];

/* ---------- Base de datos ---------- */
function seed() {
  const now = Date.now(), day = 86400000;
  const db = {
    users: [
      { user: "admin", pass: "2026", name: "Administrador del Sistema", dpi: "1234567890101", email: "admin@bancoquetzal.com", tel: "55551234", date: new Date(now - 90 * day).toISOString() },
      { user: "lucia", pass: "1234", name: "Lucía Morales", dpi: "9876543210101", email: "lucia@correo.com", tel: "44445678", date: new Date(now - 60 * day).toISOString() }
    ],
    accounts: [
      { num: "1000000001", owner: "admin", type: "Ahorro", balance: 0 },
      { num: "1000000002", owner: "admin", type: "Monetaria", balance: 0 },
      { num: "2000000001", owner: "lucia", type: "Ahorro", balance: 0 }
    ],
    tx: []
  };
  addTx(db, "1000000001", "Depósito", "Apertura de cuenta", 12000, new Date(now - 30 * day));
  addTx(db, "1000000001", "Depósito", "Pago de nómina", 4500, new Date(now - 14 * day));
  addTx(db, "1000000001", "Pago de servicio", "Energía eléctrica (EEGSA) - Ref. 458712", -380.5, new Date(now - 9 * day));
  addTx(db, "1000000002", "Depósito", "Apertura de cuenta", 5000, new Date(now - 30 * day));
  addTx(db, "2000000001", "Depósito", "Apertura de cuenta", 3000, new Date(now - 20 * day));
  return db;
}
function loadDB() {
  let db = null;
  try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) {}
  if (!db) { db = seed(); saveDB(db); }
  return db;
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

/* Registra una operación y actualiza el saldo de la cuenta */
function addTx(db, accNum, type, desc, amount, date) {
  const acc = db.accounts.find(a => a.num === accNum);
  acc.balance = Math.round((acc.balance + amount) * 100) / 100;
  db.tx.push({ id: db.tx.length + 1, date: (date || new Date()).toISOString(), acc: accNum, type, desc, amount, bal: acc.balance });
}

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const money = n => new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(n);
const fdate = iso => new Date(iso).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const msg = (el, text, ok) => { el.textContent = text; el.className = "msg " + (ok ? "ok" : "err"); };

/* ---------- Navegación entre vistas ---------- */
function show(id) {
  document.querySelectorAll(".view").forEach(v => v.hidden = v.id !== id);
  window.scrollTo(0, 0);
}
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (!go) return;
  const href = go.getAttribute("href");
  if (href === "#" || go.tagName === "BUTTON") e.preventDefault();
  if (session() && go.dataset.go === "home") { openApp(); return; }
  show(go.dataset.go);
  if (href && href.startsWith("#") && href.length > 1) setTimeout(() => document.getElementById(href.slice(1))?.scrollIntoView(), 50);
});

/* ---------- Sesión ---------- */
const session = () => sessionStorage.getItem("bq_user");
function currentUser() { return loadDB().users.find(u => u.user === session()); }

/* ---------- Registro ---------- */
$("#form-register").addEventListener("submit", e => {
  e.preventDefault();
  const db = loadDB(), m = $("#r-msg");
  const user = $("#r-user").value.trim().toLowerCase();
  if (db.users.some(u => u.user === user)) return msg(m, "Ese usuario ya existe. Elige otro.");
  if (db.users.some(u => u.dpi === $("#r-dpi").value)) return msg(m, "Ya hay un cliente registrado con ese DPI.");
  const u = { user, pass: $("#r-pass").value, name: $("#r-name").value.trim(), dpi: $("#r-dpi").value,
    email: $("#r-email").value.trim(), tel: $("#r-tel").value, date: new Date().toISOString() };
  db.users.push(u);
  const num = String(3000000000 + db.accounts.length + 1);
  db.accounts.push({ num, owner: user, type: "Ahorro", balance: 0 });
  addTx(db, num, "Depósito", "Bono de bienvenida", 500);
  saveDB(db);
  e.target.reset(); msg(m, "");
  $("#registered-data").innerHTML = `
    <p><b>Nombre:</b> ${esc(u.name)}</p><p><b>DPI:</b> ${esc(u.dpi)}</p>
    <p><b>Correo:</b> ${esc(u.email)}</p><p><b>Teléfono:</b> ${esc(u.tel)}</p>
    <p><b>Usuario:</b> ${esc(u.user)}</p><p><b>Cuenta de ahorro:</b> ${num}</p>
    <p><b>Saldo inicial:</b> ${money(500)}</p>`;
  show("registered");
});

/* ---------- Login / Logout ---------- */
$("#form-login").addEventListener("submit", e => {
  e.preventDefault();
  const u = loadDB().users.find(x => x.user === $("#l-user").value.trim().toLowerCase() && x.pass === $("#l-pass").value);
  if (!u) return msg($("#l-msg"), "Usuario o contraseña incorrectos.");
  sessionStorage.setItem("bq_user", u.user);
  e.target.reset(); msg($("#l-msg"), "");
  openApp();
});
$("#btn-logout").addEventListener("click", () => {
  sessionStorage.removeItem("bq_user");
  $("#nav-public").hidden = false; $("#nav-private").hidden = true;
  show("home");
});

function openApp() {
  const u = currentUser();
  if (!u) return show("login");
  $("#nav-public").hidden = true; $("#nav-private").hidden = false;
  $("#nav-user").textContent = "Hola, " + u.name.split(" ")[0];
  show("app"); renderTab("summary");
}

/* ---------- Pestañas del sistema ---------- */
document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => renderTab(b.dataset.tab)));

function myAccounts(db) { return db.accounts.filter(a => a.owner === session()); }
function accOptions(db) { return myAccounts(db).map(a => `<option value="${a.num}">${a.type} ${a.num} - ${money(a.balance)}</option>`).join(""); }

function renderTab(tab) {
  document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  const db = loadDB(), box = $("#tab-content");
  ({ summary, moves, transfer, services, statement }[tab])(db, box);
}

/* 1) Consulta de cuentas y datos del cliente */
function summary(db, box) {
  const u = currentUser();
  box.innerHTML = `
    <div class="card"><h2>Datos del cliente</h2>
      <p><b>Nombre:</b> ${esc(u.name)} &nbsp; <b>DPI:</b> ${esc(u.dpi)}</p>
      <p><b>Correo:</b> ${esc(u.email)} &nbsp; <b>Teléfono:</b> ${esc(u.tel)}</p>
      <p><b>Cliente desde:</b> ${fdate(u.date)}</p></div>
    <h2>Saldo disponible</h2>
    <div class="accounts">${myAccounts(db).map(a => `
      <div class="account"><small>${a.type} · ${a.num}</small><p class="saldo">${money(a.balance)}</p></div>`).join("")}</div>`;
}

/* 2) Últimos movimientos */
function moves(db, box) {
  const nums = myAccounts(db).map(a => a.num);
  const rows = db.tx.filter(t => nums.includes(t.acc)).slice().reverse().slice(0, 15);
  box.innerHTML = `<div class="card"><h2>Últimos movimientos</h2>${txTable(rows, true)}</div>`;
}
function txTable(rows, showAcc) {
  if (!rows.length) return "<p>Aún no hay movimientos. Haz una transferencia o paga un servicio.</p>";
  return `<div class="table-wrap"><table><thead><tr><th>Fecha</th>${showAcc ? "<th>Cuenta</th>" : ""}<th>Tipo</th><th>Detalle</th><th>Monto</th><th>Saldo</th></tr></thead><tbody>
    ${rows.map(t => `<tr><td>${fdate(t.date)}</td>${showAcc ? `<td>${t.acc}</td>` : ""}<td>${esc(t.type)}</td><td>${esc(t.desc)}</td>
    <td class="n ${t.amount < 0 ? "neg" : "pos"}">${money(t.amount)}</td><td class="n">${money(t.bal)}</td></tr>`).join("")}</tbody></table></div>`;
}

/* 3) Transferencias entre cuentas */
function transfer(db, box) {
  box.innerHTML = `<div class="card"><h2>Transferir dinero</h2>
    <form class="form-inline" id="f-tr">
      <label>Cuenta de origen<select id="t-from">${accOptions(db)}</select></label>
      <label>Cuenta de destino<input id="t-to" inputmode="numeric" placeholder="Ej. 2000000001" required></label>
      <label>Monto (Q)<input id="t-amount" type="number" step="0.01" min="0.01" required></label>
      <p class="msg" id="t-msg" role="alert"></p>
      <button class="btn" type="submit">Transferir</button></form></div>`;
  $("#f-tr").addEventListener("submit", e => {
    e.preventDefault();
    const db = loadDB(), m = $("#t-msg");
    const from = db.accounts.find(a => a.num === $("#t-from").value);
    const to = db.accounts.find(a => a.num === $("#t-to").value.trim());
    const amount = Math.round(parseFloat($("#t-amount").value) * 100) / 100;
    if (!to) return msg(m, "La cuenta de destino no existe.");
    if (to.num === from.num) return msg(m, "El origen y el destino no pueden ser la misma cuenta.");
    if (!(amount > 0)) return msg(m, "Ingresa un monto mayor a cero.");
    if (amount > from.balance) return msg(m, "Saldo insuficiente. Disponible: " + money(from.balance));
    addTx(db, from.num, "Transferencia enviada", "A cuenta " + to.num, -amount);
    addTx(db, to.num, "Transferencia recibida", "De cuenta " + from.num, amount);
    saveDB(db);
    renderTab("transfer");
    msg($("#t-msg"), "Transferencia de " + money(amount) + " realizada con éxito.", true);
  });
}

/* 4) Pago de servicios */
function services(db, box) {
  box.innerHTML = `<div class="card"><h2>Pagar servicios</h2>
    <form class="form-inline" id="f-sv">
      <label>Servicio<select id="s-name">${SERVICES.map(s => `<option>${s}</option>`).join("")}</select></label>
      <label>Número de contrato o teléfono<input id="s-ref" required></label>
      <label>Monto (Q)<input id="s-amount" type="number" step="0.01" min="0.01" required></label>
      <label>Pagar desde<select id="s-from">${accOptions(db)}</select></label>
      <p class="msg" id="s-msg" role="alert"></p>
      <button class="btn" type="submit">Pagar</button></form></div>`;
  $("#f-sv").addEventListener("submit", e => {
    e.preventDefault();
    const db = loadDB(), m = $("#s-msg");
    const from = db.accounts.find(a => a.num === $("#s-from").value);
    const amount = Math.round(parseFloat($("#s-amount").value) * 100) / 100;
    if (!(amount > 0)) return msg(m, "Ingresa un monto mayor a cero.");
    if (amount > from.balance) return msg(m, "Saldo insuficiente. Disponible: " + money(from.balance));
    addTx(db, from.num, "Pago de servicio", $("#s-name").value + " - Ref. " + $("#s-ref").value.trim(), -amount);
    saveDB(db);
    renderTab("services");
    msg($("#s-msg"), "Pago de " + money(amount) + " registrado correctamente.", true);
  });
}

/* 5) Estado de cuenta */
function statement(db, box) {
  const today = new Date().toISOString().slice(0, 10), first = today.slice(0, 8) + "01";
  box.innerHTML = `<div class="card no-print"><h2>Generar estado de cuenta</h2>
    <form class="form-inline" id="f-st">
      <label>Cuenta<select id="e-acc">${accOptions(db)}</select></label>
      <label>Desde<input id="e-from" type="date" value="${first}" required></label>
      <label>Hasta<input id="e-to" type="date" value="${today}" required></label>
      <button class="btn" type="submit">Generar</button></form></div><div id="st-out"></div>`;
  $("#f-st").addEventListener("submit", e => {
    e.preventDefault();
    const db = loadDB(), u = currentUser();
    const acc = db.accounts.find(a => a.num === $("#e-acc").value);
    const from = new Date($("#e-from").value + "T00:00:00"), to = new Date($("#e-to").value + "T23:59:59");
    const all = db.tx.filter(t => t.acc === acc.num);
    const rows = all.filter(t => new Date(t.date) >= from && new Date(t.date) <= to);
    const before = all.filter(t => new Date(t.date) < from).pop();
    const opening = before ? before.bal : 0;
    const closing = rows.length ? rows[rows.length - 1].bal : opening;
    $("#st-out").innerHTML = `<div class="card">
      <div class="statement-head"><div><h2>Banco Quetzal · Estado de cuenta</h2>
        <p><b>Cliente:</b> ${esc(u.name)} (DPI ${esc(u.dpi)})<br><b>Cuenta:</b> ${acc.type} ${acc.num}<br>
        <b>Periodo:</b> ${$("#e-from").value} al ${$("#e-to").value}</p></div>
        <div><p><b>Saldo inicial:</b> ${money(opening)}<br><b>Saldo final:</b> ${money(closing)}<br><b>Movimientos:</b> ${rows.length}</p></div></div>
      ${txTable(rows, false)}
      <button class="btn no-print" onclick="window.print()">Imprimir o guardar PDF</button></div>`;
  });
}

/* ---------- Decoración: inserta la billetera en cada .wallet-slot ---------- */
document.querySelectorAll(".wallet-slot").forEach(s => s.appendChild($("#wallet-tpl").content.cloneNode(true)));

/* ---------- Inicio: si ya hay sesión abierta, entra directo ---------- */
loadDB();
if (session() && currentUser()) openApp();
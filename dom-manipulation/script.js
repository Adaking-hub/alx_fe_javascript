// ====================
// Storage Keys
// ====================
const LS_QUOTES_KEY = "dqg:quotes";
const LS_CATEGORY_KEY = "dqg:lastCategory";
const LS_CONFLICTS_KEY = "dqg:conflicts";    // store conflicts so user can revisit them
const SS_LAST_QUOTE_KEY = "dqg:lastQuote";

// ====================
// (Simulated) Server URL
// ====================
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // simulation endpoint

// ====================
// Array of quote objects (initial)
 // ====================
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" },
  { text: "If you can dream it, you can do it.", category: "Dreams" }
];

// ====================
// Conflicts storage (kept in localStorage too)
// Each conflict: { id, text, localCategory, serverCategory, resolved: false/true, resolution: 'server'|'local' }
// ====================
let conflicts = [];

// ====================
// DOM Elements
// ====================
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const exportBtn = document.getElementById("exportQuotes");
const importBtn = document.getElementById("importQuotes");
const importFileInput = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");

const syncNowBtn = document.getElementById("syncNow");
const syncNotification = document.getElementById("syncNotification");
const conflictModal = document.getElementById("conflictModal");
const conflictOverlay = document.getElementById("conflictOverlay");
const conflictList = document.getElementById("conflictList");
const closeConflictsBtn = document.getElementById("closeConflicts");
const clearConflictsBtn = document.getElementById("clearConflicts");

// ====================
// Local Storage helpers
// ====================
function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const raw = localStorage.getItem(LS_QUOTES_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function saveLastCategory(category) {
  localStorage.setItem(LS_CATEGORY_KEY, category);
}
function loadLastCategory() {
  return localStorage.getItem(LS_CATEGORY_KEY) || "all";
}

function saveConflicts() {
  try { localStorage.setItem(LS_CONFLICTS_KEY, JSON.stringify(conflicts)); } catch {}
}
function loadConflicts() {
  try {
    const raw = localStorage.getItem(LS_CONFLICTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ====================
// Session Storage helpers
// ====================
function saveLastViewed(quoteObj) {
  sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(quoteObj));
}
function loadLastViewed() {
  const raw = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ====================
// Utilities
// ====================
function makeConflictId(text, serverCat) {
  return `${text}__${serverCat}`.slice(0, 200);
}
function showNotification(msg, timeout = 6000) {
  syncNotification.textContent = msg;
  syncNotification.style.display = "block";
  if (timeout) {
    setTimeout(() => { syncNotification.style.display = "none"; }, timeout);
  }
}

// ====================
// Populate category dropdown
// ====================
function populateCategories() {
  if (!categoryFilter) return;
  const categories = [...new Set(quotes.map(q => q.category))].sort();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  categoryFilter.value = loadLastCategory();
}

// ====================
// Filtering logic
// ====================
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  saveLastCategory(selectedCategory);
  if (selectedCategory === "all") {
    showRandomQuote();
    return;
  }
  const filtered = quotes.filter(q => q.category === selectedCategory);
  if (filtered.length) {
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const randomQuote = filtered[randomIndex];
    quoteDisplay.innerHTML = `<p><strong>${randomQuote.category}:</strong> "${randomQuote.text}"</p>`;
    saveLastViewed(randomQuote);
  } else {
    quoteDisplay.textContent = "No quotes in this category.";
  }
}

// ====================
// Show a random quote
// ====================
function showRandomQuote() {
  const selectedCategory = categoryFilter ? categoryFilter.value : "all";
  let availableQuotes = quotes;
  if (selectedCategory && selectedCategory !== "all") {
    availableQuotes = quotes.filter(q => q.category === selectedCategory);
  }
  if (!availableQuotes.length) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * availableQuotes.length);
  const randomQuote = availableQuotes[randomIndex];
  quoteDisplay.innerHTML = `<p><strong>${randomQuote.category}:</strong> "${randomQuote.text}"</p>`;
  saveLastViewed(randomQuote);
}

// ====================
// Initial load
// ====================
function showInitialQuote() {
  const last = loadLastViewed();
  if (last && last.text && last.category) {
    quoteDisplay.innerHTML = `<p><strong>${last.category}:</strong> "${last.text}"</p>`;
  } else {
    showRandomQuote();
  }
}

// ====================
// Add new quote form (keeps previous behaviour)
// ====================
function createAddQuoteForm() {
  if (document.getElementById("addQuoteForm")) return;
  const form = document.createElement("form");
  form.id = "addQuoteForm";

  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.required = true;

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.required = true;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Add Quote";

  form.appendChild(quoteInput);
  form.appendChild(categoryInput);
  form.appendChild(submitBtn);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = quoteInput.value.trim();
    const category = categoryInput.value.trim();
    if (!text || !category) return;

    // Add locally
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    quoteInput.value = "";
    categoryInput.value = "";
    showRandomQuote();

    // Try to send to server (simulation)
    try {
      await sendNewQuoteToServer({ text, category }); // best-effort
      showNotification("Local quote added and sent to server (simulated).", 3000);
    } catch (err) {
      console.warn("Send to server failed:", err);
      showNotification("Local quote added but failed to send to server (simulation).", 4000);
    }
  });

  document.body.appendChild(form);
}

// ====================
// Export & Import (unchanged)
// ====================
function exportQuotesToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error("Invalid format.");
      parsed.forEach(q => {
        if (q.text && q.category) quotes.push({ text: q.text.trim(), category: q.category.trim() });
      });
      saveQuotes();
      populateCategories();
      showRandomQuote();
      showNotification("Imported quotes from file.", 3000);
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}
window.importFromJsonFile = importFromJsonFile;

// ====================
// Server sync: fetch and merge
// ====================
async function fetchFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    if (!res.ok) throw new Error("Network response not ok");
    const serverData = await res.json();

    // Convert server posts into our {text, category} shape.
    // Use first 12 posts to keep things small for demo.
    const serverQuotes = serverData.slice(0, 12).map(p => ({
      text: String(p.title).trim(),
      category: String((p.body || "").split(/\s+/)[0] || "Server").trim()
    }));

    // Merge (server wins on conflict)
    const { added, conflictsCreated } = mergeQuotes(serverQuotes);

    if (added > 0 || conflictsCreated > 0) {
      let msgParts = [];
      if (added) msgParts.push(`${added} added`);
      if (conflictsCreated) msgParts.push(`${conflictsCreated} conflicted (server applied)`);
      showNotification("Sync: " + msgParts.join(", ") + ".", 6000);
      saveQuotes();
      saveConflicts();
      populateCategories();
      showRandomQuote();
    }
  } catch (err) {
    console.warn("fetchFromServer failed:", err);
    showNotification("Sync failed (network).", 3500);
  }
}

// Merge server quotes into local store; server takes precedence on conflicts.
// Returns summary: { added, conflictsCreated }
function mergeQuotes(serverQuotes) {
  let added = 0;
  let conflictsCreated = 0;

  // load existing conflicts from storage so we can append
  conflicts = loadConflicts();

  for (const sq of serverQuotes) {
    const localIndex = quotes.findIndex(lq => lq.text === sq.text);

    if (localIndex === -1) {
      // new from server - add it
      quotes.push(sq);
      added++;
    } else {
      const localCat = quotes[localIndex].category;
      if (localCat !== sq.category) {
        // Conflict detected: server wins by default, but record conflict for manual override
        const conflict = {
          id: makeConflictId(sq.text, sq.category + Date.now()),
          text: sq.text,
          localCategory: localCat,
          serverCategory: sq.category,
          resolved: false,
          resolution: "server" // server was applied automatically
        };
        // apply server's change
        quotes[localIndex].category = sq.category;
        conflicts.push(conflict);
        conflictsCreated++;
      }
    }
  }

  // de-duplicate quotes array (avoid accidental duplicates)
  const seen = new Set();
  quotes = quotes.filter(q => {
    const k = `${q.text}__${q.category}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { added, conflictsCreated };
}

// ====================
// Send local new quote to server (simulation)
// ====================
async function sendNewQuoteToServer(quoteObj) {
  // This just simulates a POST to the server and ignores response.
  // JSONPlaceholder returns created object, but we don't rely on it.
  await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: quoteObj.text, body: quoteObj.category })
  });
}

// ====================
// Conflicts UI + handlers
// ====================
function openConflictModal() {
  conflicts = loadConflicts();
  if (!conflicts.length) {
    showNotification("No conflicts to review.", 2500);
    return;
  }
  conflictList.innerHTML = "";
  conflicts.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = "conflictItem";
    div.innerHTML = `
      <div><strong>Text:</strong> ${escapeHtml(c.text)}</div>
      <div><strong>Local category:</strong> ${escapeHtml(c.localCategory)} &nbsp; | &nbsp; <strong>Server category:</strong> ${escapeHtml(c.serverCategory)}</div>
      <div class="conflictActions" style="margin-top:6px;">
        <button data-index="${idx}" class="keepLocalBtn">Keep Local</button>
        <button data-index="${idx}" class="dismissBtn">Accept Server</button>
      </div>
    `;
    conflictList.appendChild(div);
  });

  // wire handlers
  conflictList.querySelectorAll(".keepLocalBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-index"));
      revertConflictToLocal(i);
    });
  });
  conflictList.querySelectorAll(".dismissBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-index"));
      dismissConflict(i);
    });
  });

  conflictOverlay.style.display = "block";
  conflictModal.style.display = "block";
}

function closeConflictModal() {
  conflictModal.style.display = "none";
  conflictOverlay.style.display = "none";
}

// If user chooses Keep Local, revert the server-applied change
function revertConflictToLocal(index) {
  conflicts = loadConflicts();
  const c = conflicts[index];
  if (!c || c.resolved) return;
  // find quote and set localCategory back
  const qi = quotes.findIndex(q => q.text === c.text);
  if (qi !== -1) {
    quotes[qi].category = c.localCategory;
    saveQuotes();
  }
  // mark conflict resolved, resolution = local
  c.resolved = true;
  c.resolution = "local";
  saveConflicts();
  showNotification(`Reverted "${truncate(c.text,50)}" to local category.`, 3000);
  populateCategories();
  closeConflictModal();
}

// If user accepts server (dismiss), just mark as resolved
function dismissConflict(index) {
  conflicts = loadConflicts();
  const c = conflicts[index];
  if (!c || c.resolved) return;
  c.resolved = true;
  c.resolution = "server";
  saveConflicts();
  showNotification(`Kept server category for "${truncate(c.text,40)}".`, 2500);
  closeConflictModal();
}

function clearResolvedConflicts() {
  conflicts = loadConflicts().filter(c => !c.resolved);
  saveConflicts();
  showNotification("Cleared resolved conflicts.", 2000);
}

// ====================
// Small helpers
// ====================
function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
function truncate(s, n=60) { return s.length > n ? s.slice(0,n-1) + "…" : s; }

// ====================
// Periodic sync setup
// ====================
let SYNC_INTERVAL_MS = 30000; // 30 seconds
let syncTimer = null;

function startAutoSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    fetchFromServer();
  }, SYNC_INTERVAL_MS);
}

// ====================
// Initialization & event wiring
// ====================
function init() {
  // load saved quotes & conflicts
  const saved = loadQuotes();
  if (saved && saved.length) quotes = saved;
  conflicts = loadConflicts();

  populateCategories();
  createAddQuoteForm();
  showInitialQuote();

  // event wiring
  newQuoteBtn.addEventListener("click", showRandomQuote);
  exportBtn.addEventListener("click", exportQuotesToJson);
  importBtn.addEventListener("click", () => importFileInput.click());
  syncNowBtn.addEventListener("click", () => { fetchFromServer(); });
  closeConflictsBtn.addEventListener("click", closeConflictModal);
  clearConflictsBtn.addEventListener("click", clearResolvedConflicts);
  conflictOverlay.addEventListener("click", closeConflictModal);

  // start periodic sync
  startAutoSync();

  // trigger initial server fetch (best-effort)
  fetchFromServer();
}

init();
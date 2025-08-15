// ====================
// Storage Keys
// ====================
const LS_QUOTES_KEY = "dqg:quotes";       // Local Storage key for the quotes array
const SS_LAST_QUOTE_KEY = "dqg:lastQuote"; // Session Storage key for the last viewed quote

// ====================
// Array of quote objects (let so we can replace from Local Storage)
// ====================
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" },
  { text: "If you can dream it, you can do it.", category: "Dreams" }
];

// ====================
// DOM elements
// ====================
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const exportBtn = document.getElementById("exportQuotes");
const importBtn = document.getElementById("importQuotes");
const importFileInput = document.getElementById("importFile");

// ====================
// Local Storage helpers
// ====================
function saveQuotes() {
  try {
    localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.warn("Could not save quotes to Local Storage:", e);
    alert("Saving to Local Storage failed. (Private mode or storage full?)");
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LS_QUOTES_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;

    // Validate and sanitize
    return data
      .filter(q => q && typeof q.text === "string" && typeof q.category === "string")
      .map(q => ({ text: q.text.trim(), category: q.category.trim() }))
      .filter(q => q.text && q.category);
  } catch (e) {
    console.warn("Could not load quotes from Local Storage:", e);
    return null;
  }
}

// ====================
// Session Storage helpers (optional)
// ====================
function saveLastViewed(quoteObj) {
  try {
    sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(quoteObj));
  } catch {}
}

function loadLastViewed() {
  try {
    const raw = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ====================
// Display a random quote (also remember it in session)
// ====================
function showRandomQuote() {
  if (!quotes.length) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  quoteDisplay.innerHTML = `<p><strong>${randomQuote.category}:</strong> "${randomQuote.text}"</p>`;
  saveLastViewed(randomQuote);
}

// Prefer last viewed (session) on first paint, else random
function showInitialQuote() {
  const last = loadLastViewed();
  if (last && last.text && last.category) {
    quoteDisplay.innerHTML = `<p><strong>${last.category}:</strong> "${last.text}"</p>`;
  } else {
    showRandomQuote();
  }
}

// ====================
// Dynamically create a form to add quotes
// ====================
function createAddQuoteForm() {
  if (document.getElementById("addQuoteForm")) return; // Prevent duplicates

  const form = document.createElement("form");
  form.id = "addQuoteForm";

  // Quote text input
  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.required = true;

  // Category input
  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.required = true;

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Add Quote";

  // Append inputs to form
  form.appendChild(quoteInput);
  form.appendChild(categoryInput);
  form.appendChild(submitBtn);

  // Form submit logic
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const quoteText = quoteInput.value.trim();
    const quoteCategory = categoryInput.value.trim();

    if (!quoteText || !quoteCategory) {
      alert("Please enter both the quote and category.");
      return;
    }

    // Add new quote to the array
    quotes.push({ text: quoteText, category: quoteCategory });

    // Persist to Local Storage
    saveQuotes();

    // Clear inputs
    quoteInput.value = "";
    categoryInput.value = "";

    // Update DOM
    showRandomQuote();
  });

  // Append form to the page
  document.body.appendChild(form);
}

// ====================
// Export to JSON
// ====================
function exportQuotesToJson() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2); // pretty JSON
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Export failed.");
  }
}

// ====================
// Import from JSON (called by the file input's onchange)
// ====================
function importFromJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);

      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of { text, category } objects.");
      }

      // Validate + sanitize incoming data
      const cleaned = parsed
        .filter(q => q && typeof q.text === "string" && typeof q.category === "string")
        .map(q => ({ text: q.text.trim(), category: q.category.trim() }))
        .filter(q => q.text && q.category);

      // De-duplicate based on text+category (case-insensitive)
      const key = q => `${q.text}__${q.category}`.toLowerCase();
      const existing = new Set(quotes.map(key));

      let added = 0;
      for (const q of cleaned) {
        const k = key(q);
        if (!existing.has(k)) {
          quotes.push(q);
          existing.add(k);
          added++;
        }
      }

      saveQuotes();
      alert(`Quotes imported successfully! Added ${added} new quote${added === 1 ? "" : "s"}.`);
      showRandomQuote();
    } catch (e) {
      alert("Import failed: " + e.message);
    } finally {
      // Allow importing the same file again if needed
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

// Expose function globally for inline onchange to find it
window.importFromJsonFile = importFromJsonFile;

// ====================
// Event listeners
// ====================
newQuoteBtn.addEventListener("click", showRandomQuote);

if (exportBtn) {
  exportBtn.addEventListener("click", exportQuotesToJson);
}

if (importBtn && importFileInput) {
  importBtn.addEventListener("click", () => importFileInput.click());
}

// ====================
// Initialize (load from Local Storage → build form → show initial)
// ====================
const saved = loadQuotes();
if (saved && saved.length) {
  quotes = saved;
}

createAddQuoteForm();
showInitialQuote();
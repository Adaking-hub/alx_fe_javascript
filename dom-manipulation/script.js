// ====================
// Storage Keys
// ====================
const LS_QUOTES_KEY = "dqg:quotes";          // Local Storage key for quotes array
const LS_CATEGORY_KEY = "dqg:lastCategory"; // Local Storage key for last selected category
const SS_LAST_QUOTE_KEY = "dqg:lastQuote";  // Session Storage key for last viewed quote

// ====================
// Array of quote objects
// ====================
let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" },
    { text: "If you can dream it, you can do it.", category: "Dreams" }
];

// ====================
// DOM Elements
// ====================
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const exportBtn = document.getElementById("exportQuotes");
const importBtn = document.getElementById("importQuotes");
const importFileInput = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");

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

// ====================
// Session Storage helpers
// ====================
function saveLastViewed(quoteObj) {
    sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(quoteObj));
}

function loadLastViewed() {
    const raw = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// ====================
// Populate category dropdown
// ====================
function populateCategories() {
    const categories = [...new Set(quotes.map(q => q.category))];
    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    // Restore last category selection
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
    } else {
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
}

// ====================
// Show a random quote
// ====================
function showRandomQuote() {
    const selectedCategory = categoryFilter.value;
    let availableQuotes = quotes;

    if (selectedCategory !== "all") {
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
// Add new quote form
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

    form.addEventListener("submit", e => {
        e.preventDefault();
        const text = quoteInput.value.trim();
        const category = categoryInput.value.trim();
        if (!text || !category) return;

        quotes.push({ text, category });
        saveQuotes();
        populateCategories();
        quoteInput.value = "";
        categoryInput.value = "";
        showRandomQuote();
    });

    document.body.appendChild(form);
}

// ====================
// Export & Import
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
                if (q.text && q.category) {
                    quotes.push({ text: q.text.trim(), category: q.category.trim() });
                }
            });
            saveQuotes();
            populateCategories();
            showRandomQuote();
        } catch (e) {
            alert("Import failed: " + e.message);
        }
    };
    reader.readAsText(file);
}
window.importFromJsonFile = importFromJsonFile;

// ====================
// Event listeners
// ====================
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportQuotesToJson);
importBtn.addEventListener("click", () => importFileInput.click());

// ====================
// Initialize
// ====================
const savedQuotes = loadQuotes();
if (savedQuotes) quotes = savedQuotes;

populateCategories();
createAddQuoteForm();
showInitialQuote();
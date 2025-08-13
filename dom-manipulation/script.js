// Array of quote objects
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Resilience" },
  { text: "If you can dream it, you can do it.", category: "Dreams" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

// Display a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  quoteDisplay.innerHTML = `<p><strong>${randomQuote.category}:</strong> "${randomQuote.text}"</p>`;
}

// Dynamically create a form to add quotes
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

    // Clear inputs
    quoteInput.value = "";
    categoryInput.value = "";

    // Update DOM
    showRandomQuote();
  });

  // Append form to the page
  document.body.appendChild(form);
}

// Event listener for the "Show New Quote" button
newQuoteBtn.addEventListener("click", showRandomQuote);

// Initialize
showRandomQuote();
createAddQuoteForm();
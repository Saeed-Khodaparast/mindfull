// Store notes in localStorage
let notes = JSON.parse(localStorage.getItem("mindful-notes")) || [];

// DOM elements
const noteForm = document.getElementById("note-form");
const notesContainer = document.getElementById("notes-container");
const filterButtons = document.querySelectorAll(".filter-btn");

// Review intervals in days (spaced repetition)
const reviewIntervals = [1, 3, 7, 14, 30, 90, 180];

// Add event listeners
document.addEventListener("DOMContentLoaded", () => {
  noteForm.addEventListener("submit", addNote);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");
      filterNotes(filter);

      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });

  const toggleBtn = document.getElementById("toggle-form-btn");
  const addNoteSection = document.querySelector(".add-note-section");

  toggleBtn.addEventListener("click", () => {
    addNoteSection.classList.toggle("collapsed");
    toggleBtn.textContent = addNoteSection.classList.contains("collapsed")
      ? "+"
      : "−";
  });

  // Initial render
  renderNotes();
});

// Add a new note
function addNote(e) {
  e.preventDefault();

  const title = document.getElementById("note-title").value;
  const content = document.getElementById("note-content").value;
  const date = document.getElementById("note-date").value;

  const newNote = {
    id: Date.now(),
    title,
    content,
    dateCreated: date,
    lastReviewed: null,
    reviewCount: 0,
    nextReview: date, // First review on the same day
    memoryStrength: 0, // 0-100 scale
  };

  notes.push(newNote);
  saveNotes();
  renderNotes();

  // Reset form
  noteForm.reset();
}

// Save notes to localStorage
function saveNotes() {
  localStorage.setItem("mindful-notes", JSON.stringify(notes));
}

// Render all notes
function renderNotes(filter = "all") {
  notesContainer.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredNotes =
    filter === "all"
      ? notes
      : notes.filter((note) => {
          const nextReviewDate = new Date(note.nextReview);
          return nextReviewDate <= today;
        });

  if (filteredNotes.length === 0) {
    notesContainer.innerHTML = "<p>No notes found.</p>";
    return;
  }

  filteredNotes.forEach((note) => {
    const needsReview = new Date(note.nextReview) <= today;

    // Create note card
    const noteCard = document.createElement("div");
    noteCard.className = "note-card";

    // Calculate progress color
    let progressClass = "progress-red";
    if (note.memoryStrength >= 70) {
      progressClass = "progress-green";
    } else if (note.memoryStrength >= 30) {
      progressClass = "progress-yellow";
    }

    noteCard.innerHTML = `
            <div class="note-header">
                <div class="note-title">${note.title}</div>
                <div class="note-date">Created: ${formatDate(
                  note.dateCreated
                )}</div>
            </div>
            <div class="note-content">${note.content}</div>
            <div class="progress-container">
                <div class="progress-bar ${progressClass}" style="width: ${
      note.memoryStrength
    }%"></div>
            </div>
            <div class="note-actions">
                <div class="review-status">
                    ${
                      needsReview
                        ? "Needs review!"
                        : `Next review: ${formatDate(note.nextReview)}`
                    }
                </div>
                <div>
                    <button class="review-btn" data-id="${
                      note.id
                    }">Review</button>
                    <button class="delete-btn" data-id="${
                      note.id
                    }">Delete</button>
                </div>
            </div>
        `;

    notesContainer.appendChild(noteCard);

    // Add event listeners to buttons
    noteCard
      .querySelector(".review-btn")
      .addEventListener("click", () => reviewNote(note.id));
    noteCard
      .querySelector(".delete-btn")
      .addEventListener("click", () => deleteNote(note.id));
  });
}

// Filter notes
function filterNotes(filter) {
  renderNotes(filter);
}

// Review a note
function reviewNote(id) {
  const noteIndex = notes.findIndex((note) => note.id === id);
  if (noteIndex === -1) return;

  const note = notes[noteIndex];

  // Update review count and last reviewed date
  note.reviewCount++;
  note.lastReviewed = new Date().toISOString().split("T")[0];

  // Calculate next review date based on spaced repetition
  const interval =
    reviewIntervals[Math.min(note.reviewCount, reviewIntervals.length - 1)];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  note.nextReview = nextReviewDate.toISOString().split("T")[0];

  // Update memory strength (increases with each review)
  note.memoryStrength = Math.min(100, note.memoryStrength + 20);

  // Save and re-render
  saveNotes();
  renderNotes();
}

// Delete a note
function deleteNote(id) {
  if (confirm("Are you sure you want to delete this note?")) {
    notes = notes.filter((note) => note.id !== id);
    saveNotes();
    renderNotes();
  }
}

// Format date for display
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

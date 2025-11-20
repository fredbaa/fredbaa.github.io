const STORAGE_KEY = "calendarPaymentPlannerCsv";

// Simple in-memory data model
const state = {
  currentYear: null,
  currentMonth: null, // 0-11
  payments: [], // { id, date: 'YYYY-MM-DD', name, amount }
  notes: [], // { id, date: 'YYYY-MM-DD', text }
  nextPaymentId: 1,
  nextNoteId: 1,
  selectedDate: null // 'YYYY-MM-DD'
};

function init() {
  const today = new Date();
  state.currentYear = today.getFullYear();
  state.currentMonth = today.getMonth();

  bindControls();
  loadFromStoredCsv();      // <--- load CSV (if any) from localStorage
  renderCalendar();

  // Start with empty payment form
  resetPaymentForm();
}

function bindControls() {
  document.getElementById("prev-month-btn").addEventListener("click", () =>
    changeMonth(-1)
  );
  document.getElementById("next-month-btn").addEventListener("click", () =>
    changeMonth(1)
  );
  document.getElementById("today-btn").addEventListener("click", () => goToToday());

  document
    .getElementById("add-today-payment-btn")
    .addEventListener("click", handleQuickAddTodayPayment);

  // Payment form
  document
    .getElementById("payment-form")
    .addEventListener("submit", handlePaymentFormSubmit);
  document
    .getElementById("payment-cancel-edit-btn")
    .addEventListener("click", () => resetPaymentForm());
  document
    .getElementById("day-add-payment-btn")
    .addEventListener("click", () => focusPaymentForm());

  // Note form
  document
    .getElementById("note-form")
    .addEventListener("submit", handleNoteFormSubmit);

  // CSV Export / Import
  document
    .getElementById("export-csv-btn")
    .addEventListener("click", exportCsv);

  document
    .getElementById("import-csv-input")
    .addEventListener("change", handleImportCsvFile);

  document.getElementById("clear-all-btn")
  .addEventListener("click", clearAllData);

}

function changeMonth(delta) {
  state.currentMonth += delta;
  if (state.currentMonth < 0) {
    state.currentMonth = 11;
    state.currentYear -= 1;
  } else if (state.currentMonth > 11) {
    state.currentMonth = 0;
    state.currentYear += 1;
  }
  renderCalendar();
}

function goToToday() {
  const today = new Date();
  state.currentYear = today.getFullYear();
  state.currentMonth = today.getMonth();
  renderCalendar();
}

function handleQuickAddTodayPayment() {
  const today = new Date();
  const dateKey = dateToKey(today);
  state.selectedDate = dateKey;
  openDayModal(dateKey);
  focusPaymentForm();
}

// Util: date helpers
function dateToKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeDateFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatCurrency(amount) {
  if (!isFinite(amount)) return "0.00";
  return "Php "+ amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDisplayDate(key) {
  const date = makeDateFromKey(key);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short"
  });
}

function getMonthName(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long"
  });
}

// Data accessors
function getPaymentsByDateKey(dateKey) {
  return state.payments.filter((p) => p.date === dateKey);
}

function getNotesByDateKey(dateKey) {
  return state.notes.filter((n) => n.date === dateKey);
}

function getMonthPayments(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return state.payments.filter((p) => {
    const d = makeDateFromKey(p.date);
    return d >= start && d <= end;
  });
}

// Calendar generation (weeks starting Monday)
function buildCalendarMatrix(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday index 0
  const daysInMonth = lastOfMonth.getDate();

  const weeks = [];
  let dayCounter = 1 - firstWeekday;

  while (dayCounter <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      if (dayCounter < 1 || dayCounter > daysInMonth) {
        week.push(null);
      } else {
        week.push(new Date(year, month, dayCounter));
      }
      dayCounter++;
    }
    weeks.push(week);
  }
  return weeks;
}

// Rendering
function renderCalendar() {
  const year = state.currentYear;
  const month = state.currentMonth;

  const monthLabel = document.getElementById("current-month-label");
  const monthSummary = document.getElementById("current-month-summary");
  const calendarBody = document.getElementById("calendar-body");
  const monthTotalEl = document.getElementById("month-total-amount");

  monthLabel.textContent = getMonthName(year, month);

  const weeks = buildCalendarMatrix(year, month);
  calendarBody.innerHTML = "";

  let monthTotal = 0;

  weeks.forEach((week) => {
    const tr = document.createElement("tr");
    let weekTotal = 0;

    week.forEach((dateObj) => {
      const td = document.createElement("td");

      if (!dateObj) {
        td.className = "calendar-day empty";
        tr.appendChild(td);
        return;
      }

      const dateKey = dateToKey(dateObj);
      const dayPayments = getPaymentsByDateKey(dateKey);
      const dayNotes = getNotesByDateKey(dateKey);
      const dayTotal = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      weekTotal += dayTotal;
      monthTotal += dayTotal;

      td.className = "calendar-day";

      // Day header
      const dayHeader = document.createElement("div");
      dayHeader.className = "day-header";

      const dayNumber = document.createElement("span");
      dayNumber.className = "day-number";
      dayNumber.textContent = dateObj.getDate();

      const rightIcons = document.createElement("div");

      if (dayNotes.length > 0) {
        const noteIcon = document.createElement("span");
        noteIcon.className = "ms-1 day-has-notes";
        noteIcon.innerHTML =
          '<i class="fa-solid fa-note-sticky"></i>';
        rightIcons.appendChild(noteIcon);
      }

      const plusIcon = document.createElement("button");
      plusIcon.type = "button";
      plusIcon.className = "btn btn-xs btn-link p-0 ms-2 text-muted";
      plusIcon.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
      plusIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        openDayModal(dateKey);
      });
      rightIcons.appendChild(plusIcon);

      dayHeader.appendChild(dayNumber);
      dayHeader.appendChild(rightIcons);

      td.appendChild(dayHeader);

      // Payments list
      const paymentsList = document.createElement("div");
      paymentsList.className = "payments-list";

      dayPayments.forEach((p) => {
        const pill = document.createElement("div");
        pill.className = "payment-pill";
        const label =
          p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name;
        pill.textContent = `${label}: ${formatCurrency(p.amount)}`;
        paymentsList.appendChild(pill);
      });

      td.appendChild(paymentsList);

      // Notes list - show ALL notes (scroll if needed)
      const notesList = document.createElement("div");
      notesList.className = "notes-list";

      dayNotes.forEach((n) => {
        const noteDiv = document.createElement("div");
        noteDiv.className = "note-pill";
        const label =
          n.text.length > 25 ? n.text.slice(0, 25) + "…" : n.text;
        noteDiv.textContent = label;
        notesList.appendChild(noteDiv);
      });

      td.appendChild(notesList);

      // Day total bar
      const dayTotalBar = document.createElement("div");
      dayTotalBar.className = "day-total";

      const leftLabel = document.createElement("span");
      leftLabel.textContent = "Total";

      const rightAmount = document.createElement("span");
      rightAmount.textContent = formatCurrency(dayTotal);

      dayTotalBar.appendChild(leftLabel);
      dayTotalBar.appendChild(rightAmount);
      td.appendChild(dayTotalBar);

      td.addEventListener("click", () => openDayModal(dateKey));

      tr.appendChild(td);
    });

    // Week total cell
    const weekTd = document.createElement("td");
    weekTd.className = "week-total-cell";
    weekTd.textContent = formatCurrency(weekTotal);
    tr.appendChild(weekTd);

    calendarBody.appendChild(tr);
  });

  monthTotalEl.textContent = formatCurrency(monthTotal);

  const monthPayments = getMonthPayments(year, month);
  const countPayments = monthPayments.length;
  monthSummary.textContent =
    countPayments > 0
      ? `${countPayments} payments in this month`
      : "No payments yet this month";
}

// Day modal
function openDayModal(dateKey) {
  state.selectedDate = dateKey;

  const modalTitle = document.getElementById("dayModalLabel");
  const dateLabel = document.getElementById("day-modal-date-label");

  modalTitle.textContent = "Day details";
  dateLabel.textContent = formatDisplayDate(dateKey);

  resetPaymentForm();
  resetNoteForm();
  renderDayDetails(dateKey);

  const modalEl = document.getElementById("dayModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

function renderDayDetails(dateKey) {
  const paymentsTbody = document.getElementById("day-payments-table-body");
  const notesList = document.getElementById("day-notes-list");
  const dayTotalEl = document.getElementById("day-modal-total-amount");

  const payments = getPaymentsByDateKey(dateKey);
  const notes = getNotesByDateKey(dateKey);

  paymentsTbody.innerHTML = "";
  notesList.innerHTML = "";

  let dayTotal = 0;

  payments.forEach((p, idx) => {
    dayTotal += p.amount || 0;

    const tr = document.createElement("tr");

    const tdIndex = document.createElement("td");
    tdIndex.textContent = idx + 1;

    const tdName = document.createElement("td");
    tdName.textContent = p.name;

    const tdAmount = document.createElement("td");
    tdAmount.className = "text-end";
    tdAmount.textContent = formatCurrency(p.amount);

    const tdActions = document.createElement("td");
    tdActions.className = "text-end";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-sm btn-outline-secondary me-1";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEditPayment(p.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-sm btn-outline-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deletePayment(p.id));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdIndex);
    tr.appendChild(tdName);
    tr.appendChild(tdAmount);
    tr.appendChild(tdActions);

    paymentsTbody.appendChild(tr);
  });

  notes.forEach((n) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center py-1";

    const textSpan = document.createElement("span");
    textSpan.textContent = n.text;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-sm btn-outline-danger";
    btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    btn.addEventListener("click", () => deleteNote(n.id));

    li.appendChild(textSpan);
    li.appendChild(btn);

    notesList.appendChild(li);
  });

  dayTotalEl.textContent = formatCurrency(dayTotal);
}

// Payment form helpers
function resetPaymentForm() {
  document.getElementById("payment-id").value = "";
  document.getElementById("payment-name").value = "";
  document.getElementById("payment-amount").value = "";
  document.getElementById("payment-save-btn").textContent = "Save";
}

function focusPaymentForm() {
  document.getElementById("payment-name").focus();
}

function handlePaymentFormSubmit(e) {
  e.preventDefault();
  const dateKey = state.selectedDate;
  if (!dateKey) return;

  const idVal = document.getElementById("payment-id").value;
  const nameVal = document.getElementById("payment-name").value.trim();
  const amountVal = parseFloat(
    document.getElementById("payment-amount").value
  );

  if (!nameVal || !isFinite(amountVal)) {
    return;
  }

  if (idVal) {
    // Edit existing
    const idNum = parseInt(idVal, 10);
    const idx = state.payments.findIndex((p) => p.id === idNum);
    if (idx >= 0) {
      state.payments[idx].name = nameVal;
      state.payments[idx].amount = amountVal;
    }
  } else {
    // New payment
    const newPayment = {
      id: state.nextPaymentId++,
      date: dateKey,
      name: nameVal,
      amount: amountVal
    };
    state.payments.push(newPayment);
  }

  resetPaymentForm();
  renderDayDetails(dateKey);
  renderCalendar();
  saveCsvToStorage(); 
}

function startEditPayment(paymentId) {
  const payment = state.payments.find((p) => p.id === paymentId);
  if (!payment) return;

  document.getElementById("payment-id").value = payment.id;
  document.getElementById("payment-name").value = payment.name;
  document.getElementById("payment-amount").value = payment.amount;
  document.getElementById("payment-save-btn").textContent = "Update";
  focusPaymentForm();
}

function deletePayment(paymentId) {
  const idx = state.payments.findIndex((p) => p.id === paymentId);
  if (idx >= 0) {
    const dateKey = state.payments[idx].date;
    state.payments.splice(idx, 1);
    if (state.selectedDate === dateKey) {
      renderDayDetails(dateKey);
    }
    renderCalendar();
    saveCsvToStorage(); 
  }
}

// Notes handlers
function resetNoteForm() {
  document.getElementById("note-text").value = "";
}

function handleNoteFormSubmit(e) {
  e.preventDefault();
  const dateKey = state.selectedDate;
  if (!dateKey) return;

  const textVal = document.getElementById("note-text").value.trim();
  if (!textVal) return;

  const newNote = {
    id: state.nextNoteId++,
    date: dateKey,
    text: textVal
  };
  state.notes.push(newNote);

  resetNoteForm();
  renderDayDetails(dateKey);
  renderCalendar();
  
  saveCsvToStorage(); 
}

function deleteNote(noteId) {
  const idx = state.notes.findIndex((n) => n.id === noteId);
  if (idx >= 0) {
    const dateKey = state.notes[idx].date;
    state.notes.splice(idx, 1);
    if (state.selectedDate === dateKey) {
      renderDayDetails(dateKey);
    }
    renderCalendar();
    saveCsvToStorage(); 
  }
}
// ---------- CSV helpers ----------
// Simple CSV format with header:
// type,date,name,amount,text
// type = "payment" or "note"
// For payments: name + amount
// For notes: text

function buildCsvString() {
  const lines = [];
  lines.push("type,date,name,amount,text");

  state.payments.forEach((p) => {
    const safeName = (p.name || "").replace(/(\r\n|\n|\r)/g, " ");
    lines.push(
      `payment,${p.date},${escapeCsv(safeName)},${p.amount ?? ""},`
    );
  });

  state.notes.forEach((n) => {
    const safeText = (n.text || "").replace(/(\r\n|\n|\r)/g, " ");
    lines.push(
      `note,${n.date},,,"${escapeCsv(safeText)}"`
    );
  });

  return lines.join("\n");
}

// Very simple CSV escaping: wrap in quotes if contains comma or quote
function escapeCsv(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function parseCsvString(csv) {
  // reset current data
  state.payments = [];
  state.notes = [];
  state.nextPaymentId = 1;
  state.nextNoteId = 1;

  const lines = csv.split(/\r?\n/);
  if (lines.length <= 1) return;

  // naive parser that assumes simple CSV from our own buildCsvString
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // quick split respecting quotes minimally
    const cols = splitCsvLine(line);
    const [type, date, name, amountStr, text] = cols;

    if (type === "payment" && date) {
      const amount = parseFloat(amountStr || "0");
      state.payments.push({
        id: state.nextPaymentId++,
        date,
        name: unquoteCsv(name),
        amount: isFinite(amount) ? amount : 0
      });
    } else if (type === "note" && date) {
      state.notes.push({
        id: state.nextNoteId++,
        date,
        text: unquoteCsv(text)
      });
    }
  }
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' && inQuotes && line[i + 1] === '"') {
      // Escaped quote
      current += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function unquoteCsv(value) {
  if (!value) return "";
  let v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) {
    v = v.slice(1, -1).replace(/""/g, '"');
  }
  return v;
}

// Save to localStorage as CSV string
function saveCsvToStorage() {
  const csv = buildCsvString();
  try {
    localStorage.setItem(STORAGE_KEY, csv);
  } catch (e) {
    console.warn("Unable to save CSV to localStorage", e);
  }
}

// Load from localStorage on page load
function loadFromStoredCsv() {
  try {
    const csv = localStorage.getItem(STORAGE_KEY);
    if (!csv) return;
    parseCsvString(csv);
  } catch (e) {
    console.warn("Unable to load CSV from localStorage", e);
  }
}

// Export: download CSV file
function exportCsv() {
  const csv = buildCsvString();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "payment-planner.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import: read CSV file selected by user
function handleImportCsvFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCsvString(text);
    saveCsvToStorage();
    renderCalendar();

    // If a day modal is open, refresh it
    if (state.selectedDate) {
      renderDayDetails(state.selectedDate);
    }

    // reset input so same file can be imported again if needed
    event.target.value = "";
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm("Clear ALL payments and notes?")) return;

  state.payments = [];
  state.notes = [];
  state.nextPaymentId = 1;
  state.nextNoteId = 1;

  localStorage.removeItem(STORAGE_KEY);

  renderCalendar();

  // If the modal is open, refresh or close it
  if (state.selectedDate) {
    renderDayDetails(state.selectedDate);
  }
}


// Init
document.addEventListener("DOMContentLoaded", init);

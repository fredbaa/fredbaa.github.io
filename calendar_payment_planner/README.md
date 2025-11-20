# 📅 Calendar Payment Planner

A lightweight **HTML + Vanilla JS** web app for tracking recurring payments, expenses, and notes in a clean monthly calendar layout.  
Designed to be fast, simple, and fully offline — **no backend required**.

## 🚀 Features

### 🗓️ Interactive Monthly Calendar
- Full month grid with day-by-day boxes  
- Daily payment list + daily total  
- Weekly total column (highlighted + enlarged)  
- Monthly total footer  
- Click any day to open **Day Details Modal**  
- Month navigation (previous/next month)

### 💸 Payment Tracking
Each payment includes:
- Payment name  
- Payment amount (₱ PHP by default)  
- Automatically contributes to:
  - Daily total  
  - Weekly total  
  - Monthly total  

### 🧾 Notes
- Add unlimited notes to any day  
- All notes appear in the calendar day cell  
- List scrolls if notes overflow  
- Delete notes with a clean remove button

### 📁 CSV Import & Export
- **Export** full dataset to CSV  
- **Import** any CSV following the app’s format  
- Auto-save to browser `localStorage`  
- Auto-load saved CSV on page refresh  

### ✨ Additional Niceties
- Quick “Add Payment for Today” button  
- Font Awesome icons  
- Bootstrap 5 UI  
- Scrollable calendar (horizontal & vertical)  
- Responsive foundation (full mobile version planned)

## 🏗️ Tech Stack

| Component | Tech |
|----------|------|
| UI | **Bootstrap 5** |
| Icons | **Font Awesome 6** |
| Logic | **Vanilla JavaScript** |
| Layout | **HTML + CSS** |
| Storage | **localStorage + CSV** |
| Hosting | Works on any static server (or file://) |

## 📂 Project Structure

```
project/
│── index.html               # Main calendar UI + modals
│── app.js                   # Application logic & state management
│── styles.css               # App styling & responsive rules
│── payment_planner_1000_friendly.csv   # Sample dataset (optional)
│── README.md                # Documentation
```

## 📥 How to Use

### 1. Open the App  
Open `index.html` in any web browser.

### 2. Navigate Months  
Use the **left and right chevron buttons** to go to previous/next month.

### 3. View or Add Payments  
Click any day → Day Modal → Add payment:
- Name  
- Amount (₱)  

### 4. Add Notes  
In the same modal, type a note and press **Add Note**.

### 5. Import CSV  
Use **Import CSV** and choose a file with this structure:

```
type,date,name,amount,text
payment,2025-01-05,Rent - Apartment,18000,
note,2025-01-05,,,Check billing statement
```

### 6. Export CSV  
Click **Export CSV** to download your entire calendar dataset.

### 7. Auto Save  
Everything saves automatically to:
```
localStorage["calendarPaymentPlannerCsv"]
```

### 8. Clear All Data  
Remove storage via your browser OR use a Clear button (if added).

## 🧪 Sample Data Included

`payment_planner_1000_friendly.csv` includes:
- 1,000 rows  
- Realistic bill names (Rent, Netflix, Electricity, Groceries, etc.)  
- Friendly note text  
- Dates spread across all of 2025  
- Amounts between ₱80 and ₱12,000  

## 🔧 Future Enhancements (Roadmap)

- 📱 Full Mobile UI  
- 🎨 Category-based colors  
- 📊 Spend analysis charts  
- 🔎 Filters and search  
- 🌙 Dark mode  
- 📌 Drag-and-drop payments between days  
- ✔ Bill recurrence templates

## 🤝 Contributing / Customizing

Everything is plain HTML, CSS, and JS.  
Modify directly:

- **`styles.css`** → layout + colors  
- **`app.js`** → logic + state handling  
- **`renderCalendar()`** → calendar rendering  
- **`renderDayDetails()`** → modal content  
- **`formatCurrency()`** → currency symbol/format  

No build step. No bundlers. Pure front-end.

## 📝 License

Free for personal or internal use.  
Commercial or open-source publishing is allowed with attribution.

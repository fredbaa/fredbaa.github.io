// Cloud POS System Full JavaScript Implementation

const STORAGE_KEYS = {
  inventory: 'pos_inventory',
  receipts: 'pos_receipts'
};

let currentOrder = {};
let inventory = [];
let receipts = [];
let inventorySort = { key: 'name', asc: true };
let lastReceipt = '';

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', () => {
  loadStorage();
  renderInventory();
  renderInventoryDropdown();
  renderHistory();
  renderChart();
});

// ---------- Storage ----------
function loadStorage() {
  inventory = JSON.parse(localStorage.getItem(STORAGE_KEYS.inventory)) || [];
  receipts = JSON.parse(localStorage.getItem(STORAGE_KEYS.receipts)) || [];
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory));
  localStorage.setItem(STORAGE_KEYS.receipts, JSON.stringify(receipts));
}

// ---------- Inventory ----------
function saveInventoryItem() {
  const name = document.getElementById('invName').value.trim();
  const price = parseFloat(document.getElementById('invPrice').value);
  const stock = parseInt(document.getElementById('invStock').value);

  if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
    showModal('Please fill all inventory fields correctly.');
    return;
  }

  const idx = inventory.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  if (idx !== -1) {
    inventory[idx].price = price;
    inventory[idx].stock += stock;
  } else {
    inventory.push({ name, price, stock });
  }

  saveStorage();
  renderInventory();
  renderInventoryDropdown();

  document.getElementById('invName').value = '';
  document.getElementById('invPrice').value = '';
  document.getElementById('invStock').value = '';

  showModal('Inventory item saved.');
}

function renderInventory() {
  const table = document.querySelector('#inventoryTable tbody');
  table.innerHTML = '';
  const sorted = [...inventory].sort((a, b) => {
    const key = inventorySort.key;
    return (inventorySort.asc ? 1 : -1) * ((a[key] > b[key]) ? 1 : -1);
  });
  for (const item of sorted) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>₱ ${item.price.toFixed(2)}</td>
      <td>${item.stock}</td>
      <td>
        <button class="btn btn-sm btn-outline-success" onclick="promptAdjustStock('${item.name}')">Add Stock</button>
        <button class="btn btn-sm btn-outline-warning" onclick="promptUpdatePrice('${item.name}')">Update Price</button>
      </td>`;
    table.appendChild(tr);
  }
}

function sortInventory(key) {
  inventorySort.asc = (inventorySort.key === key) ? !inventorySort.asc : true;
  inventorySort.key = key;
  renderInventory();
}

// ---------- POS Order ----------
function renderInventoryDropdown() {
  const select = document.getElementById('itemSelect');
  select.innerHTML = '<option value="">-- Select Item --</option>';
  for (const item of inventory) {
    if (item.stock > 0) {
      select.innerHTML += `<option value="${item.name}">${item.name} (Stock: ${item.stock}, Price: ₱ ${item.price.toFixed(2)})</option>`;
    }
  }
}

function addToOrder() {
  const itemName = document.getElementById('itemSelect').value;
  const qty = parseInt(document.getElementById('quantityInput').value);
  if (!itemName || isNaN(qty) || qty <= 0) {
    showModal('Select a valid item and quantity.');
    return;
  }
  const invItem = inventory.find(i => i.name === itemName);
  const existingQty = currentOrder[itemName]?.quantity || 0;
  if (qty + existingQty > invItem.stock) {
    showModal(`Insufficient stock. Only ${invItem.stock - existingQty} remaining.`);
    return;
  }

  currentOrder[itemName] = {
    name: itemName,
    price: invItem.price,
    quantity: existingQty + qty
  };

  renderOrderTable();
}

function renderOrderTable() {
  const tbody = document.querySelector('#orderTable tbody');
  tbody.innerHTML = '';
  let subtotal = 0;
  for (const item of Object.values(currentOrder)) {
    const total = item.quantity * item.price;
    subtotal += total;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td><td>${item.quantity}</td><td>₱ ${item.price.toFixed(2)}</td>
      <td>₱ ${total.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeFromOrder('${item.name}')">Remove</button></td>
    `;
    tbody.appendChild(tr);
  }
  document.getElementById('subtotal').innerText = subtotal.toFixed(2);
}

function removeFromOrder(name) {
  delete currentOrder[name];
  renderOrderTable();
}

function checkout() {
  if (Object.keys(currentOrder).length === 0) {
    showModal('No items in order.');
    return;
  }

  for (const item of Object.values(currentOrder)) {
    const inv = inventory.find(i => i.name === item.name);
    if (!inv || item.quantity > inv.stock) {
      showModal(`Insufficient stock for ${item.name}.`);
      return;
    }
  }

  const timestamp = new Date().toLocaleString();
  let receiptText = `Receipt - ${timestamp}\n`;
  let total = 0;
  for (const item of Object.values(currentOrder)) {
    const itemTotal = item.quantity * item.price;
    total += itemTotal;
    receiptText += `${item.name} x${item.quantity} @ ₱${item.price.toFixed(2)} = ₱${itemTotal.toFixed(2)}\n`;
    const inv = inventory.find(i => i.name === item.name);
    inv.stock -= item.quantity;
  }
  receiptText += `Total: ₱${total.toFixed(2)}\nThank you for your purchase! ✨`;

  receipts.unshift({ timestamp, text: receiptText, total });
  lastReceipt = receiptText;
  saveStorage();
  currentOrder = {};
  renderOrderTable();
  renderInventory();
  renderInventoryDropdown();
  renderHistory();
  renderChart();

  document.getElementById('receiptBox').innerText = receiptText;
  showModal('Checkout successful! Stock updated.');
}

function printReceipt() {
  if (!lastReceipt) {
    showModal('No receipt to print.');
    return;
  }
  const win = window.open('', '_blank');
  win.document.write(`<pre>${lastReceipt}</pre>`);
  win.print();
}

// ---------- History ----------
function renderHistory() {
  const box = document.getElementById('historyBox');
  if (!receipts.length) {
    box.innerText = "No past orders found, let's make some sales! ✨";
    return;
  }
  box.innerHTML = receipts.map(r => `<pre>${r.text}</pre>`).join('<hr>');
}

// ---------- Chart ----------
function renderChart() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  const labels = receipts.map(r => r.timestamp);
  const data = receipts.map(r => r.total);

  if (window.salesChartInstance) {
    window.salesChartInstance.destroy();
  }

  window.salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sales Amount (₱)',
        data,
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => `₱${item.raw.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Date & Time' },
          ticks: { maxRotation: 45, minRotation: 45 },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Sales Amount (₱)' }
        }
      }
    }
  });

  updateSalesMetrics();
}

function updateSalesMetrics() {
  const today = new Date().toLocaleDateString();
  let totalToday = 0;
  let totalOverall = 0;
  let last = receipts[0] || null;

  for (const r of receipts) {
    totalOverall += r.total;
    if (new Date(r.timestamp).toLocaleDateString() === today) {
      totalToday += r.total;
    }
  }

  document.getElementById('totalToday').innerText = `₱ ${totalToday.toFixed(2)}`;
  document.getElementById('totalOverall').innerText = `₱ ${totalOverall.toFixed(2)}`;
  document.getElementById('lastSale').innerText = last ? `${last.timestamp} — ₱ ${last.total.toFixed(2)}` : 'N/A';
}

// ---------- Modal ----------
function showModal(message) {
  document.getElementById('alertModalBody').innerText = message;
  const modal = new bootstrap.Modal(document.getElementById('alertModal'));
  modal.show();
}

function promptAdjustStock(name) {
  const modalHtml = `
    <div class="modal fade" id="inputModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Add Stock for ${name}</h5></div>
          <div class="modal-body">
            <input type="number" id="stockInput" class="form-control" min="1" placeholder="Enter quantity">
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="handleStockInput('${name}')">Confirm</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    </div>`;
  showPromptModal(modalHtml);
}

function handleStockInput(name) {
  const qty = parseInt(document.getElementById('stockInput').value);
  if (isNaN(qty) || qty <= 0) return;
  const item = inventory.find(i => i.name === name);
  if (item) {
    item.stock += qty;
    saveStorage();
    renderInventory();
    renderInventoryDropdown();
    bootstrap.Modal.getInstance(document.getElementById('inputModal')).hide();
  }
}

function promptUpdatePrice(name) {
  const modalHtml = `
    <div class="modal fade" id="inputModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title">Update Price for ${name}</h5></div>
          <div class="modal-body">
            <input type="number" id="priceInput" class="form-control" step="0.01" min="0" placeholder="Enter new price">
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="handlePriceInput('${name}')">Confirm</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    </div>`;
  showPromptModal(modalHtml);
}

function handlePriceInput(name) {
  const newPrice = parseFloat(document.getElementById('priceInput').value);
  if (isNaN(newPrice) || newPrice < 0) return;
  const item = inventory.find(i => i.name === name);
  if (item) {
    item.price = newPrice;
    saveStorage();
    renderInventory();
    renderInventoryDropdown();
    bootstrap.Modal.getInstance(document.getElementById('inputModal')).hide();
  }
}

function showPromptModal(content) {
  const existingModal = document.getElementById('inputModal');
  if (existingModal) {
    existingModal.remove();
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content.trim();
  const modalElement = tempDiv.firstChild;
  document.body.appendChild(modalElement);

  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  modalElement.addEventListener('hidden.bs.modal', () => {
    modalElement.remove();
  });
}


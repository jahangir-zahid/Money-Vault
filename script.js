// hardcoded password
const PASSWORD = "money123";

// DOM references
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const typeSelect = document.getElementById('type');
const nameInput = document.getElementById('name');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('add-btn');
const tableBody = document.querySelector('#records-table tbody');
const totalCollectedSpan = document.getElementById('total-collected');
const totalPaidSpan = document.getElementById('total-paid');
const totalNetSpan = document.getElementById('total-net');

// edit modal elements
const editModal = document.getElementById('edit-modal');
const editType = document.getElementById('edit-type');
const editName = document.getElementById('edit-name');
const editAmount = document.getElementById('edit-amount');
const editDate = document.getElementById('edit-date');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

let currentEditId = null;
const exportBtn = document.getElementById('export-btn');
const clearBtn = document.getElementById('clear-btn');

let records = []; // will hold objects {id,name,amount,date}

// ------- Initialization ------------
loadData();
refreshTable();
updateTotal();

// login logic
loginBtn.addEventListener('click', () => {
    if (passwordInput.value === PASSWORD) {
        showDashboard();
    } else {
        loginError.textContent = 'Wrong password';
        loginError.classList.add('error');
        setTimeout(() => loginError.classList.remove('error'), 500);
    }
});

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

// add record
addBtn.addEventListener('click', () => {
    const type = typeSelect.value; // 'collect' or 'pay'
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    if (!name || isNaN(amount) || !date) return;
    const record = { id: Date.now(), type, name, amount, date };
    records.push(record);
    saveData();
    refreshTable();
    updateTotal(true);
    // clear inputs
    typeSelect.value = 'collect';
    nameInput.value = '';
    amountInput.value = '';
    dateInput.value = '';
});

// refresh table content
function refreshTable() {
    tableBody.innerHTML = '';
    records.forEach(rec => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', rec.id);
        tr.innerHTML = `
            <td>${rec.type === 'collect' ? 'Collect' : 'Pay'}</td>
            <td>${rec.name}</td>
            <td>₹${rec.amount.toFixed(2)}</td>
            <td>${rec.date}</td>
            <td>
                <button class="edit-btn">Edit</button>
                <button class="del-btn">Delete</button>
            </td>`;
        tableBody.appendChild(tr);

        // attach actions after adding to DOM for animation
        tr.querySelector('.edit-btn').addEventListener('click', () => editRecord(rec.id));
        tr.querySelector('.del-btn').addEventListener('click', () => deleteRecord(rec.id));
    });
}

// edit record - show modal and blur background
function editRecord(id) {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    currentEditId = id;
    editType.value = rec.type;
    editName.value = rec.name;
    editAmount.value = rec.amount;
    editDate.value = rec.date;
    showEditModal();
}

function showEditModal() {
    document.querySelector('main').classList.add('blur-background');
    editModal.classList.remove('hidden');
    // focus first field so user can type immediately
    setTimeout(() => editName.focus(), 10);
}
function hideEditModal() {
    document.querySelector('main').classList.remove('blur-background');
    editModal.classList.add('hidden');
    currentEditId = null;
}

saveEditBtn.addEventListener('click', () => {
    const type = editType.value;
    const name = editName.value.trim();
    const amount = parseFloat(editAmount.value);
    const date = editDate.value;
    if (!name || isNaN(amount) || !date) return;
    // update record
    records = records.map(r => r.id === currentEditId ? {...r, type, name, amount, date} : r);
    saveData();
    refreshTable();
    updateTotal(true);
    hideEditModal();
});

cancelEditBtn.addEventListener('click', () => {
    hideEditModal();
});

// delete record
function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    saveData();
    refreshTable();
    updateTotal();
}

// total update with animation option
function updateTotal(animate=false) {
    let collected = 0, paid = 0;
    records.forEach(r => {
        const amt = parseFloat(r.amount) || 0;
        if (r.type === 'collect') collected += amt;
        else paid += amt;
    });
    const net = collected - paid;

    if (animate) {
        const cStart = parseFloat(totalCollectedSpan.textContent) || 0;
        const pStart = parseFloat(totalPaidSpan.textContent) || 0;
        const nStart = parseFloat(totalNetSpan.textContent) || 0;
        animateCounter(cStart, collected, 500, totalCollectedSpan);
        animateCounter(pStart, paid, 500, totalPaidSpan);
        animateCounter(nStart, net, 500, totalNetSpan);
    } else {
        totalCollectedSpan.textContent = collected.toFixed(2);
        totalPaidSpan.textContent = paid.toFixed(2);
        totalNetSpan.textContent = net.toFixed(2);
    }
}

function animateCounter(start, end, duration, element) {
    // Use requestAnimationFrame for smooth, accurate animations (handles floats)
    const startTime = performance.now();
    const change = end - start;
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, Math.max(0, elapsed / duration));
        const value = start + change * progress;
        element.textContent = value.toFixed(2);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// storage
function saveData() {
    localStorage.setItem('moneyRecords', JSON.stringify(records));
}
function loadData() {
    const stored = localStorage.getItem('moneyRecords');
    if (stored) records = JSON.parse(stored);
}

// export csv
exportBtn.addEventListener('click', () => {
    if (records.length === 0) return;
    let csv = 'Type,Name,Amount,Date\n';
    records.forEach(r => {
        csv += `${r.type === 'collect' ? 'Collect' : 'Pay'},${r.name},${r.amount},${r.date}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'records.csv';
    a.click();
    URL.revokeObjectURL(url);
});

// clear all
clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all records?')) return;
    records = [];
    saveData();
    refreshTable();
    updateTotal();
});

// fade-in on load
window.addEventListener('load', () => {
    document.body.style.opacity = 0;
    setTimeout(() => document.body.style.opacity = 1, 50);
});

// simple animation after initial table rows inserted
setTimeout(() => {
    const rows = document.querySelectorAll('#records-table tbody tr');
    rows.forEach((r,i)=>r.style.animationDelay=(i*0.1)+'s');
}, 100);

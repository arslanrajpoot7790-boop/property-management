let labors = JSON.parse(localStorage.getItem('thekedar_labors')) || [];
let owners = JSON.parse(localStorage.getItem('thekedar_owners')) || [];
let malikExpenses = JSON.parse(localStorage.getItem('thekedar_malik_expenses')) || [];
let malikLedger = JSON.parse(localStorage.getItem('thekedar_malik_ledger')) || [];
let supplierRecords = JSON.parse(localStorage.getItem('thekedar_supplier_records')) || [];

labors = labors.map(l => ({ attendance: l.attendance || [], expenses: l.expenses || [], ...l }));

let currentOTP = null;

function showToast(message, icon = 'info', title = '') {
    return Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonText: 'ٹھیک ہے',
        customClass: { popup: 'swal2-popup' }
    });
}

function showConfirm(message, title = 'کیا آپ یقین ہیں؟') {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ہاں',
        cancelButtonText: 'نہیں'
    }).then(result => result.isConfirmed);
}

async function showPrompt(message, inputType = 'text', inputValue = '', placeholder = '') {
    const result = await Swal.fire({
        title: message,
        input: inputType,
        inputValue: inputValue,
        inputPlaceholder: placeholder,
        showCancelButton: true,
        confirmButtonText: 'ٹھیک ہے',
        cancelButtonText: 'منسوخ',
        inputAutoFocus: true
    });
    return result.isConfirmed ? result.value : null;
}

function sendOTP() {
    currentOTP = Math.floor(1000 + Math.random() * 9000).toString();
    showToast("آپ کا نیا لاگ ان او ٹی پی ہے: " + currentOTP, 'success', 'او ٹی پی بھیج دیا گیا');
}

function checkLogin() {
    if (currentOTP === null) {
        showToast("پہلے 'او ٹی پی حاصل کریں' بٹن پر کلک کریں!", 'error');
        return;
    }
    if (document.getElementById('passCode').value === currentOTP) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        updateMazdoorTable();
        updateSummary();
        updateSiteOptions();
        document.getElementById('passCode').value = '';
        currentOTP = null;
        showToast('لاگ ان ہو گیا', 'success');
    } else {
        showToast("غلط او ٹی پی! درست او ٹی پی درج کریں۔", 'error');
    }
}

function updateSummary() {
    let totalAya = 0;
    // Since we only have worker section now, income is 0
    
    let totalKharcha = 0;
    labors.forEach(l => totalKharcha += l.kharcha);

    document.getElementById('sumAya').innerText = totalAya.toLocaleString();
    document.getElementById('sumKharcha').innerText = totalKharcha.toLocaleString();
    document.getElementById('sumBaqaya').innerText = (totalAya - totalKharcha).toLocaleString();
}

function saveData() {
    localStorage.setItem('thekedar_labors', JSON.stringify(labors));
    localStorage.setItem('thekedar_owners', JSON.stringify(owners));
    localStorage.setItem('thekedar_malik_expenses', JSON.stringify(malikExpenses));
    localStorage.setItem('thekedar_malik_ledger', JSON.stringify(malikLedger));
    localStorage.setItem('thekedar_supplier_records', JSON.stringify(supplierRecords));
    updateMazdoorTable();
    updateMalikTable();
    updateMalikLedger();
    updateSupplierTable();
    updateSummary();
    updateSiteOptions();
}

function updateSiteOptions() {
    const siteSelect = document.getElementById('mSite');
    if (!siteSelect) return;
    siteSelect.innerHTML = '<option value="">سائٹ/ٹھیکیدار منتخب کریں</option>';
    owners.forEach(o => {
        siteSelect.innerHTML += `<option value="${o.name}">${o.name}</option>`;
    });
}

function addLabor() {
    const name = document.getElementById('mName').value;
    const rate = document.getElementById('mRate').value;
    const mobile = document.getElementById('mMobile').value;
    const site = document.getElementById('mSite').value;
    const location = document.getElementById('mLocation').value;
    if (!name || !rate) return showToast("تفصیل درج کریں", 'error');
    labors.push({ id: Date.now(), name, rate: parseFloat(rate), mobile: mobile || '', site: site || '', location: location || '', att: 0, kharcha: 0, attendance: [], expenses: [] });
    saveData();
    document.getElementById('mName').value = '';
    document.getElementById('mRate').value = '';
    document.getElementById('mMobile').value = '';
    document.getElementById('mSite').value = '';
    document.getElementById('mLocation').value = '';
}

function exportSectionToPDF(element, fileName) {
    const opt = {
        margin: 0.5,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

function exportCurrentSectionPDF() {
    const section = document.getElementById('mazdoorSection');
    if (!section) return;
    exportSectionToPDF(section, 'mazdoorSection.pdf');
}

function updateMazdoorTable() {
    const list = document.getElementById('mazdoorList');
    const searchTerm = document.getElementById('mSearch').value.toLowerCase();
    list.innerHTML = '';

    let totalUjrat = 0;
    let totalPaid = 0;
    let totalBaqaya = 0;

    labors.filter(l => l.name.toLowerCase().includes(searchTerm)).forEach(l => {
        const baqaya = (l.rate * l.att) - l.kharcha;
        totalUjrat += (l.rate * l.att);
        totalPaid += l.kharcha;
        totalBaqaya += baqaya;

        list.innerHTML += `
        <tr>
            <td><b>${l.name}</b></td>
            <td>${l.rate}</td>
            <td>${l.att}</td>
            <td>${l.site || 'N/A'}</td>
            <td>${l.location || 'N/A'}</td>
            <td style="color: ${baqaya >= 0 ? 'green' : 'red'}; font-weight:bold">${baqaya}</td>
            <td>
                <button class="btn-action" onclick="markAtt(${l.id})" title="حاضری لگائیں">حاضری</button>
                <button class="btn-action" onclick="addLaborExpense(${l.id})" style="background: #f39c12;" title="خرچہ شامل کریں">💰خرچہ</button>
                <button class="btn-action" onclick="showLaborProfile(${l.id})" style="background: #8e44ad;">ڈیٹیل</button>
                <button class="btn-edit" onclick="editLabor(${l.id})">ترمیم</button>
                <button class="btn-danger" onclick="deleteLabor(${l.id})">ڈیلیٹ</button>
            </td>
        </tr>
    `;
    });

    if (document.getElementById('mTotalUjrat')) {
        document.getElementById('mTotalUjrat').innerText = totalUjrat.toLocaleString();
        document.getElementById('mTotalPaid').innerText = totalPaid.toLocaleString();
        document.getElementById('mTotalBaqaya').innerText = totalBaqaya.toLocaleString();
    }
    const weekly = getLaborWeeklyTotals();
    if (document.getElementById('mWeekWages')) {
        document.getElementById('mWeekWages').innerText = weekly.wages.toLocaleString();
    }
    if (document.getElementById('mWeekExpenses')) {
        document.getElementById('mWeekExpenses').innerText = weekly.expenses.toLocaleString();
    }
}

function getLaborWeeklyTotals() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    let wages = 0;
    let expensesTotal = 0;
    labors.forEach(l => {
        l.attendance.forEach(att => {
            const d = new Date(att.date);
            if (d >= weekAgo && d <= today) wages += l.rate;
        });
        l.expenses.forEach(exp => {
            const d = new Date(exp.date);
            if (d >= weekAgo && d <= today) expensesTotal += exp.amount;
        });
    });
    return { wages, expenses: expensesTotal };
}

function getDayName(dateString) {
    const d = new Date(dateString);
    const days = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
    return days[d.getDay()];
}

async function markAtt(id) {
    const today = new Date().toISOString().split('T')[0];
    const dateVal = await showPrompt("حاضری کی تاریخ منتخب کریں", 'date', today, 'تاریخ منتخب کریں');
    if (dateVal === null || dateVal === '') return;
    const l = labors.find(x => x.id === id);
    const dayName = getDayName(dateVal);
    l.attendance.push({ date: dateVal, day: dayName });
    l.att = l.attendance.length;
    saveData();
}

function showAttendanceHistory(id) {
    const l = labors.find(x => x.id === id);
    const historyHtml = l.attendance.length
        ? `<ul style="text-align:right; padding-right:0;">${l.attendance.map(a => `<li>${a.date} - ${a.day}</li>`).join('')}</ul>`
        : '<p>کسی بھی تاریخ پر حاضری موجود نہیں ہے۔</p>';
    Swal.fire({
        title: `حاضری کی تفصیل: ${l.name}`,
        html: historyHtml,
        confirmButtonText: 'ٹھیک ہے',
        customClass: { popup: 'swal2-popup' }
    });
}

async function addLaborExpense(id) {
    const today = new Date().toISOString().split('T')[0];
    const dateVal = await showPrompt("خرچہ کی تاریخ منتخب کریں", 'date', today, 'تاریخ منتخب کریں');
    if (dateVal === null || dateVal === '') return;
    const amount = await showPrompt("کتنا خرچہ ہوا؟", 'number', '', 'رقم درج کریں');
    if (amount === null || amount === '' || isNaN(amount)) return;
    const note = await showPrompt("خرچہ کس لئے ہے؟", 'text', '', 'تفصیل درج کریں');
    const l = labors.find(x => x.id === id);
    const dayName = getDayName(dateVal);
    l.expenses.push({ date: dateVal, day: dayName, amount: parseFloat(amount), note: note || 'N/A' });
    l.kharcha += parseFloat(amount);
    saveData();
}

function showLaborExpenseHistory(id) {
    const l = labors.find(x => x.id === id);
    const historyHtml = l.expenses.length
        ? `<div style="text-align:right; padding-right:0;">
            ${l.expenses.map((e, idx) => `
                <div style="background: #ecf0f1; padding: 10px; margin: 8px 0; border-radius: 5px; border-right: 3px solid #e74c3c;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="deleteExpense(${id}, ${idx})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">حذف کریں</button>
                        <span><b>${e.amount}</b> - ${e.note}</span>
                        <span style="color: #7f8c8d;">${e.date} (${e.day})</span>
                    </div>
                </div>
            `).join('')}
        </div>`
        : '<p>کسی بھی تاریخ پر خرچہ موجود نہیں ہے۔</p>';
    Swal.fire({
        title: `خرچہ کی تفصیل: ${l.name}`,
        html: historyHtml,
        confirmButtonText: 'بند کریں',
        customClass: { popup: 'swal2-popup' }
    });
}

async function deleteExpense(laborId, expenseIndex) {
    if (await showConfirm("کیا آپ یہ خرچہ حذف کرنا چاہتے ہیں؟")) {
        const l = labors.find(x => x.id === laborId);
        const deletedAmount = l.expenses[expenseIndex].amount;
        l.expenses.splice(expenseIndex, 1);
        l.kharcha -= deletedAmount;
        saveData();
        showLaborExpenseHistory(laborId);
    }
}

function showLaborProfile(id) {
    const l = labors.find(x => x.id === id);
    if (!l) return;
    const baqaya = (l.rate * l.att) - l.kharcha;
    const total7days = getLaborWeeklyTotals();
    const profileHtml = `
        <div style="text-align:right; direction:rtl;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${l.name}</h3>
            <table style="width:100%; margin-bottom: 15px; border-collapse: collapse;">
                <tr style="background: #ecf0f1;">
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>موبائل نمبر</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;">${l.mobile || 'درج نہیں'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>سائٹ/ٹھیکیدار</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;">${l.site || 'درج نہیں'}</td>
                </tr>
                <tr style="background: #ecf0f1;">
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>مقام</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;">${l.location || 'درج نہیں'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>روز کی دیہاڑی</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;">${l.rate}</td>
                </tr>
                <tr style="background: #ecf0f1;">
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>کل حاضری</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;">${l.att}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>کل اجرت</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;">${(l.rate * l.att).toLocaleString()}</td>
                </tr>
                <tr style="background: #ecf0f1;">
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>کل خرچہ</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;">${l.kharcha.toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right;"><b>بقایا رقم</b></td>
                    <td style="padding: 8px; border: 1px solid #bdc3c7; text-align:right; color: ${baqaya >= 0 ? 'green' : 'red'}; font-weight: bold;">${baqaya.toLocaleString()}</td>
                </tr>
            </table>
        </div>
    `;
    const whatsappBtn = l.mobile ? `<a href="https://wa.me/${l.mobile}?text=${encodeURIComponent(`سلام ${l.name}، یہ آپ کا کام کا ریکارڈ ہے۔ اجرت: ${l.rate * l.att}، خرچہ: ${l.kharcha}، بقایا: ${baqaya}`)}" target="_blank" class="swal2-styled swal2-default-outline" style="background: #25d366; color: white; border: none; margin-left: 10px;">💬 WhatsApp بھیجیں</a>` : '';
    Swal.fire({
        title: `${l.name} کا مکمل ریکارڈ`,
        html: profileHtml,
        confirmButtonText: 'بند کریں',
        didOpen: function(modal) {
            if (whatsappBtn) {
                const container = modal.querySelector('.swal2-actions');
                container.insertAdjacentHTML('beforeend', whatsappBtn);
            }
            const actionsContainer = modal.querySelector('.swal2-actions');
            
            const expenseBtn = document.createElement('button');
            expenseBtn.textContent = '💰 خرچہ شامل کریں';
            expenseBtn.className = 'swal2-styled swal2-default-outline';
            expenseBtn.style.cssText = 'background: #f39c12; color: white; border: none; margin-left: 10px;';
            expenseBtn.onclick = () => {
                addLaborExpense(id);
                setTimeout(() => showLaborProfile(id), 500);
            };
            actionsContainer.insertAdjacentElement('afterbegin', expenseBtn);
            
            const historyBtn = document.createElement('button');
            historyBtn.textContent = '📋 خرچہ کی تفصیل';
            historyBtn.className = 'swal2-styled swal2-default-outline';
            historyBtn.style.cssText = 'background: #3498db; color: white; border: none; margin-left: 10px;';
            historyBtn.onclick = () => showLaborExpenseHistory(id);
            actionsContainer.insertAdjacentElement('afterbegin', historyBtn);
        },
        customClass: { popup: 'swal2-popup' }
    });
}

async function addKharcha(id) {
    const amount = await showPrompt("کتنا خرچہ (ایڈوانس) دینا ہے؟", 'number', '', 'رقم درج کریں');
    if (amount !== null && amount !== '' && !isNaN(amount)) {
        let l = labors.find(x => x.id === id);
        l.kharcha += parseFloat(amount);
        saveData();
    }
}

async function editLabor(id) {
    const l = labors.find(x => x.id === id);
    const nName = await showPrompt("نام", 'text', l.name, 'نام درج کریں');
    const nMobile = await showPrompt("موبائل نمبر", 'tel', l.mobile, 'موبائل نمبر درج کریں');
    const nSite = await showPrompt("سائٹ/ٹھیکیدار", 'text', l.site || '', 'سائٹ یا ٹھیکیدار درج کریں');
    const nLocation = await showPrompt("مقام", 'text', l.location || '', 'جگہ درج کریں');
    const nR = await showPrompt("نئی دیہاڑی؟", 'number', l.rate, 'نئی دیہاڑی درج کریں');
    const nA = await showPrompt("کل حاضری؟", 'number', l.att, 'حاضری درج کریں');
    const nK = await showPrompt("کل خرچہ؟", 'number', l.kharcha, 'خرچہ درج کریں');
    if (nName !== null && nName !== '') l.name = nName;
    if (nMobile !== null && nMobile !== '') l.mobile = nMobile;
    if (nSite !== null) l.site = nSite;
    if (nLocation !== null) l.location = nLocation;
    if (nR !== null && nR !== '') l.rate = parseFloat(nR);
    if (nA !== null && nA !== '') l.att = parseFloat(nA);
    if (nK !== null && nK !== '') l.kharcha = parseFloat(nK);
    saveData();
}

async function deleteLabor(id) {
    if (await showConfirm("کیا آپ ڈیلیٹ کرنا چاہتے ہیں؟")) {
        labors = labors.filter(x => x.id !== id);
        saveData();
    }
}

function addMalikExpense() {
    const description = document.getElementById('malikDescription').value;
    const amount = document.getElementById('malikAmount').value;
    
    if (!description || !amount) {
        return showToast("تفصیل اور رقم درج کریں", 'error');
    }
    
    const today = new Date().toISOString().split('T')[0];
    malikExpenses.push({
        id: Date.now(),
        date: today,
        description: description,
        amount: parseFloat(amount)
    });
    
    saveData();
    document.getElementById('malikDescription').value = '';
    document.getElementById('malikAmount').value = '';
    showToast("خرچہ شامل ہو گیا", 'success');
}

function updateMalikTable() {
    const list = document.getElementById('malikList');
    const searchTerm = document.getElementById('malikSearch').value.toLowerCase();
    list.innerHTML = '';

    let totalExpense = 0;
    let weekExpense = 0;

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    malikExpenses
        .filter(e => e.description.toLowerCase().includes(searchTerm))
        .forEach(e => {
            totalExpense += e.amount;
            const expDate = new Date(e.date);
            if (expDate >= weekAgo && expDate <= today) {
                weekExpense += e.amount;
            }

            list.innerHTML += `
            <tr>
                <td>${e.date}</td>
                <td><b>${e.description}</b></td>
                <td style="color: #e74c3c; font-weight: bold;">${e.amount.toLocaleString()}</td>
                <td>
                    <button class="btn-edit" onclick="editMalikExpense(${e.id})">ترمیم</button>
                    <button class="btn-danger" onclick="deleteMalikExpense(${e.id})">ڈیلیٹ</button>
                </td>
            </tr>
        `;
        });

    if (document.getElementById('malikTotalExpense')) {
        document.getElementById('malikTotalExpense').innerText = totalExpense.toLocaleString();
    }
    if (document.getElementById('malikWeekExpense')) {
        document.getElementById('malikWeekExpense').innerText = weekExpense.toLocaleString();
    }
}

async function editMalikExpense(id) {
    const expense = malikExpenses.find(x => x.id === id);
    const nDescription = await showPrompt("تفصیل", 'text', expense.description, 'تفصیل درج کریں');
    const nAmount = await showPrompt("رقم", 'number', expense.amount, 'رقم درج کریں');
    
    if (nDescription !== null && nDescription !== '') expense.description = nDescription;
    if (nAmount !== null && nAmount !== '') expense.amount = parseFloat(nAmount);
    
    saveData();
}

async function deleteMalikExpense(id) {
    if (await showConfirm("کیا آپ یہ خرچہ حذف کرنا چاہتے ہیں؟")) {
        malikExpenses = malikExpenses.filter(x => x.id !== id);
        saveData();
    }
}

function exportMalikSectionPDF() {
    const section = document.getElementById('malikSection');
    if (!section) return;
    exportSectionToPDF(section, 'malik-kharcha.pdf');
}

function addMalikInvestment() {
    const amount = document.getElementById('malikInvestAmount').value;
    if (!amount) {
        return showToast("رقم درج کریں", 'error');
    }
    
    const today = new Date().toISOString().split('T')[0];
    malikLedger.push({
        id: Date.now(),
        date: today,
        type: 'investment',
        description: 'رقم ڈالی',
        amount: parseFloat(amount)
    });
    
    saveData();
    document.getElementById('malikInvestAmount').value = '';
    showToast("رقم شامل ہو گی", 'success');
}

function addMalikIncome() {
    const amount = document.getElementById('malikIncomeAmount').value;
    if (!amount) {
        return showToast("رقم درج کریں", 'error');
    }
    
    const today = new Date().toISOString().split('T')[0];
    malikLedger.push({
        id: Date.now(),
        date: today,
        type: 'income',
        description: 'رقم آئی',
        amount: parseFloat(amount)
    });
    
    saveData();
    document.getElementById('malikIncomeAmount').value = '';
    showToast("رقم شامل ہو گی", 'success');
}

function updateMalikLedger() {
    const list = document.getElementById('malikLedgerList');
    list.innerHTML = '';

    let invested = 0;
    let income = 0;
    let expensed = 0;

    malikLedger.forEach(entry => {
        if (entry.type === 'investment') {
            invested += entry.amount;
        } else if (entry.type === 'income') {
            income += entry.amount;
        }
    });

    expensed = malikExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = invested - expensed + income;

    // Display ledger entries
    const allEntries = [
        ...malikLedger.map(e => ({
            date: e.date,
            description: e.description,
            amount: e.amount,
            type: e.type,
            id: e.id,
            category: 'ledger'
        })),
        ...malikExpenses.map(e => ({
            date: e.date,
            description: e.description,
            amount: -e.amount,
            type: 'expense',
            id: e.id,
            category: 'expense'
        }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    allEntries.forEach(entry => {
        const amountColor = entry.amount > 0 ? '#27ae60' : '#e74c3c';
        const amountSign = entry.amount > 0 ? '+' : '';
        
        list.innerHTML += `
        <tr>
            <td>${entry.date}</td>
            <td><b>${entry.description}</b></td>
            <td style="color: ${amountColor}; font-weight: bold;">${amountSign}${entry.amount.toLocaleString()}</td>
            <td>
                ${entry.category === 'ledger' ? `<button class="btn-danger" onclick="deleteLedgerEntry(${entry.id})">ڈیلیٹ</button>` : `<button class="btn-danger" onclick="deleteMalikExpense(${entry.id})">ڈیلیٹ</button>`}
            </td>
        </tr>
    `;
    });

    // Update summary cards
    if (document.getElementById('malikInvested')) {
        document.getElementById('malikInvested').innerText = invested.toLocaleString();
    }
    if (document.getElementById('malikIncome')) {
        document.getElementById('malikIncome').innerText = income.toLocaleString();
    }
    if (document.getElementById('malikExpensed')) {
        document.getElementById('malikExpensed').innerText = expensed.toLocaleString();
    }
    if (document.getElementById('malikBalance')) {
        document.getElementById('malikBalance').innerText = balance.toLocaleString();
        document.getElementById('malikBalance').style.color = balance >= 0 ? '#4caf50' : '#e74c3c';
    }
}

async function deleteLedgerEntry(id) {
    if (await showConfirm("کیا آپ یہ اندراج حذف کرنا چاہتے ہیں؟")) {
        malikLedger = malikLedger.filter(x => x.id !== id);
        saveData();
    }
}

updateSiteOptions();
updateMalikTable();
updateMalikLedger();
updateSupplierTable();

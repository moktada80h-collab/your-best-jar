const monthsNames = [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

let transactions = JSON.parse(localStorage.getItem("savingsTransactions")) || [];
let currentGoal = JSON.parse(localStorage.getItem("savingsGoal")) || null;
let myChart = null;

window.onload = function() {
    loadTheme();
    initChart();
    updateGoalUI();
    updateUI();
};

// --- نظام الوضع الليلي ---
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeToggleBtn').innerText = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeToggleBtn').innerText = '☀️';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggleBtn').innerText = '☀️';
    }
}

// --- نظام أهداف الادخار ---
function setGoal() {
    const name = document.getElementById("goalNameInput").value.trim();
    const amount = parseFloat(document.getElementById("goalAmountInput").value);

    if (!name || isNaN(amount) || amount <= 0) {
        alert("الرجاء إدخال اسم الهدف وسعر صحيح");
        return;
    }

    currentGoal = { name: name, targetAmount: amount };
    localStorage.setItem("savingsGoal", JSON.stringify(currentGoal));
    
    document.getElementById("goalNameInput").value = "";
    document.getElementById("goalAmountInput").value = "";
    updateGoalUI();
}

function resetGoal() {
    currentGoal = null;
    localStorage.removeItem("savingsGoal");
    updateGoalUI();
}

function updateGoalUI() {
    const setupView = document.getElementById("goalSetupView");
    const progressView = document.getElementById("goalProgressView");
    
    if (!currentGoal) {
        setupView.style.display = "block";
        progressView.style.display = "none";
        return;
    }

    setupView.style.display = "none";
    progressView.style.display = "block";

    let totalSavings = transactions.reduce((sum, t) => sum + t.amount, 0);
    let percentage = (totalSavings / currentGoal.targetAmount) * 100;
    if (percentage > 100) percentage = 100;

    document.getElementById("goalTitleText").innerText = `الهدف: ${currentGoal.name} (${totalSavings} / ${currentGoal.targetAmount} د.ت)`;
    document.getElementById("progressBar").style.width = percentage + "%";
    document.getElementById("goalPercentage").innerText = `النسبة المئوية: ${percentage.toFixed(1)}%`;
}

// --- إدارة العمليات والادخار ---
function addSavings() {
    const inputElement = document.getElementById("amountInput");
    const amount = parseFloat(inputElement.value);

    if (isNaN(amount) || amount <= 0) {
        alert("الرجاء إدخال مبلغ صحيح");
        return;
    }

    const currentDate = new Date();
    const transaction = {
        id: Date.now(),
        amount: amount,
        year: currentDate.getFullYear(),
        monthIndex: currentDate.getMonth(),
        date: currentDate.toLocaleDateString('ar-TN')
    };

    transactions.push(transaction);
    saveAndRefresh();
    inputElement.value = "";
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem("savingsTransactions", JSON.stringify(transactions));
    updateUI();
    updateGoalUI();
}

function getActiveMonthsData() {
    if (transactions.length === 0) {
        const now = new Date();
        return { labels: [monthsNames[now.getMonth()]], data: [0] };
    }

    let sortedTransactions = [...transactions].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
    });

    let firstTrans = sortedTransactions[0];
    let startYear = firstTrans.year;
    let startMonth = firstTrans.monthIndex;

    let now = new Date();
    let endYear = now.getFullYear();
    let endMonth = now.getMonth();

    let dataMap = {};
    transactions.forEach(t => {
        let key = `${t.year}-${t.monthIndex}`;
        dataMap[key] = (dataMap[key] || 0) + t.amount;
    });

    let finalLabels = [];
    let finalData = [];
    let tempY = startYear;
    let tempM = startMonth;

    while (tempY < endYear || (tempY === endYear && tempM <= endMonth)) {
        finalLabels.push(`${monthsNames[tempM]}`);
        let key = `${tempY}-${tempM}`;
        finalData.push(dataMap[key] || 0);

        tempM++;
        if (tempM > 11) {
            tempM = 0;
            tempY++;
        }
    }

    return { labels: finalLabels, data: finalData };
}

function updateUI() {
    let totalSavings = transactions.reduce((sum, t) => sum + t.amount, 0);
    document.getElementById("totalAmount").innerText = totalSavings + " د.ت";

    let chartData = getActiveMonthsData();
    myChart.data.labels = chartData.labels;
    myChart.data.datasets[0].data = chartData.data;
    myChart.update();

    const historyContainer = document.getElementById("historyContainer");
    historyContainer.innerHTML = "";

    if (transactions.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 15px;">لا توجد عمليات ادخار حتى الآن</p>';
        return;
    }

    transactions.slice().reverse().forEach(t => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <span><b>${monthsNames[t.monthIndex]} ${t.year}</b>: ${t.amount} د.ت <small>(${t.date})</small></span>
            <button class="delete-btn" onclick="deleteTransaction(${t.id})">حذف</button>
        `;
        historyContainer.appendChild(item);
    });
}

function initChart() {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    let chartData = getActiveMonthsData();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'المبلغ المدخر (د.ت)',
                data: chartData.data,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
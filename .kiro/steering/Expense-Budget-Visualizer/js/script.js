
// ==========================================
// 1. ELEMENT REFERENCES
// ==========================================

const transactionForm = document.getElementById("transactionForm");
const itemNameInput = document.getElementById("itemName");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");

const totalBalance = document.getElementById("totalBalance");
const totalTransactions = document.getElementById("totalTransactions");
const monthlyTotal = document.getElementById("monthlyTotal");

const transactionList = document.getElementById("transactionList");
const expenseChartCanvas = document.getElementById("expenseChart");

const monthFilter = document.getElementById("monthFilter");
const selectedMonthTotal = document.getElementById("selectedMonthTotal");

const sortFilter = document.getElementById("sortFilter");
const categoryFilter = document.getElementById("categoryFilter");
const themeToggle = document.getElementById("themeToggle");

// ==========================================
// 2. APPLICATION DATA
// ==========================================

const STORAGE_KEY = "expenseVisualizerTransactions";
const THEME_KEY = "expenseVisualizerTheme";

let transactions = loadTransactions();
let expenseChart = null;

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

function loadTransactions() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const parsedData = savedData ? JSON.parse(savedData) : [];

        return Array.isArray(parsedData) ? parsedData.filter(item =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.amount === "number" &&
            Number.isFinite(item.amount) &&
            item.amount > 0 &&
            ["Food", "Transport", "Fun"].includes(item.category) &&
            typeof item.date === "string" &&
            !Number.isNaN(new Date(item.date).getTime())
        ) : [];
    } catch (error) {
        console.error("Gagal membaca data transaksi:", error);
        return [];
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.error("Gagal menyimpan transaksi:", error);
        alert("Data gagal disimpan. Periksa penyimpanan browser kamu.");
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getSelectedMonth() {
    return monthFilter.value || getCurrentMonth();
}

function getMonthTransactions(month) {
    return transactions.filter(transaction =>
        transaction.date.slice(0, 7) === month
    );
}

function calculateTotal(items) {
    return items.reduce((total, item) => total + item.amount, 0);
}

// ==========================================
// 4. ADD TRANSACTION
// ==========================================

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = itemNameInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;

    if (!name || !amountInput.value.trim() || !category) {
        alert("Semua kolom wajib diisi!");
        return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
        alert("Nominal harus berupa bilangan bulat lebih dari 0!");
        return;
    }

    const newTransaction = {
        id: crypto.randomUUID(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    };

    transactions.push(newTransaction);

    saveTransactions();
    renderApp();

    transactionForm.reset();
    itemNameInput.focus();
});

// ==========================================
// 5. DELETE TRANSACTION
// ==========================================

function deleteTransaction(id) {
    const confirmed = confirm("Yakin ingin menghapus transaksi ini?");

    if (!confirmed) return;

    transactions = transactions.filter(transaction =>
        transaction.id !== id
    );

    saveTransactions();
    renderApp();
}

// ==========================================
// 6. UPDATE SUMMARY
// ==========================================

function updateSummary() {
    const total = calculateTotal(transactions);
    const currentMonthTransactions = getMonthTransactions(getCurrentMonth());
    const currentMonthTotal = calculateTotal(currentMonthTransactions);

    totalBalance.textContent = formatCurrency(total);
    totalTransactions.textContent = transactions.length;
    monthlyTotal.textContent = formatCurrency(currentMonthTotal);
}

// ==========================================
// 7. MONTHLY SUMMARY
// ==========================================

function updateMonthlySummary() {
    const selectedMonth = getSelectedMonth();
    const monthTransactions = getMonthTransactions(selectedMonth);
    const total = calculateTotal(monthTransactions);

    selectedMonthTotal.textContent = formatCurrency(total);
}

// ==========================================
// 8. DISPLAY TRANSACTION LIST
// ==========================================

function renderTransactions() {
    transactionList.innerHTML = "";

    let filteredTransactions = [...transactions];

    const selectedCategory = categoryFilter.value;

    if (selectedCategory && selectedCategory !== "All") {
        filteredTransactions = filteredTransactions.filter(transaction =>
            transaction.category === selectedCategory
        );
    }

    const sortValue = sortFilter.value;

    if (sortValue === "newest") {
        filteredTransactions.sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );
    } else if (sortValue === "oldest") {
        filteredTransactions.sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    } else if (sortValue === "lowest") {
        filteredTransactions.sort((a, b) => a.amount - b.amount);
    } else if (sortValue === "highest") {
        filteredTransactions.sort((a, b) => b.amount - a.amount);
    }

    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <p>Belum ada transaksi.</p>
                <p>Tambahkan pengeluaran pertamamu!</p>
            </div>
        `;
        return;
    }

    filteredTransactions.forEach(transaction => {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const name = document.createElement("h3");
        name.textContent = transaction.name;

        const date = document.createElement("p");
        date.textContent = new Date(transaction.date).toLocaleDateString(
            "id-ID",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

        const category = document.createElement("span");
        category.className = "transaction-category";
        category.textContent = transaction.category;

        info.append(name, date, category);

        const right = document.createElement("div");
        right.className = "transaction-right";

        const amount = document.createElement("span");
        amount.className = "transaction-amount";
        amount.textContent = formatCurrency(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
            "aria-label",
            `Hapus transaksi ${transaction.name}`
        );

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        right.append(amount, deleteButton);
        item.append(info, right);

        transactionList.appendChild(item);
    });
}

// ==========================================
// 9. SPENDING PIE CHART
// ==========================================

function updateChart() {
    if (typeof Chart === "undefined") {
        console.error("Chart.js belum berhasil dimuat.");
        return;
    }

    const categories = ["Food", "Transport", "Fun"];

    const categoryTotals = categories.map(category => {
        return calculateTotal(
            transactions.filter(transaction =>
                transaction.category === category
            )
        );
    });

    const chartData = {
        labels: categories,
        datasets: [{
            data: categoryTotals,
            backgroundColor: [
                "#6BCB77",
                "#4D96FF",
                "#FFB347"
            ],
            borderColor: [
                "#6BCB77",
                "#4D96FF",
                "#FFB347"
            ],
            borderWidth: 2
        }]
    };

    if (expenseChart) {
        expenseChart.data = chartData;
        expenseChart.update();
    } else {
        expenseChart = new Chart(expenseChartCanvas, {
            type: "pie",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ==========================================
// 10. DARK / LIGHT MODE
// ==========================================

function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");

    themeToggle.textContent = theme === "dark"
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
}

function initializeTheme() {
    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
        console.error("Gagal membaca tema:", error);
    }

    applyTheme(savedTheme);
}

themeToggle.addEventListener("click", function () {
    const isDark = document.body.classList.contains("dark-mode");
    const newTheme = isDark ? "light" : "dark";

    applyTheme(newTheme);

    try {
        localStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
        console.error("Gagal menyimpan tema:", error);
    }
});

// ==========================================
// 11. FILTER EVENTS
// ==========================================

sortFilter.addEventListener("change", renderTransactions);

categoryFilter.addEventListener("change", renderTransactions);

monthFilter.addEventListener("change", updateMonthlySummary);

// ==========================================
// 12. RENDER APPLICATION
// ==========================================

function renderApp() {
    updateSummary();
    updateMonthlySummary();
    renderTransactions();
    updateChart();
}

// ==========================================
// 13. INITIALIZE APPLICATION
// ==========================================

monthFilter.value = getCurrentMonth();

initializeTheme();
renderApp();

console.log("Expense & Budget Visualizer berhasil dijalankan!");

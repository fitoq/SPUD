// ============= PRODUCT DATABASE (5 MENU ITEMS) =============
const products = [
    { id: 1, name: "Chili Mexican", price: 5.99, icon: "🌶️" },
    { id: 2, name: "Bolognese", price: 7.99, icon: "🍝" },
    { id: 3, name: "Carbonara", price: 2.99, icon: "🍝" },
    { id: 4, name: "Chezzy Mac", price: 1.99, icon: "🧀" },
    { id: 5, name: "Baked Beans", price: 2.99, icon: "🥫" }
];

// ============= GLOBAL VARIABLES =============
let cart = [];
let salesHistory = [];
let currentSale = null;
let currentPaymentMethod = null;
let currentCustomerName = null;

// Individual stock limits for each product
let stockLimits = {
    1: { limit: 0, sold: 0, name: "Chili Mexican", icon: "🌶️" },
    2: { limit: 0, sold: 0, name: "Bolognese", icon: "🍝" },
    3: { limit: 0, sold: 0, name: "Carbonara", icon: "🍝" },
    4: { limit: 0, sold: 0, name: "Chezzy Mac", icon: "🧀" },
    5: { limit: 0, sold: 0, name: "Baked Beans", icon: "🥫" }
};

let todayDate = new Date().toISOString().split('T')[0];

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadSalesHistory();
    loadStockLimits();
    renderStockLimitsUI();
    
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebarMenu');
        const menuBtn = document.querySelector('.menu-btn');
        if (sidebar && sidebar.classList.contains('open') && 
            !sidebar.contains(event.target) && 
            !menuBtn.contains(event.target)) {
            toggleMenu();
        }
    });
    
    const customerNameInput = document.getElementById('customerName');
    if (customerNameInput) {
        customerNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (currentPaymentMethod) {
                    proceedToPayment();
                } else {
                    alert('Please select a payment method first!');
                }
            }
        });
    }
});

function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.innerHTML = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
    
    const newTodayDate = new Date().toISOString().split('T')[0];
    if (newTodayDate !== todayDate) {
        resetDailyCounts();
        todayDate = newTodayDate;
    }
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// ============= STOCK LIMITS FUNCTIONS =============
function renderStockLimitsUI() {
    const container = document.getElementById('stockLimitsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const stock = stockLimits[product.id];
        const remaining = stock.limit === 0 ? 'Unlimited' : (stock.limit - stock.sold);
        const remainingNum = stock.limit === 0 ? Infinity : (stock.limit - stock.sold);
        
        let statusClass = 'stock-status-ok';
        let statusText = '✅ In stock';
        
        if (stock.limit > 0) {
            if (remainingNum <= 0) {
                statusClass = 'stock-status-out';
                statusText = '❌ Out of stock';
            } else if (remainingNum <= 5) {
                statusClass = 'stock-status-low';
                statusText = '⚠️ Low stock';
            } else {
                statusText = '✅ In stock';
            }
        }
        
        container.innerHTML += `
            <div class="stock-item">
                <div class="stock-item-info">
                    <span class="stock-item-icon">${product.icon}</span>
                    <span class="stock-item-name">${product.name}</span>
                    <input type="number" class="stock-item-input" id="stock_limit_${product.id}" 
                           placeholder="Limit" value="${stock.limit || ''}" min="0" step="1">
                    <span class="${statusClass}">${statusText}</span>
                </div>
            </div>
            <div style="font-size: 12px; color: #666; margin-top: -8px; margin-bottom: 8px; margin-left: 50px;">
                Sold today: ${stock.sold} | Remaining: ${remaining === 'Unlimited' ? '∞' : remaining}
            </div>
        `;
    });
}

function saveAllStockLimits() {
    products.forEach(product => {
        const limitInput = document.getElementById(`stock_limit_${product.id}`);
        if (limitInput) {
            const limit = parseInt(limitInput.value) || 0;
            stockLimits[product.id].limit = limit;
        }
    });
    
    saveStockLimits();
    renderStockLimitsUI();
    displayProducts();
    alert('All stock limits saved successfully!');
}

function loadStockLimits() {
    const savedLimits = localStorage.getItem(`stockLimits_${todayDate}`);
    if (savedLimits) {
        const parsed = JSON.parse(savedLimits);
        Object.keys(parsed).forEach(id => {
            if (stockLimits[id]) {
                stockLimits[id].limit = parsed[id].limit;
                stockLimits[id].sold = parsed[id].sold;
            }
        });
    } else {
        const yesterdayLimits = localStorage.getItem('stockLimits_persistent');
        if (yesterdayLimits) {
            const parsed = JSON.parse(yesterdayLimits);
            Object.keys(parsed).forEach(id => {
                if (stockLimits[id]) {
                    stockLimits[id].limit = parsed[id].limit;
                }
            });
        }
    }
}

function saveStockLimits() {
    localStorage.setItem(`stockLimits_${todayDate}`, JSON.stringify(stockLimits));
    const persistentLimits = {};
    Object.keys(stockLimits).forEach(id => {
        persistentLimits[id] = { limit: stockLimits[id].limit };
    });
    localStorage.setItem('stockLimits_persistent', JSON.stringify(persistentLimits));
}

function resetDailyCounts() {
    Object.keys(stockLimits).forEach(id => {
        stockLimits[id].sold = 0;
    });
    saveStockLimits();
    renderStockLimitsUI();
    displayProducts();
}

function getRemainingStock(productId) {
    const stock = stockLimits[productId];
    if (stock.limit === 0) return Infinity;
    return stock.limit - stock.sold;
}

function checkStockAvailability(productId, requestedQuantity) {
    const remaining = getRemainingStock(productId);
    const product = products.find(p => p.id === productId);
    
    if (remaining < requestedQuantity) {
        if (remaining <= 0) {
            alert(`❌ ${product.name} is out of stock for today!`);
        } else {
            alert(`⚠️ Only ${remaining} ${product.name}(s) remaining for today!`);
        }
        return false;
    }
    return true;
}

function updateSoldCount(productId, quantity) {
    stockLimits[productId].sold += quantity;
    saveStockLimits();
    renderStockLimitsUI();
    displayProducts();
}

// ============= RESET DAY FUNCTION WITH BACKUP =============
function resetDay() {
    const hasSalesData = Object.keys(stockLimits).some(id => stockLimits[id].sold > 0);
    
    if (hasSalesData) {
        const shouldBackup = confirm('📊 You have sales data for today.\n\nDo you want to EXPORT the current day\'s data to Excel BEFORE resetting?\n\n• Click OK to export then reset\n• Click Cancel to reset without exporting');
        
        if (shouldBackup) {
            const todayStr = new Date().toISOString().split('T')[0];
            exportDailyStockReport(todayStr);
            
            setTimeout(() => {
                confirmResetDay();
            }, 500);
        } else {
            confirmResetDay();
        }
    } else {
        confirmResetDay();
    }
}

function confirmResetDay() {
    if (confirm('⚠️ WARNING: This will reset ALL sold counts for today!\n\nThis action cannot be undone.\n\nAre you sure you want to reset the day?')) {
        Object.keys(stockLimits).forEach(id => {
            stockLimits[id].sold = 0;
        });
        
        saveStockLimits();
        renderStockLimitsUI();
        displayProducts();
        
        alert('✅ Day has been reset!\n\nAll sold counts have been set to 0.\nRemaining stock is now back to full limit.');
    }
}

// ============= PRODUCT DISPLAY =============
function displayProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;
    
    productGrid.innerHTML = products.map(product => {
        const remaining = getRemainingStock(product.id);
        const isOutOfStock = remaining <= 0;
        
        let stockBadge = '';
        let stockDisplay = '';
        
        if (remaining > 0 && remaining < Infinity) {
            stockBadge = `<div class="stock-badge ${remaining <= 5 ? 'low' : ''}">${remaining} left</div>`;
            stockDisplay = `<div class="stock-count">🍽️ ${remaining} remaining</div>`;
        } else if (remaining === 0) {
            stockBadge = `<div class="stock-badge">Out</div>`;
            stockDisplay = `<div class="stock-count out">❌ Out of stock</div>`;
        } else if (remaining === Infinity) {
            stockDisplay = `<div class="stock-count unlimited">∞ Unlimited</div>`;
        }
        
        return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                 onclick="${isOutOfStock ? '' : `addToCart(${product.id})`}">
                ${stockBadge}
                <div class="product-icon">${product.icon}</div>
                <h3>${product.name}</h3>
                <div class="price">RM${product.price.toFixed(2)}</div>
                ${stockDisplay}
            </div>
        `;
    }).join('');
}

// ============= CART FUNCTIONS =============
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const remaining = getRemainingStock(productId);
    const availableToAdd = remaining - currentQuantity;
    
    if (availableToAdd <= 0) {
        const remainingStock = getRemainingStock(productId);
        if (remainingStock <= 0) {
            alert(`❌ ${product.name} is out of stock for today!`);
        } else {
            alert(`⚠️ Only ${remainingStock} ${product.name}(s) remaining. You already have ${currentQuantity} in cart.`);
        }
        return;
    }
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            icon: product.icon
        });
    }
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Cart is empty</div>';
        updateTotals();
        return;
    }
    
    cartContainer.innerHTML = cart.map(item => {
        const remaining = getRemainingStock(item.id);
        const currentInCart = item.quantity;
        const canAddMore = remaining > currentInCart;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.icon} ${item.name}</div>
                    <div class="cart-item-price">RM${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" ${!canAddMore ? 'disabled style="opacity:0.5"' : ''}>+</button>
                    <span class="cart-item-total">RM${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
                </div>
            </div>
        `;
    }).join('');
    
    updateTotals();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        if (change > 0) {
            const remaining = getRemainingStock(productId);
            const currentInCart = item.quantity;
            if (remaining <= currentInCart) {
                const product = products.find(p => p.id === productId);
                alert(`⚠️ Only ${remaining} ${product.name}(s) available. You already have ${currentInCart} in cart.`);
                return;
            }
        }
        
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

function clearCart() {
    if (confirm('Clear entire cart?')) {
        cart = [];
        updateCartDisplay();
    }
}

function updateTotals() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = `RM${total.toFixed(2)}`;
    }
}

// ============= CUSTOMER & PAYMENT METHOD =============
function showCustomerModal() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    currentPaymentMethod = null;
    currentCustomerName = null;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const modalTotal = document.getElementById('customerModalTotal');
    if (modalTotal) modalTotal.textContent = `RM${total.toFixed(2)}`;
    
    const customerNameInput = document.getElementById('customerName');
    if (customerNameInput) {
        customerNameInput.value = '';
        customerNameInput.focus();
    }
    
    const selectedDisplay = document.getElementById('selectedMethodDisplay');
    if (selectedDisplay) selectedDisplay.innerHTML = '';
    
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const continueBtn = document.getElementById('continuePaymentBtn');
    if (continueBtn) continueBtn.style.display = 'none';
    
    const modal = document.getElementById('customerModal');
    if (modal) modal.style.display = 'block';
}

function selectPaymentMethod(method) {
    currentPaymentMethod = method;
    
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const buttons = document.querySelectorAll('.payment-method-btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes(method === 'cash' ? 'Cash' : 'QR')) {
            btn.classList.add('selected');
        }
    });
    
    const selectedDisplay = document.getElementById('selectedMethodDisplay');
    if (selectedDisplay) {
        selectedDisplay.innerHTML = `Selected: ${method === 'cash' ? '💵 Cash' : '📱 QR Code'}`;
    }
    
    const continueBtn = document.getElementById('continuePaymentBtn');
    if (continueBtn) {
        continueBtn.style.display = 'block';
    }
}

function closeCustomerModal() {
    const modal = document.getElementById('customerModal');
    if (modal) modal.style.display = 'none';
}

function proceedToPayment() {
    const customerNameInput = document.getElementById('customerName');
    currentCustomerName = customerNameInput ? customerNameInput.value.trim() : '';
    
    if (!currentCustomerName) {
        alert('Please enter customer name!');
        customerNameInput.focus();
        return;
    }
    
    if (!currentPaymentMethod) {
        alert('Please select a payment method (Cash or QR Code)!');
        return;
    }
    
    closeCustomerModal();
    
    setTimeout(() => {
        if (currentPaymentMethod === 'cash') {
            showPaymentModal();
        } else if (currentPaymentMethod === 'qr') {
            processQRPayment();
        }
    }, 100);
}

// ============= PAYMENT FUNCTIONS =============
function showPaymentModal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const modalTotal = document.getElementById('modalTotal');
    const customerDisplay = document.getElementById('customerNameDisplay');
    const cashReceivedInput = document.getElementById('cashReceived');
    const changeAmount = document.getElementById('changeAmount');
    
    if (modalTotal) modalTotal.textContent = `RM${total.toFixed(2)}`;
    if (customerDisplay) customerDisplay.textContent = currentCustomerName;
    if (cashReceivedInput) cashReceivedInput.value = '';
    if (changeAmount) changeAmount.textContent = 'RM0.00';
    
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'block';
}

function calculateChange() {
    const totalText = document.getElementById('modalTotal');
    const cashReceivedInput = document.getElementById('cashReceived');
    const changeAmount = document.getElementById('changeAmount');
    
    if (!totalText || !cashReceivedInput || !changeAmount) return;
    
    const total = parseFloat(totalText.textContent.replace('RM', ''));
    const cashReceived = parseFloat(cashReceivedInput.value) || 0;
    const change = cashReceived - total;
    changeAmount.textContent = `RM${change.toFixed(2)}`;
}

const cashReceivedField = document.getElementById('cashReceived');
if (cashReceivedField) {
    cashReceivedField.removeEventListener('input', calculateChange);
    cashReceivedField.addEventListener('input', calculateChange);
}

function processCashPayment() {
    const totalText = document.getElementById('modalTotal');
    const cashReceivedInput = document.getElementById('cashReceived');
    
    if (!totalText || !cashReceivedInput) return;
    
    const total = parseFloat(totalText.textContent.replace('RM', ''));
    const cashReceived = parseFloat(cashReceivedInput.value) || 0;
    
    if (cashReceived < total) {
        alert('Insufficient payment!');
        return;
    }
    
    const sale = createSaleObject('Cash', cashReceived);
    currentSale = sale;
    
    closeModal();
    showReceiptDecision(sale);
}

function processQRPayment() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    alert(`📱 QR Code Payment\n\nCustomer: ${currentCustomerName}\nAmount: RM${total.toFixed(2)}\n\nPayment successful!`);
    
    const sale = createSaleObject('QR Code', total);
    currentSale = sale;
    
    showReceiptDecision(sale);
}

function createSaleObject(paymentMethod, amountPaid) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const change = paymentMethod === 'Cash' ? amountPaid - total : 0;
    
    return {
        id: Date.now(),
        date: new Date().toLocaleString(),
        timestamp: new Date().toISOString(),
        customerName: currentCustomerName,
        items: [...cart],
        total: total,
        paymentMethod: paymentMethod,
        amountPaid: amountPaid,
        change: change,
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        itemsDetail: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        }))
    };
}

function showReceiptDecision(sale) {
    const receiptCustomerSpan = document.getElementById('receiptCustomerName');
    if (receiptCustomerSpan) {
        receiptCustomerSpan.textContent = sale.customerName;
    }
    
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'block';
}

function printReceiptAndClose() {
    if (currentSale) {
        printReceipt(currentSale);
        completeSale(currentSale);
    }
    
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

function completeWithoutReceipt() {
    if (currentSale) {
        completeSale(currentSale);
    }
    
    const modal = document.getElementById('receiptModal');
    if (modal) modal.style.display = 'none';
}

function completeSale(sale) {
    sale.items.forEach(item => {
        updateSoldCount(item.id, item.quantity);
    });
    
    salesHistory.unshift(sale);
    saveSalesHistory();
    
    alert(`✅ Sale completed!\n\nCustomer: ${sale.customerName}\nTotal: RM${sale.total.toFixed(2)}\nPayment: ${sale.paymentMethod}`);
    
    cart = [];
    currentSale = null;
    currentCustomerName = null;
    currentPaymentMethod = null;
    updateCartDisplay();
}

function closeModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
}

// ============= RESET SALES HISTORY FUNCTION WITH BACKUP =============
function resetSalesHistory() {
    if (salesHistory.length === 0) {
        alert('📭 Sales history is already empty!');
        return;
    }
    
    const shouldBackup = confirm(`⚠️ You have ${salesHistory.length} sales records.\n\nDo you want to EXPORT all sales data to Excel BEFORE clearing?\n\n• Click OK to export then clear\n• Click Cancel to clear without exporting`);
    
    if (shouldBackup) {
        exportAllSales();
        
        setTimeout(() => {
            confirmResetHistory();
        }, 500);
    } else {
        confirmResetHistory();
    }
}

function confirmResetHistory() {
    if (confirm(`⚠️ WARNING: This will permanently DELETE ALL ${salesHistory.length} sales records!\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to clear all sales history?`)) {
        
        const userInput = prompt('⚠️ FINAL WARNING!\n\nType "DELETE" to confirm clearing all sales history:');
        
        if (userInput === 'DELETE') {
            salesHistory = [];
            saveSalesHistory();
            
            const historyContent = document.getElementById('historyContent');
            if (historyContent) {
                historyContent.innerHTML = '<div style="text-align: center; padding: 60px 20px;">' +
                    '<div style="font-size: 48px; margin-bottom: 20px;">📭</div>' +
                    '<p style="font-size: 16px; color: #666;">No sales history available.</p>' +
                    '<p style="font-size: 14px; color: #999; margin-top: 10px;">Start making sales to see records here.</p>' +
                    '</div>';
            }
            
            alert('✅ Sales history has been cleared successfully!\n\nA backup was saved to your computer before clearing.');
        } else {
            alert('❌ Cancelled. Sales history was NOT cleared.\n\nYou did not type "DELETE" correctly.');
        }
    }
}

// ============= EXPORT FUNCTIONS - IPAD OPTIMIZED =============
function exportToCSV(sales, filename) {
    let csv = "Sale ID,Date,Time,Customer Name,Items Count,Total Amount (RM),Payment Method,Cash Received (RM),Change (RM),Items Detail\n";
    
    sales.forEach(sale => {
        const dateObj = new Date(sale.date);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString();
        const itemsDetail = sale.items.map(item => `${item.name} x${item.quantity}`).join('; ');
        
        csv += `"${sale.id}","${date}","${time}","${sale.customerName}",${sale.itemCount},${sale.total.toFixed(2)},"${sale.paymentMethod}",`;
        csv += sale.paymentMethod === 'Cash' ? `${sale.amountPaid.toFixed(2)},${sale.change.toFixed(2)},` : `0,0,`;
        csv += `"${itemsDetail}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const shareWindow = window.open();
            shareWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Export File</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                        .container { text-align: center; padding: 20px; }
                        button { background: #667eea; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 16px; margin: 10px; cursor: pointer; }
                        a { text-decoration: none; }
                        .info { color: #666; margin-bottom: 20px; font-size: 14px; }
                        .file-name { font-weight: bold; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="info">📄 Your file is ready to save</div>
                        <div class="file-name">${filename}.csv</div>
                        <button onclick="saveFile()">💾 Save to Files</button>
                        <button onclick="shareFile()">📤 Share</button>
                        <script>
                            const csvData = ${JSON.stringify(csv)};
                            const filename = ${JSON.stringify(filename)};
                            
                            function saveFile() {
                                const blob = new Blob([csvData], { type: 'text/csv' });
                                const link = document.createElement('a');
                                const url = URL.createObjectURL(blob);
                                link.href = url;
                                link.download = filename + '.csv';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                                alert('File saved! Check your Downloads folder or Files app.');
                                window.close();
                            }
                            
                            function shareFile() {
                                const blob = new Blob([csvData], { type: 'text/csv' });
                                const file = new File([blob], filename + '.csv', { type: 'text/csv' });
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Export Sales',
                                        files: [file]
                                    }).then(() => window.close());
                                } else {
                                    saveFile();
                                }
                            }
                        <\/script>
                    </div>
                </body>
                </html>
            `);
        };
        reader.readAsDataURL(blob);
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function exportDailyStockReport(date) {
    let csv = "Product Name,Icon,Stock Limit,Sold Today,Remaining,Status\n";
    
    products.forEach(product => {
        const stock = stockLimits[product.id];
        const remaining = stock.limit === 0 ? 'Unlimited' : (stock.limit - stock.sold);
        const status = stock.limit === 0 ? 'Unlimited' : (remaining <= 0 ? 'Out of Stock' : (remaining <= 5 ? 'Low Stock' : 'In Stock'));
        
        csv += `"${product.name}","${product.icon}",${stock.limit === 0 ? 'Unlimited' : stock.limit},${stock.sold},"${remaining}","${status}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const shareWindow = window.open();
            shareWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Export Stock Report</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                        .container { text-align: center; padding: 20px; }
                        button { background: #667eea; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 16px; margin: 10px; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div>📊 stock_report_${date}.csv</div>
                        <button onclick="saveFile()">💾 Save to Files</button>
                        <script>
                            const csvData = ${JSON.stringify(csv)};
                            function saveFile() {
                                const blob = new Blob([csvData], { type: 'text/csv' });
                                const link = document.createElement('a');
                                const url = URL.createObjectURL(blob);
                                link.href = url;
                                link.download = 'stock_report_${date}.csv';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                                alert('File saved!');
                                window.close();
                            }
                        <\/script>
                    </div>
                </body>
                </html>
            `);
        };
        reader.readAsDataURL(blob);
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_report_${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function exportByDate() {
    const selectedDate = document.getElementById('exportDate').value;
    
    if (!selectedDate) {
        alert('Please select a date first!');
        return;
    }
    
    const filteredSales = salesHistory.filter(sale => {
        const saleDate = sale.timestamp ? sale.timestamp.split('T')[0] : new Date(sale.date).toISOString().split('T')[0];
        return saleDate === selectedDate;
    });
    
    if (filteredSales.length === 0) {
        alert(`No sales found for ${selectedDate}`);
        return;
    }
    
    exportToCSV(filteredSales, `sales_${selectedDate}`);
}

function exportAllSales() {
    if (salesHistory.length === 0) {
        alert('No sales to export!');
        return;
    }
    
    exportToCSV(salesHistory, `all_sales_${new Date().toISOString().split('T')[0]}`);
}

function exportSalesHistoryByDateRange() {
    if (salesHistory.length === 0) {
        alert('No sales to export!');
        return;
    }
    
    const startDate = prompt('Enter START date (YYYY-MM-DD) or leave empty for all:', '');
    const endDate = prompt('Enter END date (YYYY-MM-DD) or leave empty for all:', '');
    
    let filteredSales = salesHistory;
    
    if (startDate && endDate) {
        filteredSales = salesHistory.filter(sale => {
            const saleDate = sale.timestamp ? sale.timestamp.split('T')[0] : new Date(sale.date).toISOString().split('T')[0];
            return saleDate >= startDate && saleDate <= endDate;
        });
        
        if (filteredSales.length === 0) {
            alert(`No sales found between ${startDate} and ${endDate}`);
            return;
        }
        
        exportToCSV(filteredSales, `sales_${startDate}_to_${endDate}`);
    } else {
        exportAllSales();
    }
}

// ============= RECEIPT PRINTING =============
function printReceipt(sale) {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt</title>
            <style>
                body { font-family: monospace; padding: 20px; text-align: center; }
                .receipt { max-width: 300px; margin: 0 auto; }
                hr { border-top: 1px dashed #000; }
                .header { font-size: 20px; font-weight: bold; }
                .customer { margin: 10px 0; }
                .items { text-align: left; margin: 15px 0; }
                .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .total { font-weight: bold; margin-top: 10px; font-size: 16px; }
                .payment { margin-top: 10px; }
                @media print {
                    body { margin: 0; padding: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">YOUR STORE NAME</div>
                <div>123 Main Street</div>
                <div>Tel: 555-1234</div>
                <hr>
                <div>Date: ${sale.date}</div>
                <div>Receipt #: ${sale.id}</div>
                <div class="customer">Customer: ${sale.customerName}</div>
                <hr>
                <div class="items">
                    ${sale.items.map(item => `
                        <div class="item">
                            <span>${item.icon} ${item.name} x ${item.quantity}</span>
                            <span>RM${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <hr>
                <div class="item total">
                    <span>TOTAL:</span>
                    <span>RM${sale.total.toFixed(2)}</span>
                </div>
                <div class="payment">
                    <div>Payment: ${sale.paymentMethod}</div>
                    ${sale.paymentMethod === 'Cash' ? `<div>Cash: RM${sale.amountPaid.toFixed(2)}</div>
                    <div>Change: RM${sale.change.toFixed(2)}</div>` : ''}
                </div>
                <hr>
                <div>Thank you ${sale.customerName}!</div>
                <div>Have a great day!</div>
            </div>
            <script>window.print();setTimeout(()=>window.close(),500);<\/script>
        </body>
        </html>
    `);
}

function testPrint() {
    const testSale = {
        date: new Date().toLocaleString(),
        id: 'TEST',
        customerName: 'Test Customer',
        items: [{ icon: '🧪', name: 'Test Item', quantity: 1, price: 0.00 }],
        total: 0.00,
        paymentMethod: 'Test',
        amountPaid: 0.00,
        change: 0.00
    };
    printReceipt(testSale);
}

// ============= SALES HISTORY =============
function saveSalesHistory() {
    localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
}

function loadSalesHistory() {
    const saved = localStorage.getItem('salesHistory');
    if (saved) {
        salesHistory = JSON.parse(saved);
    }
}

function showSalesHistory() {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    
    if (salesHistory.length === 0) {
        historyContent.innerHTML = '<p style="text-align: center; padding: 40px;">No sales yet.</p>';
    } else {
        historyContent.innerHTML = salesHistory.map(sale => `
            <div style="border:1px solid #ddd; margin-bottom:15px; padding:15px; border-radius:8px;">
                <strong>Sale #${sale.id}</strong><br>
                Customer: ${sale.customerName}<br>
                Date: ${sale.date}<br>
                Items: ${sale.itemCount} items<br>
                Total: RM${sale.total.toFixed(2)}<br>
                Payment: ${sale.paymentMethod}<br>
                <button onclick="reprintSale(${sale.id})" style="margin-top:10px; padding:5px 10px; background:#667eea; color:white; border:none; border-radius:5px; cursor:pointer;">Reprint Receipt</button>
            </div>
        `).join('');
    }
    
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'block';
}

function reprintSale(saleId) {
    const sale = salesHistory.find(s => s.id === saleId);
    if (sale) {
        printReceipt(sale);
    }
}

function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'none';
}

// ============= CHANGE PRICE FUNCTION =============
function changeProductPrice(productId, newPrice) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const oldPrice = product.price;
        product.price = newPrice;
        alert(`${product.name} price changed from RM${oldPrice} to RM${newPrice}`);
        displayProducts();
        
        cart.forEach(item => {
            if (item.id === productId) {
                item.price = newPrice;
            }
        });
        updateCartDisplay();
    }
}

// ============= GLOBAL EXPORTS =============
window.changeProductPrice = changeProductPrice;
window.selectPaymentMethod = selectPaymentMethod;
window.proceedToPayment = proceedToPayment;
window.showCustomerModal = showCustomerModal;
window.closeCustomerModal = closeCustomerModal;
window.processCashPayment = processCashPayment;
window.processQRPayment = processQRPayment;
window.printReceiptAndClose = printReceiptAndClose;
window.completeWithoutReceipt = completeWithoutReceipt;
window.showSalesHistory = showSalesHistory;
window.closeHistoryModal = closeHistoryModal;
window.reprintSale = reprintSale;
window.exportByDate = exportByDate;
window.exportAllSales = exportAllSales;
window.exportDailyStockReport = exportDailyStockReport;
window.exportSalesHistoryByDateRange = exportSalesHistoryByDateRange;
window.testPrint = testPrint;
window.toggleMenu = toggleMenu;
window.saveAllStockLimits = saveAllStockLimits;
window.resetDay = resetDay;
window.resetSalesHistory = resetSalesHistory;
window.clearCart = clearCart;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.closeModal = closeModal;
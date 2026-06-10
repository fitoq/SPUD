// ============= PRODUCT DATABASE (5 MENU ITEMS WITH NEW PRICES) =============
const products = [
    { id: 1, name: "Chili Mexican", price: 15, icon: "🌶️" },
    { id: 2, name: "Bolognese", price: 16, icon: "🍝" },
    { id: 3, name: "Carbonara", price: 17, icon: "🍝" },
    { id: 4, name: "Chezzy Mac", price: 18, icon: "🧀" },
    { id: 5, name: "Baked Beans", price: 13, icon: "🥫" }
];

// ============= GLOBAL VARIABLES =============
let cart = [];
let salesHistory = [];
let currentSale = null;
let currentPaymentMethod = null;
let currentCustomerName = null;

// Individual stock limits with availability checkbox
let stockLimits = {
    1: { limit: 10, sold: 0, available: true, name: "Chili Mexican", icon: "🌶️" },
    2: { limit: 10, sold: 0, available: true, name: "Bolognese", icon: "🍝" },
    3: { limit: 10, sold: 0, available: true, name: "Carbonara", icon: "🍝" },
    4: { limit: 10, sold: 0, available: true, name: "Chezzy Mac", icon: "🧀" },
    5: { limit: 10, sold: 0, available: true, name: "Baked Beans", icon: "🥫" }
};

let todayDate = new Date().toISOString().split('T')[0];
let receiptCounter = 1;

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    loadStockLimits();
    loadSalesHistory();
    displayProducts();
    renderStockLimitsUI();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebarMenu');
        const menuBtn = document.querySelector('.menu-btn');
        if (sidebar && sidebar.classList.contains('open') && 
            !sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            toggleMenu();
        }
    });
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
    if (sidebar) sidebar.classList.toggle('open');
}

// ============= STOCK LIMITS UI WITH CHECKBOX THAT DISABLES ADD STOCK =============
function renderStockLimitsUI() {
    const container = document.getElementById('stockLimitsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const stock = stockLimits[product.id];
        const remaining = stock.available ? (stock.limit - stock.sold) : 0;
        
        container.innerHTML += `
            <div class="stock-item">
                <div class="stock-item-info">
                    <span class="stock-item-icon">${product.icon}</span>
                    <span class="stock-item-name">${product.name}</span>
                    <input type="checkbox" class="stock-checkbox" id="available_${product.id}" 
                           ${stock.available ? 'checked' : ''} onchange="toggleAvailability(${product.id})">
                    <input type="number" class="stock-item-input" id="stock_limit_${product.id}" 
                           placeholder="Limit" value="${stock.limit}" min="0" step="1" 
                           ${!stock.available ? 'disabled' : ''}>
                    <button class="add-stock-btn" id="addStockBtn_${product.id}" 
                            onclick="showAddStockModal(${product.id})" 
                            ${!stock.available ? 'disabled' : ''}>
                        ➕ Add Stock
                    </button>
                    <span class="stock-status ${!stock.available ? 'unavailable' : ''}">
                        ${stock.available ? (remaining <= 0 ? '❌ Out' : (remaining <= 5 ? '⚠️ Low' : '✅ In stock')) : '🚫 Unavailable'}
                    </span>
                </div>
            </div>
            <div style="font-size: 12px; color: #666; margin-top: -8px; margin-bottom: 8px; margin-left: 50px;">
                Sold today: ${stock.sold} | Remaining: ${stock.available ? (stock.limit - stock.sold) : 'N/A'}
            </div>
        `;
    });
}

function toggleAvailability(productId) {
    const checkbox = document.getElementById(`available_${productId}`);
    const limitInput = document.getElementById(`stock_limit_${productId}`);
    const addStockBtn = document.getElementById(`addStockBtn_${productId}`);
    
    stockLimits[productId].available = checkbox.checked;
    
    if (limitInput) {
        limitInput.disabled = !checkbox.checked;
    }
    
    // Disable Add Stock button when unchecked
    if (addStockBtn) {
        addStockBtn.disabled = !checkbox.checked;
    }
    
    saveStockLimits();
    renderStockLimitsUI();
    displayProducts();
}

function saveAllStockLimits() {
    products.forEach(product => {
        const limitInput = document.getElementById(`stock_limit_${product.id}`);
        if (limitInput && !limitInput.disabled) {
            const limit = parseInt(limitInput.value) || 0;
            stockLimits[product.id].limit = limit;
        }
    });
    
    saveStockLimits();
    renderStockLimitsUI();
    displayProducts();
    alert('All stock limits saved successfully!');
}

// ============= ADD STOCK MODAL FUNCTIONS =============
let currentStockProductId = null;

function showAddStockModal(productId) {
    // Check if product is available before allowing add stock
    if (!stockLimits[productId].available) {
        alert('This item is currently unavailable. Please check the box first to enable stock addition.');
        return;
    }
    
    currentStockProductId = productId;
    const product = products.find(p => p.id === productId);
    const stock = stockLimits[productId];
    
    document.getElementById('addStockProductName').innerHTML = `${product.icon} ${product.name}`;
    document.getElementById('currentLimit').textContent = stock.limit;
    document.getElementById('addStockAmount').value = '';
    document.getElementById('addStockModal').style.display = 'block';
}

function closeAddStockModal() {
    document.getElementById('addStockModal').style.display = 'none';
    currentStockProductId = null;
}

function confirmAddStock() {
    if (!currentStockProductId) return;
    
    const amount = parseInt(document.getElementById('addStockAmount').value);
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount!');
        return;
    }
    
    const currentLimit = stockLimits[currentStockProductId].limit;
    const newLimit = currentLimit + amount;
    stockLimits[currentStockProductId].limit = newLimit;
    
    saveStockLimits();
    renderStockLimitsUI();
    displayProducts();
    
    const productName = products.find(p => p.id === currentStockProductId).name;
    alert(`✅ Added ${amount} more ${productName}!\n\nNew limit: ${newLimit}`);
    
    closeAddStockModal();
}

function loadStockLimits() {
    const savedLimits = localStorage.getItem(`stockLimits_${todayDate}`);
    if (savedLimits) {
        const parsed = JSON.parse(savedLimits);
        Object.keys(parsed).forEach(id => {
            if (stockLimits[id]) {
                stockLimits[id].limit = parsed[id].limit;
                stockLimits[id].sold = parsed[id].sold;
                stockLimits[id].available = parsed[id].available !== undefined ? parsed[id].available : true;
            }
        });
    } else {
        const savedPersistent = localStorage.getItem('stockLimits_persistent');
        if (savedPersistent) {
            const parsed = JSON.parse(savedPersistent);
            Object.keys(parsed).forEach(id => {
                if (stockLimits[id]) {
                    stockLimits[id].limit = parsed[id].limit;
                    stockLimits[id].available = parsed[id].available !== undefined ? parsed[id].available : true;
                }
            });
        }
    }
}

function saveStockLimits() {
    localStorage.setItem(`stockLimits_${todayDate}`, JSON.stringify(stockLimits));
    const persistentLimits = {};
    Object.keys(stockLimits).forEach(id => {
        persistentLimits[id] = { limit: stockLimits[id].limit, available: stockLimits[id].available };
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
    if (!stock.available) return 0;
    if (stock.limit === 0) return Infinity;
    return stock.limit - stock.sold;
}

function checkStockAvailability(productId, requestedQuantity) {
    const remaining = getRemainingStock(productId);
    const product = products.find(p => p.id === productId);
    
    if (!stockLimits[productId].available) {
        alert(`❌ ${product.name} is not available today!`);
        return false;
    }
    
    if (remaining < requestedQuantity) {
        if (remaining <= 0) {
            alert(`❌ ${product.name} is out of stock for today!`);
        } else {
            alert(`⚠️ Only ${remaining} ${product.name}(s) remaining!`);
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

// ============= RESET DAY FUNCTION =============
function resetDay() {
    if (confirm('⚠️ WARNING: This will reset ALL sold counts to 0 for today!\n\nAre you sure?')) {
        Object.keys(stockLimits).forEach(id => {
            stockLimits[id].sold = 0;
        });
        saveStockLimits();
        renderStockLimitsUI();
        displayProducts();
        alert('✅ Day has been reset! All sold counts are now 0.');
    }
}

// ============= PRODUCT DISPLAY =============
function displayProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;
    
    productGrid.innerHTML = products.map(product => {
        const remaining = getRemainingStock(product.id);
        const isUnavailable = !stockLimits[product.id].available || remaining <= 0;
        
        let stockBadge = '';
        if (stockLimits[product.id].available && remaining > 0 && remaining < Infinity) {
            stockBadge = `<div class="stock-badge">${remaining} left</div>`;
        } else if (!stockLimits[product.id].available) {
            stockBadge = `<div class="stock-badge">Not Available</div>`;
        } else if (remaining === 0) {
            stockBadge = `<div class="stock-badge">Out</div>`;
        }
        
        return `
            <div class="product-card ${isUnavailable ? 'unavailable' : ''}" 
                 onclick="${isUnavailable ? '' : `showAddOnModal(${product.id})`}">
                ${stockBadge}
                <div class="product-icon">${product.icon}</div>
                <h3>${product.name}</h3>
                <div class="price">RM${product.price.toFixed(2)}</div>
            </div>
        `;
    }).join('');
}

// ============= ADD-ON MODAL =============
let currentAddOnProduct = null;

function showAddOnModal(productId) {
    currentAddOnProduct = products.find(p => p.id === productId);
    document.getElementById('addOnProductName').textContent = `${currentAddOnProduct.icon} ${currentAddOnProduct.name} - RM${currentAddOnProduct.price.toFixed(2)}`;
    document.getElementById('extraCheese').checked = false;
    document.getElementById('extraMeat').checked = false;
    document.getElementById('addOnModal').style.display = 'block';
}

function closeAddOnModal() {
    document.getElementById('addOnModal').style.display = 'none';
    currentAddOnProduct = null;
}

function confirmAddToCart() {
    if (!currentAddOnProduct) return;
    
    const extraCheese = document.getElementById('extraCheese').checked;
    const extraMeat = document.getElementById('extraMeat').checked;
    
    const existingItem = cart.find(item => 
        item.id === currentAddOnProduct.id && 
        item.extraCheese === extraCheese && 
        item.extraMeat === extraMeat
    );
    
    let addOnCost = 0;
    let addOnNames = [];
    if (extraCheese) {
        addOnCost += 2;
        addOnNames.push("Extra Cheese");
    }
    if (extraMeat) {
        addOnCost += 2;
        addOnNames.push("Extra Meat");
    }
    
    const totalPrice = currentAddOnProduct.price + addOnCost;
    
    if (existingItem) {
        if (checkStockAvailability(currentAddOnProduct.id, 1)) {
            existingItem.quantity++;
        } else {
            closeAddOnModal();
            return;
        }
    } else {
        if (checkStockAvailability(currentAddOnProduct.id, 1)) {
            cart.push({
                id: currentAddOnProduct.id,
                name: currentAddOnProduct.name,
                basePrice: currentAddOnProduct.price,
                price: totalPrice,
                quantity: 1,
                icon: currentAddOnProduct.icon,
                extraCheese: extraCheese,
                extraMeat: extraMeat,
                addOns: addOnNames,
                addOnCost: addOnCost
            });
        } else {
            closeAddOnModal();
            return;
        }
    }
    
    updateCartDisplay();
    closeAddOnModal();
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Cart is empty</div>';
        updateTotals();
        return;
    }
    
    cartContainer.innerHTML = cart.map((item, index) => {
        const addOnsText = item.addOns.length > 0 ? ` + ${item.addOns.join(' + ')}` : '';
        const addOnsDisplay = item.addOns.length > 0 ? `<div class="cart-item-addons">➕ ${item.addOns.join(' + ')} (+RM${item.addOnCost.toFixed(2)})</div>` : '';
        
        return `
            <div class="cart-item">
                <div class="cart-item-main">
                    <div class="cart-item-name">${item.icon} ${item.name}${addOnsText}</div>
                    <div class="cart-item-price">RM${item.price.toFixed(2)} each</div>
                </div>
                ${addOnsDisplay}
                <div class="cart-item-controls">
                    <button onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)">+</button>
                    <span class="cart-item-total">RM${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-item" onclick="removeFromCart(${index})">✕</button>
                </div>
            </div>
        `;
    }).join('');
    
    updateTotals();
}

function updateQuantity(index, change) {
    if (change > 0) {
        const item = cart[index];
        if (!checkStockAvailability(item.id, 1)) return;
        cart[index].quantity++;
    } else {
        cart[index].quantity--;
        if (cart[index].quantity <= 0) {
            removeFromCart(index);
            return;
        }
    }
    updateCartDisplay();
}

function removeFromCart(index) {
    cart.splice(index, 1);
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
    if (totalElement) totalElement.textContent = `RM${total.toFixed(2)}`;
}

// ============= CUSTOMER & PAYMENT =============
function showCustomerModal() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    currentPaymentMethod = null;
    currentCustomerName = null;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('customerModalTotal').textContent = `RM${total.toFixed(2)}`;
    document.getElementById('customerName').value = '';
    document.getElementById('selectedMethodDisplay').innerHTML = '';
    document.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('continuePaymentBtn').style.display = 'none';
    document.getElementById('customerModal').style.display = 'block';
}

function selectPaymentMethod(method) {
    currentPaymentMethod = method;
    document.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    document.getElementById('selectedMethodDisplay').innerHTML = `Selected: ${method === 'cash' ? '💵 Cash' : '📱 QR Code'}`;
    document.getElementById('continuePaymentBtn').style.display = 'block';
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

function proceedToPayment() {
    currentCustomerName = document.getElementById('customerName').value.trim();
    if (!currentCustomerName) {
        alert('Please enter customer name!');
        return;
    }
    if (!currentPaymentMethod) {
        alert('Please select a payment method!');
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

function showPaymentModal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('modalTotal').textContent = `RM${total.toFixed(2)}`;
    document.getElementById('customerNameDisplay').textContent = currentCustomerName;
    document.getElementById('cashReceived').value = '';
    document.getElementById('changeAmount').textContent = 'RM0.00';
    document.getElementById('paymentModal').style.display = 'block';
}

function calculateChange() {
    const total = parseFloat(document.getElementById('modalTotal').textContent.replace('RM', ''));
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    const change = cashReceived - total;
    document.getElementById('changeAmount').textContent = `RM${change.toFixed(2)}`;
}

document.getElementById('cashReceived')?.addEventListener('input', calculateChange);

function processCashPayment() {
    const total = parseFloat(document.getElementById('modalTotal').textContent.replace('RM', ''));
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
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
    alert(`📱 QR Code Payment\nCustomer: ${currentCustomerName}\nAmount: RM${total.toFixed(2)}\n\nPayment successful!`);
    const sale = createSaleObject('QR Code', total);
    currentSale = sale;
    showReceiptDecision(sale);
}

function createSaleObject(paymentMethod, amountPaid) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const change = paymentMethod === 'Cash' ? amountPaid - total : 0;
    const saleNumber = receiptCounter;
    receiptCounter++;
    localStorage.setItem('receiptCounter', receiptCounter);
    
    return {
        id: saleNumber,
        date: new Date().toLocaleString(),
        timestamp: new Date().toISOString(),
        customerName: currentCustomerName,
        items: [...cart],
        total: total,
        paymentMethod: paymentMethod,
        amountPaid: amountPaid,
        change: change,
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
}

function showReceiptDecision(sale) {
    document.getElementById('receiptCustomerName').textContent = sale.customerName;
    document.getElementById('receiptModal').style.display = 'block';
}

function printReceiptAndClose() {
    if (currentSale) {
        printReceipt(currentSale);
        completeSale(currentSale);
    }
    document.getElementById('receiptModal').style.display = 'none';
}

function completeWithoutReceipt() {
    if (currentSale) {
        completeSale(currentSale);
    }
    document.getElementById('receiptModal').style.display = 'none';
}

function completeSale(sale) {
    sale.items.forEach(item => {
        updateSoldCount(item.id, item.quantity);
    });
    salesHistory.unshift(sale);
    saveSalesHistory();
    alert(`✅ Sale completed!\nCustomer: ${sale.customerName}\nTotal: RM${sale.total.toFixed(2)}`);
    cart = [];
    currentSale = null;
    updateCartDisplay();
}

function closeModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// ============= RECEIPT PRINTING (SPUD POTATO) =============
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
                .header { font-size: 22px; font-weight: bold; }
                .subheader { font-size: 14px; margin: 5px 0; }
                .items { text-align: left; margin: 15px 0; }
                .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .addon { font-size: 11px; color: #666; margin-left: 15px; }
                .total { font-weight: bold; margin-top: 10px; font-size: 16px; }
                .payment { margin-top: 10px; }
                @media print {
                    body { margin: 0; padding: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">🥔 SPUD POTATO</div>
                <div class="subheader">@spudpotatokuantan</div>
                <hr>
                <div>Date: ${sale.date}</div>
                <div>Receipt #: ${sale.id}</div>
                <div class="customer">Customer: ${sale.customerName}</div>
                <hr>
                <div class="items">
                    ${sale.items.map(item => `
                        <div>
                            <div class="item">
                                <span>${item.icon} ${item.name} x ${item.quantity}</span>
                                <span>RM${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            ${item.addOns && item.addOns.length > 0 ? `<div class="addon">  + ${item.addOns.join(' + ')}</div>` : ''}
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
                <div>⭐ Follow us @spudpotatokuantan</div>
            </div>
            <script>window.print();setTimeout(()=>window.close(),500);<\/script>
        </body>
        </html>
    `);
}

function testPrint() {
    const testSale = {
        date: new Date().toLocaleString(),
        id: receiptCounter,
        customerName: 'Test Customer',
        items: [{ icon: '🥔', name: 'Test Item', quantity: 1, price: 0.00, addOns: [] }],
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
    localStorage.setItem('receiptCounter', receiptCounter);
}

function loadSalesHistory() {
    const saved = localStorage.getItem('salesHistory');
    if (saved) salesHistory = JSON.parse(saved);
    const savedCounter = localStorage.getItem('receiptCounter');
    if (savedCounter) receiptCounter = parseInt(savedCounter);
}

function showSalesHistory() {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    
    if (salesHistory.length === 0) {
        historyContent.innerHTML = '<p style="text-align: center; padding: 40px;">No sales yet.</p>';
    } else {
        historyContent.innerHTML = salesHistory.map(sale => `
            <div>
                <strong>Sale #${sale.id}</strong><br>
                Customer: ${sale.customerName}<br>
                Date: ${sale.date}<br>
                Items: ${sale.itemCount} items<br>
                Total: RM${sale.total.toFixed(2)}<br>
                Payment: ${sale.paymentMethod}<br>
                <button onclick="reprintSale(${sale.id})" style="margin-top:10px; padding:8px 16px; background:#DAA520; color:white; border:none; border-radius:12px; cursor:pointer; font-family:Poppins; font-weight:500;">Reprint Receipt</button>
            </div>
        `).join('');
    }
    document.getElementById('historyModal').style.display = 'block';
}

function reprintSale(saleId) {
    const sale = salesHistory.find(s => s.id === saleId);
    if (sale) printReceipt(sale);
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

function resetSalesHistory() {
    if (salesHistory.length === 0) {
        alert('No sales to clear!');
        return;
    }
    if (confirm(`Delete ALL ${salesHistory.length} sales records? This cannot be undone!`)) {
        salesHistory = [];
        saveSalesHistory();
        showSalesHistory();
        alert('Sales history cleared!');
    }
}

// ============= EXPORT FUNCTIONS =============
function exportToCSV(sales, filename) {
    let csv = "Sale ID,Date,Time,Customer Name,Items,Total (RM),Payment Method\n";
    sales.forEach(sale => {
        const dateObj = new Date(sale.date);
        const itemsDetail = sale.items.map(item => `${item.name} x${item.quantity}${item.addOns && item.addOns.length ? ` (${item.addOns.join('+')})` : ''}`).join('; ');
        csv += `${sale.id},${dateObj.toLocaleDateString()},${dateObj.toLocaleTimeString()},"${sale.customerName}","${itemsDetail}",${sale.total.toFixed(2)},"${sale.paymentMethod}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`Exported ${sales.length} sales!`);
}

function exportDailyStockReport(date) {
    let csv = "Product Name,Stock Limit,Sold Today,Remaining,Available\n";
    products.forEach(product => {
        const stock = stockLimits[product.id];
        const remaining = stock.available ? (stock.limit - stock.sold) : 'N/A';
        csv += `"${product.name}",${stock.limit},${stock.sold},"${remaining}",${stock.available ? 'Yes' : 'No'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_report_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Stock report exported!');
}

function exportByDate() {
    const selectedDate = document.getElementById('exportDate').value;
    if (!selectedDate) {
        alert('Select a date first!');
        return;
    }
    const filteredSales = salesHistory.filter(sale => {
        const saleDate = sale.timestamp ? sale.timestamp.split('T')[0] : new Date(sale.date).toISOString().split('T')[0];
        return saleDate === selectedDate;
    });
    if (filteredSales.length === 0) {
        alert(`No sales for ${selectedDate}`);
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

// ============= GLOBAL FUNCTIONS =============
window.toggleMenu = toggleMenu;
window.saveAllStockLimits = saveAllStockLimits;
window.resetDay = resetDay;
window.resetSalesHistory = resetSalesHistory;
window.showCustomerModal = showCustomerModal;
window.selectPaymentMethod = selectPaymentMethod;
window.closeCustomerModal = closeCustomerModal;
window.proceedToPayment = proceedToPayment;
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
window.testPrint = testPrint;
window.clearCart = clearCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.closeModal = closeModal;
window.closeAddOnModal = closeAddOnModal;
window.showAddOnModal = showAddOnModal;
window.confirmAddToCart = confirmAddToCart;
window.toggleAvailability = toggleAvailability;
window.showAddStockModal = showAddStockModal;
window.closeAddStockModal = closeAddStockModal;
window.confirmAddStock = confirmAddStock;
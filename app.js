// ============= PRODUCT DATABASE =============
const products = [
    { id: 1, name: "Cheeseburger", price: 5.99, category: "Food", icon: "🍔" },
    { id: 2, name: "French Fries", price: 2.99, category: "Food", icon: "🍟" },
    { id: 3, name: "Chicken Wings", price: 7.99, category: "Food", icon: "🍗" },
    { id: 4, name: "Caesar Salad", price: 6.99, category: "Food", icon: "🥗" },
    { id: 5, name: "Coca Cola", price: 1.99, category: "Drink", icon: "🥤" },
    { id: 6, name: "Iced Tea", price: 1.99, category: "Drink", icon: "🧋" },
    { id: 7, name: "Coffee", price: 2.49, category: "Drink", icon: "☕" },
    { id: 8, name: "Orange Juice", price: 2.99, category: "Drink", icon: "🧃" },
    { id: 9, name: "Potato Chips", price: 1.49, category: "Snack", icon: "🥔" },
    { id: 10, name: "Cookies", price: 1.99, category: "Snack", icon: "🍪" },
    { id: 11, name: "Ice Cream", price: 2.99, category: "Snack", icon: "🍦" },
    { id: 12, name: "Brownie", price: 2.49, category: "Snack", icon: "🍫" }
];

// ============= GLOBAL VARIABLES =============
let cart = [];
let currentCategory = "all";
let salesHistory = [];

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadSalesHistory();
});

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDate').innerHTML = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
}

// ============= PRODUCT DISPLAY =============
function displayProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(product => {
        const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="addToCart(${product.id})">
            <div style="font-size: 32px;">${product.icon}</div>
            <h3>${product.name}</h3>
            <div class="price">$${product.price.toFixed(2)}</div>
        </div>
    `).join('');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', displayProducts);

// Category filter
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.category;
        displayProducts();
    });
});

// ============= CART FUNCTIONS =============
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
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
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Cart is empty</div>';
        updateTotals();
        return;
    }
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.icon} ${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="cart-item-quantity">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
                <span class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
            </div>
        </div>
    `).join('');
    
    updateTotals();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10; // 10% tax
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// ============= CHANGE PRICE FUNCTION =============
function changeProductPrice(productId, newPrice) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const oldPrice = product.price;
        product.price = newPrice;
        alert(`${product.name} price changed from $${oldPrice} to $${newPrice}`);
        displayProducts(); // Refresh display
        
        // Update prices in cart if needed
        cart.forEach(item => {
            if (item.id === productId) {
                item.price = newPrice;
            }
        });
        updateCartDisplay();
    }
}

// ============= SALES & PAYMENT =============
function showPaymentModal() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.10;
    document.getElementById('modalTotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('paymentModal').style.display = 'block';
    document.getElementById('cashReceived').value = '';
    document.getElementById('changeAmount').textContent = '$0.00';
}

function calculateChange() {
    const total = parseFloat(document.getElementById('modalTotal').textContent.replace('$', ''));
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    const change = cashReceived - total;
    document.getElementById('changeAmount').textContent = `$${change.toFixed(2)}`;
}

document.getElementById('cashReceived').addEventListener('input', calculateChange);

function completeSale() {
    const total = parseFloat(document.getElementById('modalTotal').textContent.replace('$', ''));
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    
    if (cashReceived < total) {
        alert('Insufficient payment!');
        return;
    }
    
    const sale = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        items: [...cart],
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        tax: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.10,
        total: total,
        payment: cashReceived,
        change: cashReceived - total
    };
    
    salesHistory.unshift(sale);
    saveSalesHistory();
    printReceipt(sale);
    
    alert('Sale completed successfully!');
    closeModal();
    cart = [];
    updateCartDisplay();
}

function closeModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// ============= RECEIPT PRINTING =============
function printReceipt(sale = null) {
    if (!sale && cart.length === 0) {
        alert('No sale to print!');
        return;
    }
    
    const currentSale = sale || {
        date: new Date().toLocaleString(),
        items: cart,
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        tax: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.10,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.10
    };
    
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
                .items { text-align: left; margin: 15px 0; }
                .item { display: flex; justify-content: space-between; }
                .total { font-weight: bold; margin-top: 10px; }
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
                <div>Date: ${currentSale.date}</div>
                <hr>
                <div class="items">
                    ${currentSale.items.map(item => `
                        <div class="item">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <hr>
                <div class="item"><span>Subtotal:</span><span>$${currentSale.subtotal.toFixed(2)}</span></div>
                <div class="item"><span>Tax (10%):</span><span>$${currentSale.tax.toFixed(2)}</span></div>
                <div class="item total"><span>TOTAL:</span><span>$${currentSale.total.toFixed(2)}</span></div>
                <hr>
                <div>Thank you for your business!</div>
                <div>Have a great day!</div>
            </div>
            <script>window.print();setTimeout(()=>window.close(),500);<\/script>
        </body>
        </html>
    `);
}

// ============= SALES HISTORY & STORAGE =============
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
    if (salesHistory.length === 0) {
        document.getElementById('historyContent').innerHTML = '<p>No sales yet.</p>';
    } else {
        document.getElementById('historyContent').innerHTML = salesHistory.map(sale => `
            <div style="border:1px solid #ddd; margin-bottom:15px; padding:15px; border-radius:8px;">
                <strong>Sale #${sale.id}</strong><br>
                Date: ${sale.date}<br>
                Items: ${sale.items.length}<br>
                Total: $${sale.total.toFixed(2)}<br>
                <button onclick="reprintSale(${sale.id})" style="margin-top:10px; padding:5px 10px;">Reprint Receipt</button>
            </div>
        `).join('');
    }
    document.getElementById('historyModal').style.display = 'block';
}

function reprintSale(saleId) {
    const sale = salesHistory.find(s => s.id === saleId);
    if (sale) {
        printReceipt(sale);
    }
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

// ============= EXPORT FUNCTIONS =============
function exportToCSV() {
    if (salesHistory.length === 0) {
        alert('No sales to export!');
        return;
    }
    
    let csv = "Sale ID,Date,Items,Subtotal,Tax,Total\n";
    salesHistory.forEach(sale => {
        csv += `${sale.id},${sale.date},${sale.items.length},${sale.subtotal.toFixed(2)},${sale.tax.toFixed(2)},${sale.total.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Sales exported to CSV! Open in Excel.');
}

// ============= ADD PRODUCT (ADMIN FUNCTION) =============
function addNewProduct(name, price, category, icon) {
    const newId = Math.max(...products.map(p => p.id)) + 1;
    products.push({ id: newId, name, price, category, icon });
    displayProducts();
    alert(`Product "${name}" added!`);
}

// ============= QUICK PRICE CHANGE (Example: hold product card) =============
// To change price, you can add this to console or create admin panel
window.changeProductPrice = changeProductPrice;
window.addNewProduct = addNewProduct;
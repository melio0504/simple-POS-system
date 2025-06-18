document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    if (document.querySelector('.pos-container')) {
        initPOSPage();
    } else if (document.querySelector('.inventory-container')) {
        initInventoryPage();
    }

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    const timeStr = now.toLocaleTimeString(undefined, timeOptions);
    
    if (document.getElementById('current-date')) {
        document.getElementById('current-date').textContent = dateStr;
        document.getElementById('current-time').textContent = timeStr;
    }
    
    if (document.getElementById('inventory-date')) {
        document.getElementById('inventory-date').textContent = dateStr;
        document.getElementById('inventory-time').textContent = timeStr;
    }
}

function initPOSPage() {
    const cart = [];
    let products = [];
    
    const productList = document.getElementById('product-list');
    const cartItems = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    const changeEl = document.getElementById('change');
    const discountInput = document.getElementById('discount');
    const cashInput = document.getElementById('cash');
    const clearCartBtn = document.getElementById('clear-cart');
    const checkoutBtn = document.getElementById('checkout');
    const productSearch = document.getElementById('product-search');
    const searchBtn = document.getElementById('search-btn');
    const receiptModal = document.getElementById('receipt-modal');
    const receiptContent = document.getElementById('receipt-content');
    const printReceiptBtn = document.getElementById('print-receipt');
    
    fetchProducts();
    
    clearCartBtn.addEventListener('click', clearCart);
    checkoutBtn.addEventListener('click', processCheckout);
    discountInput.addEventListener('input', updateTotals);
    cashInput.addEventListener('input', updateTotals);
    searchBtn.addEventListener('click', searchProducts);
    productSearch.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') searchProducts();
    });
    printReceiptBtn.addEventListener('click', printReceipt);
    
    function fetchProducts() {
        fetch('php/pos_actions.php?action=get_products')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                products = data;
                displayProducts(products);
                
                if (data.length === 0) {
                    console.warn('No products returned from server');
                }
            })
            .catch(error => {
                console.error('Error loading products:', error);
                productList.innerHTML = '<p class="error">Error loading products. Please try again.</p>';
            });
    }
    
    function displayProducts(productsToDisplay) {
        productList.innerHTML = '';
        
        if (!productsToDisplay || productsToDisplay.length === 0) {
            productList.innerHTML = '<p class="empty-products">No products available</p>';
            return;
        }
        
        productsToDisplay.forEach(product => {
            if (!product.id || !product.name || !product.price) {
                console.error('Invalid product data:', product);
                return;
            }
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            productCard.innerHTML = `
                <h4>${product.name}</h4>
                <p>$${Number(product.price).toFixed(2)}</p>
                <small>Qty: ${product.quantity}</small>
            `;
            
            if (product.quantity <= 0) {
                productCard.classList.add('out-of-stock');
                productCard.innerHTML += '<span class="stock-label">Out of Stock</span>';
            } else {
                productCard.addEventListener('click', () => addToCart(product));
                productCard.style.cursor = 'pointer';
            }
            
            productList.appendChild(productCard);
        });
    }
    
    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1
            });
        }
        updateCartDisplay();
    }
    
    function updateCartDisplay() {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            return;
        }
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <div>$${item.price.toFixed(2)} x ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="decrease-btn" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                    <span>${item.quantity}</span>
                    <button class="increase-btn" data-id="${item.id}"><i class="fas fa-plus"></i></button>
                    <button class="remove-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
        });
        
        document.querySelectorAll('.decrease-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                decreaseQuantity(productId);
            });
        });
        
        document.querySelectorAll('.increase-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                increaseQuantity(productId);
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                removeFromCart(productId);
            });
        });

        updateTotals();
    }
    
    function decreaseQuantity(productId) {
        const item = cart.find(item => item.id === productId);
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            removeFromCart(productId);
        }
        updateCartDisplay();
        updateTotals();
    }
    
    function increaseQuantity(productId) {
        const item = cart.find(item => item.id === productId);
        const product = products.find(p => p.id === productId);
        
        if (item.quantity < product.quantity) {
            item.quantity++;
        } else {
            alert(`Only ${product.quantity} items available in stock`);
        }
        
        updateCartDisplay();
        updateTotals();
    }
    
    function removeFromCart(productId) {
        const index = cart.findIndex(item => item.id === productId);
        if (index !== -1) {
            cart.splice(index, 1);
        }
        updateCartDisplay();
        updateTotals();
    }
    
    function clearCart() {
        cart.length = 0;
        updateCartDisplay();
        updateTotals();
        discountInput.value = 0;
        cashInput.value = '';
    }
    
    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = parseFloat(discountInput.value) || 0;
        const discountAmount = subtotal * (discount / 100);
        const total = subtotal - discountAmount;
        const cash = parseFloat(cashInput.value) || 0;
        const change = cash - total;
        
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        totalEl.textContent = `$${total.toFixed(2)}`;
        changeEl.textContent = `$${change >= 0 ? change.toFixed(2) : '0.00'}`;
        
        if (change < 0) {
            changeEl.style.color = 'red';
        } else {
            changeEl.style.color = 'inherit';
        }
    }
    
    function searchProducts() {
        const searchTerm = productSearch.value.toLowerCase();
        if (searchTerm === '') {
            displayProducts(products);
        } else {
            const filteredProducts = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm)
            );
            displayProducts(filteredProducts);
        }
    }
    
    function processCheckout() {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        const customerName = document.getElementById('customer-name').value;
        const customerId = document.getElementById('customer-id').value;
        const saleType = document.getElementById('sale-type').value;
        const discount = parseFloat(discountInput.value) || 0;
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal - (subtotal * (discount / 100));
        const cash = parseFloat(cashInput.value) || 0;
        
        if (cash < total) {
            alert('Insufficient cash amount');
            return;
        }
        
        const saleData = {
            customer_name: customerName,
            customer_id: customerId,
            sale_type: saleType,
            subtotal: subtotal,
            discount: discount,
            total: total,
            cash: cash,
            change_amount: cash - total,
            items: cart
        };
        
        fetch('php/pos_actions.php?action=process_sale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                generateReceipt(data.sale_id, saleData);
                clearCart();
                fetchProducts();
            } else {
                alert('Error processing sale: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error processing sale');
        });
    }
    
    function generateReceipt(saleId, saleData) {
        const now = new Date();
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        receiptContent.innerHTML = `
            <div class="receipt-header">
                <h2>XYZ STORE</h2>
                <p>123 Main Street, City</p>
                <p>Tel: (123) 456-7890</p>
            </div>
            
            <div class="receipt-details">
                <p><strong>Receipt #:</strong> ${saleId.toString().padStart(6, '0')}</p>
                <p><strong>Date:</strong> ${now.toLocaleDateString(undefined, dateOptions)} ${now.toLocaleTimeString(undefined, timeOptions)}</p>
                <p><strong>Customer:</strong> ${saleData.customer_name || 'N/A'}</p>
                <p><strong>ID:</strong> ${saleData.customer_id || 'N/A'}</p>
                <p><strong>Type:</strong> ${saleData.sale_type.charAt(0).toUpperCase() + saleData.sale_type.slice(1)}</p>
            </div>
            
            <table class="receipt-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${saleData.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="receipt-totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>$${saleData.subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Discount (${saleData.discount}%):</span>
                    <span>$${(saleData.subtotal * (saleData.discount / 100)).toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Total:</span>
                    <span>$${saleData.total.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Cash:</span>
                    <span>$${saleData.cash.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Change:</span>
                    <span>$${saleData.change_amount.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>Thank you for shopping with us!</p>
                <p>Please come again</p>
            </div>
        `;
        
        receiptModal.style.display = 'block';
    }
    
    function printReceipt() {
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; }
                        .receipt { width: 80mm; margin: 0 auto; padding: 10px; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 3px 0; }
                        .border-top { border-top: 1px dashed #000; }
                        .border-bottom { border-bottom: 1px dashed #000; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        ${receiptContent.innerHTML.replace(/class="[^"]*"/g, '').replace(/<div/g, '<div class="text-center"').replace(/<span/g, '<span class="text-right"')}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 100);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    function showLowStockNotification(lowStockProducts) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3><i class="fas fa-exclamation-triangle"></i> Low Stock Alert</h3>
                <ul>
                    ${lowStockProducts.map(product => `
                        <li>${product.name} - Only ${product.quantity} left</li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
}

function initInventoryPage() {
    let products = [];
    
    const inventoryBody = document.getElementById('inventory-body');
    const lowStockItems = document.getElementById('low-stock-items');
    const addProductBtn = document.getElementById('add-product');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    
    fetchInventory();
    
    addProductBtn.addEventListener('click', () => {
        productModal.style.display = 'block';
    });
    
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewProduct();
    });
    
    function fetchInventory() {
        fetch('php/inventory_actions.php?action=get_inventory')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                products = data;
                displayInventory(data);
                checkLowStock(data);
            })
            .catch(error => {
                console.error('Error fetching inventory:', error);
                alert('Error loading inventory data');
            });
    }
    
    function displayInventory(inventoryData) {
        inventoryBody.innerHTML = '';
        
        if (inventoryData.length === 0) {
            inventoryBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No products found</td>
                </tr>
            `;
            return;
        }
        
        inventoryData.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${Number(product.price).toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>${product.quantity > 0 ? '<span class="in-stock">Yes</span>' : '<span class="out-of-stock">No</span>'}</td>
                <td>${product.sold}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            inventoryBody.appendChild(row);
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                editProduct(productId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this product?')) {
                    deleteProduct(productId);
                }
            });
        });
    }
    
    function checkLowStock(inventoryData) {
        const lowStock = inventoryData.filter(product => product.quantity < 3);
        lowStockItems.innerHTML = '';
        
        if (lowStock.length === 0) {
            document.getElementById('low-stock-alert').style.display = 'none';
            return;
        }
        
        document.getElementById('low-stock-alert').style.display = 'block';
        
        lowStock.forEach(product => {
            const item = document.createElement('div');
            item.className = 'low-stock-item';
            item.innerHTML = `
                <span>${product.name} (ID: ${product.id})</span>
                <span>Only ${product.quantity} left</span>
            `;
            lowStockItems.appendChild(item);
        });
    }
    
    function addNewProduct() {
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const quantity = parseInt(document.getElementById('product-quantity').value);
        
        if (!name || isNaN(price) || isNaN(quantity)) {
            alert('Please fill all fields with valid values');
            return;
        }
        
        const productData = {
            name: name,
            price: price,
            quantity: quantity
        };
        
        fetch('php/inventory_actions.php?action=add_product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                productModal.style.display = 'none';
                productForm.reset();
                
                fetchInventory();
                
                alert('Product added successfully!');
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding product: ' + error.message);
        });
    }
    
    function editProduct(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-quantity').value = product.quantity;
        
        productForm.dataset.editId = productId;
        productForm.querySelector('button').textContent = 'Update Product';
        productForm.querySelector('button').className = 'btn btn-primary';
        
        productModal.style.display = 'block';
    }
    
    function deleteProduct(productId) {
        fetch('php/inventory_actions.php?action=delete_product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: productId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchInventory();
            } else {
                alert('Error deleting product: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting product');
        });
    }
}
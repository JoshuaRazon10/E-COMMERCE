const cartCount = document.getElementById('cart-count');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const productsGrid = document.getElementById('products-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');

// New UI Elements
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const clearCartBtn = document.getElementById('clear-cart-btn');
const promoInput = document.getElementById('promo-input');
const applyPromoBtn = document.getElementById('apply-promo-btn');
const toastContainer = document.getElementById('toast-container');
const themeToggleBtn = document.getElementById('theme-toggle');
const checkoutBtn = document.getElementById('checkout-btn');

// Checkout Modal Elements
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutModalBtn = document.getElementById('close-checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const checkoutModalTotal = document.getElementById('checkout-modal-total');

let cart = [];
let products = [];
let currentDiscount = 0;

// 1. Initialize products catalog
async function fetchProducts() {
    try {
        const res = await fetch('/api/products?t=' + new Date().getTime());
        products = await res.json();
        
        populateCategories(products);
        renderProducts(products);
    } catch (err) {
        productsGrid.innerHTML = '<div class="loader">Failed to load Next-Gen Gear. Please verify server is running.</div>';
        console.error(err);
    }
}

// 2. Populate Category Filter dynamically
function populateCategories(items) {
    const categories = [...new Set(items.map(p => p.category))];
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.innerText = cat;
        categoryFilter.appendChild(option);
    });
}

// 3. Render Product UI Grid
function renderProducts(productsToRender) {
    productsGrid.innerHTML = '';
    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">No products found.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img class="product-image" src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/400x400/0d0d12/9d4edd?text=No+Available+Image'" onclick="viewProductDetails(${product.id})">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
            </div>
            <div class="product-footer">
                <span class="price">$${product.price.toFixed(2)}</span>
                <button class="glow-btn add-to-cart" data-id="${product.id}">Add</button>
            </div>
        `;
        productsGrid.appendChild(card);
    });

    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            addToCart(id, e.target);
        });
    });
}

// 4. Filter by Category
function filterProductsByCategory(category, itemsToFilter = products) {
    if (!category) return itemsToFilter;
    return itemsToFilter.filter(p => p.category === category);
}

// 5. Sort Products
function sortProducts(criteria, itemsToSort = products) {
    const sorted = [...itemsToSort];
    if (criteria === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (criteria === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (criteria === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
}

// Orchestrator for Search, Filter, and Sort (Handles Search implicit Function 6)
function applyFiltersAndSort() {
    let result = products;
    
    // 6. Search Functionality
    const query = searchInput.value.toLowerCase();
    if (query) {
        result = result.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    
    // Apply Category Filter
    result = filterProductsByCategory(categoryFilter.value, result);
    // Apply Sort
    result = sortProducts(sortSelect.value, result);
    
    renderProducts(result);
}

// 7. Add to Cart
function addToCart(productId, btnElement) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Visual cue
    if (btnElement) {
        btnElement.innerHTML = 'Added!';
        btnElement.style.borderColor = 'var(--accent-glow-secondary)';
        btnElement.style.boxShadow = '0 0 15px var(--accent-glow-secondary)';
        setTimeout(() => {
            btnElement.innerHTML = 'Add';
            btnElement.style.borderColor = 'var(--glass-border)';
            btnElement.style.boxShadow = 'none';
        }, 1000);
    }

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    showToast('Success', `${product.name} added to cart!`, 'success');
    updateCartUI();
}

// 8. Remove specific item
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    showToast('Removed', 'Item removed from cart.', 'info');
    updateCartUI();
}

// 9. Change specific item quantity
function changeQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
        }
    }
}

// 10. Clear Cart completely
function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    currentDiscount = 0;
    promoInput.value = '';
    showToast('Cart Cleared', 'All items have been removed.', 'info');
    updateCartUI();
}

// 11. Apply Promo Code Logic
function applyPromoCode() {
    const code = promoInput.value.trim().toUpperCase();
    if (code === 'RAZON20') {
        currentDiscount = 0.20;
        showToast('Promo Applied', '20% discount applied!', 'success');
    } else if (code) {
        currentDiscount = 0;
        showToast('Invalid Code', 'The promo code entered is invalid.', 'error');
    } else {
        currentDiscount = 0;
    }
    updateCartUI();
}

// General UI Update routine
function updateCartUI() {
    // Top nav Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;

    // Cart Sidebar UI
    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align:center; margin-top: 20px;">Your cart is empty.</p>';
        cartTotalEl.innerHTML = `<div>Total: $0.00</div>`;
        return;
    }

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/0d0d12/9d4edd?text=Err'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="quantity-controls">
                    <button class="qty-btn minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="remove-item" data-id="${item.id}">&times;</button>
        `;
        cartItemsContainer.appendChild(div);
    });

    // Delegated listeners for Cart Operations
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => removeFromCart(parseInt(e.target.dataset.id)));
    });
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', (e) => changeQuantity(parseInt(e.target.dataset.id), -1));
    });
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', (e) => changeQuantity(parseInt(e.target.dataset.id), 1));
    });

    // Subtotal and Total calculations
    const discountAmount = subtotal * currentDiscount;
    const finalTotal = subtotal - discountAmount;
    
    let totalHTML = `
        <div style="font-size:1rem;font-weight:400;color:var(--text-secondary);margin-bottom:5px;">Subtotal: $${subtotal.toFixed(2)}</div>
        ${currentDiscount > 0 ? `<div style="font-size:1rem;font-weight:400;color:var(--accent-glow-secondary);margin-bottom:5px;">Discount: -$${discountAmount.toFixed(2)}</div>` : ''}
        <div>Total: $${finalTotal.toFixed(2)}</div>
    `;
    cartTotalEl.innerHTML = totalHTML;
}

// 12. Process Checkout - Show Modal
function processCheckout() {
    if (cart.length === 0) {
        showToast('Empty Cart', 'Add items before checking out.', 'error');
        return;
    }
    
    // Calculate total for modal
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = subtotal * (1 - currentDiscount);
    checkoutModalTotal.innerText = `$${finalTotal.toFixed(2)}`;
    
    toggleCart(); // Close sidebar
    checkoutModal.classList.remove('hidden');
}

// 12b. Handle Final Order Placement
async function handleOrderSubmission(e) {
    e.preventDefault();
    
    const placeOrderBtn = document.getElementById('place-order-btn');
    const originalBtnText = placeOrderBtn.innerHTML;
    
    placeOrderBtn.innerHTML = 'Processing...';
    placeOrderBtn.disabled = true;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = subtotal * (1 - currentDiscount);

    const orderData = {
        name: document.getElementById('order-name').value,
        email: document.getElementById('order-email').value,
        address: document.getElementById('order-address').value,
        total: finalTotal,
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }))
    };

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Order Placed', 'Success! Your next-gen gear is coming from the database!', 'success');
            cart = [];
            currentDiscount = 0;
            promoInput.value = '';
            updateCartUI();
            closeCheckoutModal();
        } else {
            showToast('Error', result.error || 'Failed to place order.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error', 'Server connection failed. Is XAMPP running?', 'error');
    } finally {
        placeOrderBtn.innerHTML = originalBtnText;
        placeOrderBtn.disabled = false;
    }
}

function closeCheckoutModal() {
    checkoutModal.classList.add('hidden');
    checkoutForm.reset();
}

// 13. Toggle Theme logic
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggleBtn.innerHTML = isLight ? '🌙' : '☀️';
    showToast('Theme Updated', `Switched to ${isLight ? 'Light' : 'Dark'} Mode`, 'info');
}

// 14. Toast Notification Builder
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
    `;
    toastContainer.appendChild(toast);
    
    // Trigger CSS animation delay securely
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// 15. View Product Details Alert
function viewProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    showToast('Product Info', `Viewing details for ${product.name}`, 'info');
}

// Slide in / Slide out Sidebar Handlers
function toggleCart() {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('hidden');
}

// Root Event Listeners
cartBtn.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);

searchInput.addEventListener('input', applyFiltersAndSort);
categoryFilter.addEventListener('change', applyFiltersAndSort);
sortSelect.addEventListener('change', applyFiltersAndSort);

clearCartBtn.addEventListener('click', clearCart);
applyPromoBtn.addEventListener('click', applyPromoCode);
themeToggleBtn.addEventListener('click', toggleTheme);
checkoutBtn.addEventListener('click', processCheckout);

closeCheckoutModalBtn.addEventListener('click', closeCheckoutModal);
checkoutForm.addEventListener('submit', handleOrderSubmission);

// Boot
fetchProducts();

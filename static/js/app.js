const API_BASE = '';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function isLoggedIn() {
  return !!getToken();
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function jwtPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  return jwtPayload(token);
}

function formatError(detail) {
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || String(e)).join('; ');
  }
  if (typeof detail === 'string') return detail;
  return String(detail);
}

function api(url, options = {}) {
  const config = {
    headers: getAuthHeaders(),
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  return fetch(`${API_BASE}${url}`, config).then(async res => {
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) {
      throw new Error(formatError(data.detail));
    }
    return data;
  });
}

function showModal(id) {
  document.getElementById(id).classList.add('show');
}

function hideModal(id) {
  document.getElementById(id).classList.remove('show');
}

function showError(id, msg) {
  document.getElementById(id).textContent = msg;
}

function clearError(id) {
  document.getElementById(id).textContent = '';
}

function updateUI() {
  const user = getCurrentUser();
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const cartSection = document.getElementById('cartSection');
  const adminBtn = document.getElementById('adminBtn');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userInfo) { userInfo.style.display = 'inline'; usernameDisplay.textContent = user.username; }
    if (cartSection) cartSection.style.display = 'block';
    if (adminBtn) adminBtn.style.display = user.role === 'admin' ? 'inline-block' : 'none';
    loadCart();
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (cartSection) cartSection.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
  }
  loadProducts();
}

function logout() {
  clearToken();
  updateUI();
  document.getElementById('cartItems').innerHTML = '';
  document.getElementById('cartTotal').innerHTML = '';
  if (window.location.pathname === '/admin.html') {
    window.location.href = '/';
  }
}

// ---- Auth ----
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError('loginError');
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      if (!username || !password) {
        showError('loginError', 'Username and password are required');
        return;
      }
      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: { username, password },
        });
        setToken(data.access_token);
        hideModal('loginModal');
        loginForm.reset();
        updateUI();
      } catch (err) {
        showError('loginError', err.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError('registerError');
      const username = document.getElementById('registerUsername').value.trim();
      const password = document.getElementById('registerPassword').value.trim();
      if (!username || !password) {
        showError('registerError', 'Username and password are required');
        return;
      }
      if (username.length < 3) {
        showError('registerError', 'Username must be at least 3 characters');
        return;
      }
      if (password.length < 4) {
        showError('registerError', 'Password must be at least 4 characters');
        return;
      }
      try {
        const data = await api('/auth/register', {
          method: 'POST',
          body: { username, password },
        });
        setToken(data.access_token);
        hideModal('registerModal');
        registerForm.reset();
        updateUI();
      } catch (err) {
        showError('registerError', err.message);
      }
    });
  }

  loadProducts();
  updateUI();

  if (window.location.pathname === '/admin.html') {
    initAdmin();
  }
});

// ---- Products ----
function loadProducts() {
  api('/products').then(products => {
    const list = document.getElementById('productList');
    list.innerHTML = products.map(p => `
      <div class="product-card">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">$${Number(p.price).toFixed(2)}</div>
        <div class="stock ${p.stock === 0 ? 'out' : ''}">${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</div>
        ${isLoggedIn()
          ? `<button onclick="addToCart(${p.product_id})" ${p.stock === 0 ? 'disabled' : ''}>Add to Cart</button>`
          : `<button onclick="showModal('loginModal')">Log in to buy</button>`
        }
      </div>
    `).join('');
  }).catch(err => {
    document.getElementById('productList').innerHTML = `<p class="error">Failed to load products: ${err.message}</p>`;
  });
}

// ---- Cart ----
function addToCart(productId) {
  api('/cart/items', {
    method: 'POST',
    body: { product_id: productId, quantity: 1 },
  }).then(() => {
    loadCart();
  }).catch(err => {
    alert(err.message);
  });
}

function loadCart() {
  if (!isLoggedIn()) return;
  api('/cart').then(cart => {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!cart.items || cart.items.length === 0) {
      container.innerHTML = '<p class="empty">Your cart is empty</p>';
      totalEl.textContent = '';
      return;
    }
    container.innerHTML = cart.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">$${Number(item.price).toFixed(2)} each</div>
        </div>
        <div class="cart-item-controls">
          <input type="number" min="1" value="${item.quantity}" onchange="updateCartItem(${item.cart_item_id}, this.value)">
          <button onclick="removeCartItem(${item.cart_item_id})">Remove</button>
        </div>
        <div class="cart-item-total">$${Number(item.total).toFixed(2)}</div>
      </div>
    `).join('');
    totalEl.textContent = `Total: $${Number(cart.total_price).toFixed(2)}`;
  }).catch(() => {});
}

function updateCartItem(itemId, quantity) {
  const q = parseInt(quantity);
  if (q < 1) return;
  api(`/cart/items/${itemId}`, {
    method: 'PUT',
    body: { quantity: q },
  }).then(() => loadCart()).catch(err => alert(err.message));
}

function removeCartItem(itemId) {
  api(`/cart/items/${itemId}`, { method: 'DELETE' })
    .then(() => loadCart())
    .catch(err => alert(err.message));
}

function checkout() {
  api('/orders/checkout', { method: 'POST' })
    .then(order => {
      alert(`Order #${order.order_id} placed! Total: $${Number(order.total_price).toFixed(2)}`);
    loadCart();
    loadProducts();
    })
    .catch(err => alert(err.message));
}

// ---- Admin ----
function initAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    document.body.innerHTML = '<div class="container"><div class="admin-only"><h2>Access Denied</h2><p>You need admin privileges to access this page.</p><a href="/">Go back to shop</a></div></div>';
    return;
  }
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
  loadAdminProducts();
}

function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const name = document.getElementById('productName').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value);

  if (id) {
    api(`/products/${id}`, {
      method: 'PUT',
      body: { name, price, stock },
    }).then(() => {
      cancelEdit();
      loadAdminProducts();
    }).catch(err => alert(err.message));
  } else {
    api('/products', {
      method: 'POST',
      body: { name, price, stock },
    }).then(() => {
      document.getElementById('productForm').reset();
      loadAdminProducts();
    }).catch(err => alert(err.message));
  }
}

function loadAdminProducts() {
  api('/products').then(products => {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.product_id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>$${Number(p.price).toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>
          <button class="edit-btn" onclick="editProduct(${p.product_id}, '${escapeHtml(p.name).replace(/'/g, "\\'")}', ${p.price}, ${p.stock})">Edit</button>
          <button class="delete-btn" onclick="deleteProduct(${p.product_id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }).catch(err => alert(err.message));
}

function editProduct(id, name, price, stock) {
  document.getElementById('editProductId').value = id;
  document.getElementById('productName').value = name;
  document.getElementById('productPrice').value = price;
  document.getElementById('productStock').value = stock;
  document.getElementById('formTitle').textContent = 'Edit Product';
  document.getElementById('formSubmitBtn').textContent = 'Update Product';
  document.getElementById('formCancelBtn').style.display = 'inline-block';
}

function cancelEdit() {
  document.getElementById('editProductId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('formTitle').textContent = 'Add Product';
  document.getElementById('formSubmitBtn').textContent = 'Add Product';
  document.getElementById('formCancelBtn').style.display = 'none';
}

function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  api(`/products/${id}`, { method: 'DELETE' })
    .then(() => loadAdminProducts())
    .catch(err => alert(err.message));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

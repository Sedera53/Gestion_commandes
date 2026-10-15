/* ==========================================================
   Gestion de Commandes & Produits
   ========================================================== */

// ---------- État de l'application ----------
const PAGE_SIZE = 4;
let currentPage = 1;
let totalPages = 1;
let currentProducts = []; // produits affichés sur la page courante

// ---------- Utilitaires ----------
const $ = (id) => document.getElementById(id);

const formatPrice = (value) => `${parseFloat(value).toFixed(2)} €`;

// Évite d'injecter du HTML venant des données (sécurité XSS)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Appel API simple : renvoie { ok, data }
async function api(url, method = 'GET', body = null) {
    const options = { method, headers: {} };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    const data = await res.json();
    return { ok: res.ok, data };
}

// Affiche un message de succès ou d'erreur pendant 4 secondes
function showAlert(message, type) {
    const box = $('alert-box');
    box.className = `alert alert--${type}`;
    box.textContent = message;
    setTimeout(() => box.classList.add('hidden'), 4000);
}

// Affiche le résultat d'un appel API sous forme d'alerte
function notify({ ok, data }) {
    showAlert(ok ? data.message : data.error, ok ? 'success' : 'error');
    return ok;
}

// ---------- Navigation entre onglets ----------
function switchTab(tab) {
    const showProducts = tab === 'products';

    $('tab-products').classList.toggle('hidden', !showProducts);
    $('tab-orders').classList.toggle('hidden', showProducts);
    $('nav-products').classList.toggle('tab--active', showProducts);
    $('nav-orders').classList.toggle('tab--active', !showProducts);

    if (showProducts) {
        loadProducts();
    } else {
        loadOrderForm();
        loadOrders();
    }
}

// ==========================================================
// PRODUITS
// ==========================================================
async function loadProducts() {
    const { data: result } = await api(`/api/products?page=${currentPage}&limit=${PAGE_SIZE}`);

    currentProducts = result.data;
    totalPages = result.totalPages;

    renderProducts();
    renderPagination(result);
}

function renderProducts() {
    const tbody = $('products-table-body');

    if (currentProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty">Aucun produit trouvé.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentProducts.map((p) => `
        <tr>
            <td class="mono mono--primary">#${p.id}</td>
            <td class="mono mono--muted">${escapeHtml(p.uid)}</td>
            <td>${escapeHtml(p.name)}</td>
            <td>${formatPrice(p.price)}</td>
            <td><span class="pill">${p.stock}</span></td>
            <td>
                <div class="actions">
                    <button class="btn btn--small btn--edit" data-action="edit" data-id="${p.id}">Modifier</button>
                    <button class="btn btn--small btn--delete" data-action="delete" data-id="${p.id}">Supprimer</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(result) {
    $('pagination-info').textContent =
        `Affichage de la page ${result.page} sur ${result.totalPages} (Total : ${result.total} produits)`;
    $('page-indicator').textContent = `Page ${result.page} / ${result.totalPages || 1}`;
    $('btn-prev').disabled = currentPage <= 1;
    $('btn-next').disabled = currentPage >= totalPages;
}

function changePage(direction) {
    currentPage = Math.min(Math.max(currentPage + direction, 1), totalPages);
    loadProducts();
}

// ---------- Modal produit ----------
function openProductModal(product = null) {
    const isEdit = product !== null;

    $('product-form').reset();
    $('product-db-id').value = isEdit ? product.id : '';
    $('p-uid').value = isEdit ? product.uid : '';
    $('p-uid').disabled = isEdit; // l'UID ne change pas à la modification
    $('p-name').value = isEdit ? product.name : '';
    $('p-price').value = isEdit ? product.price : '';
    $('p-stock').value = isEdit ? product.stock : '';

    $('modal-title').textContent = isEdit ? 'Modifier le produit' : 'Ajouter un produit';
    $('btn-save-product').textContent = isEdit ? 'Mettre à jour' : 'Enregistrer';
    $('product-modal').classList.remove('hidden');
}

function closeProductModal() {
    $('product-modal').classList.add('hidden');
}

async function saveProduct(event) {
    event.preventDefault();

    const id = $('product-db-id').value;
    const isEdit = id !== '';

    const product = {
        uid: $('p-uid').value,
        name: $('p-name').value,
        price: parseFloat($('p-price').value),
        stock: parseInt($('p-stock').value),
    };

    const url = isEdit ? `/api/products/${id}` : '/api/products';
    const response = await api(url, isEdit ? 'PUT' : 'POST', product);

    if (notify(response)) {
        closeProductModal();
        loadProducts();
    }
}

async function deleteProduct(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

    const response = await api(`/api/products/${id}`, 'DELETE');
    if (notify(response)) loadProducts();
}

// Clics sur les boutons "Modifier" / "Supprimer" du tableau
function handleProductTableClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === 'edit') {
        openProductModal(currentProducts.find((p) => p.id === id));
    } else if (button.dataset.action === 'delete') {
        deleteProduct(id);
    }
}

// ==========================================================
// COMMANDES
// ==========================================================
async function loadOrderForm() {
    const { data: products } = await api('/api/products');

    $('products-order-table').innerHTML = products.map((p) => `
        <tr>
            <td>
                ${escapeHtml(p.name)}
                <span class="mono mono--primary">[UID: ${escapeHtml(p.uid)}]</span>
                <span class="mono mono--muted">(${formatPrice(p.price)})</span>
            </td>
            <td><span class="pill">${p.stock}</span></td>
            <td class="text-center">
                <input type="number" min="0" value="0" data-id="${p.id}" class="quantity-input">
            </td>
        </tr>
    `).join('');
}

async function submitOrder() {
    const items = Array.from(document.querySelectorAll('.quantity-input'))
        .map((input) => ({
            productId: parseInt(input.dataset.id),
            quantity: parseInt(input.value),
        }))
        .filter((item) => item.quantity > 0);

    if (items.length === 0) {
        return showAlert('Veuillez sélectionner au moins un article.', 'error');
    }

    const response = await api('/api/orders', 'POST', { items });
    if (notify(response)) switchTab('orders');
}

// Classe CSS du badge selon le statut de la commande
function statusClass(status) {
    if (status === 'Validée') return 'badge--success';
    if (status === 'Annulée') return 'badge--danger';
    return 'badge--warning';
}

function renderOrder(order) {
    const items = order.items.map((i) => `
        <li>
            ${escapeHtml(i.name)}
            <span class="mono mono--primary">[UID: ${escapeHtml(i.productUid)}]</span>
            (x${i.quantity}) - ${formatPrice(i.unitPrice * i.quantity)}
        </li>
    `).join('');

    const isCancelled = order.status === 'Annulée';
    const buttons = isCancelled ? '' : `
        <button class="btn btn--small btn--success" data-status="Validée" data-id="${order.id}">Valider</button>
        <button class="btn btn--small btn--danger" data-status="Annulée" data-id="${order.id}">Annuler</button>
    `;

    return `
        <div class="order">
            <div class="order__header">
                <div>
                    <span class="order__id">${escapeHtml(order.id)}</span>
                    <span class="order__date">${new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <span class="badge ${statusClass(order.status)}">${order.status}</span>
            </div>
            <ul class="order__items">${items}</ul>
            <div class="order__footer">
                <span class="order__total">Total : ${formatPrice(order.totalAmount)}</span>
                <div class="actions">${buttons}</div>
            </div>
        </div>
    `;
}

async function loadOrders() {
    const { data: orders } = await api('/api/orders');
    const container = $('orders-container');

    container.innerHTML = orders.length === 0
        ? '<p class="subtitle">Aucune commande enregistrée.</p>'
        : orders.map(renderOrder).join('');
}

async function updateOrderStatus(id, status) {
    const response = await api(`/api/orders/${id}/status`, 'PATCH', { status });
    if (notify(response)) loadOrders();
}

// Clics sur "Valider" / "Annuler" dans l'historique
function handleOrdersClick(event) {
    const button = event.target.closest('button[data-status]');
    if (button) updateOrderStatus(button.dataset.id, button.dataset.status);
}

// ==========================================================
// INITIALISATION
// ==========================================================
function init() {
    $('nav-products').addEventListener('click', () => switchTab('products'));
    $('nav-orders').addEventListener('click', () => switchTab('orders'));

    $('btn-add-product').addEventListener('click', () => openProductModal());
    $('btn-cancel-product').addEventListener('click', closeProductModal);
    $('product-form').addEventListener('submit', saveProduct);
    $('products-table-body').addEventListener('click', handleProductTableClick);

    $('btn-prev').addEventListener('click', () => changePage(-1));
    $('btn-next').addEventListener('click', () => changePage(1));

    $('btn-submit-order').addEventListener('click', submitOrder);
    $('orders-container').addEventListener('click', handleOrdersClick);

    loadProducts();
    loadOrders();
}

init();

const API_BASE = '/api';
const categoryListEl = document.getElementById('category-list');
const productGridEl = document.getElementById('product-grid');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('search-input');

let products = [];
let selectedCategory = 'ทั้งหมด';

async function fetchJson(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดข้อมูลได้ (${response.status})`);
  }
  return response.json();
}

function formatCurrency(value, currency = 'THB') {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency
  }).format(value);
}

function renderStatus(message) {
  statusEl.textContent = message || '';
}

function renderCategories(categories) {
  const allCategories = ['ทั้งหมด', ...categories];
  categoryListEl.innerHTML = '';

  allCategories.forEach((category) => {
    const listItem = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.className = 'category-button';
    if (category === selectedCategory) {
      button.classList.add('active');
    }
    button.addEventListener('click', () => {
      selectedCategory = category;
      renderCategories(categories);
      renderProducts();
    });
    listItem.appendChild(button);
    categoryListEl.appendChild(listItem);
  });
}

function renderProducts() {
  const searchText = searchInput.value.trim().toLowerCase();
  let filtered = [...products];

  if (selectedCategory !== 'ทั้งหมด') {
    filtered = filtered.filter((product) => product.category === selectedCategory);
  }

  if (searchText) {
    filtered = filtered.filter((product) =>
      product.name.toLowerCase().includes(searchText) ||
      product.description.toLowerCase().includes(searchText)
    );
  }

  productGridEl.innerHTML = '';

  if (filtered.length === 0) {
    renderStatus('ไม่พบสินค้าในเงื่อนไขที่เลือก');
    return;
  }

  renderStatus(`พบสินค้า ${filtered.length} รายการ`);

  const template = document.getElementById('product-card-template');

  filtered.forEach((product) => {
    const fragment = template.content.cloneNode(true);
    const image = fragment.querySelector('.product-image');
    image.src = product.imageUrl;
    image.alt = product.name;

    fragment.querySelector('.product-title').textContent = product.name;
    fragment.querySelector('.product-description').textContent = product.description;
    fragment.querySelector('.product-price').textContent = formatCurrency(product.price, product.currency);
    fragment.querySelector('.product-category').textContent = product.category;

    productGridEl.appendChild(fragment);
  });
}

async function bootstrap() {
  try {
    renderStatus('กำลังโหลดสินค้า...');
    const [{ products: productData }, { categories }] = await Promise.all([
      fetchJson('/products'),
      fetchJson('/categories')
    ]);
    products = productData;
    renderCategories(categories);
    renderProducts();
    renderStatus('');
  } catch (error) {
    console.error(error);
    renderStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
  }
}

searchInput.addEventListener('input', () => {
  renderProducts();
});

bootstrap();

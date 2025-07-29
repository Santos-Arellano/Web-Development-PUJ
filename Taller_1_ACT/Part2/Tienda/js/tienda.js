//Taller_1_ACT/Part2/Tienda/js/tienda.js
// =====================
// Variables globales
// =====================
let carrito = []; // Array de objetos {id, nombre, precio, imagen, cantidad}
let productos = []; // Productos de la tienda

// =====================
// Función para renderizar productos
// =====================
function renderizarProductos() {
  const contenedor = document.getElementById('productos');
  contenedor.innerHTML = '';
  productos.forEach(producto => {
    // Crea la tarjeta de producto
    const card = document.createElement('div');
    card.className = 'producto-card';
    card.innerHTML = `
      <img src="${producto.image}" alt="${producto.title}">
      <h3>${producto.title}</h3>
      <p><strong>Precio:</strong> $${producto.price}</p>
      <p><strong>Categoría:</strong> ${producto.category}</p>
      <p><strong>Marca:</strong> ${producto.brand || 'N/A'}</p>
      <p><strong>Descripción:</strong> ${producto.description}</p>
      <button data-id="${producto.id}">Agregar al carrito</button>
    `;
    // Botón para agregar al carrito
    card.querySelector('button').addEventListener('click', () => agregarAlCarrito(producto));
    contenedor.appendChild(card);
  });
}

// =====================
// Función para agregar producto al carrito
// =====================
function agregarAlCarrito(producto) {
  const index = carrito.findIndex(item => item.id === producto.id);
  if (index === -1) {
    carrito.push({ ...producto, cantidad: 1 });
  } else {
    carrito[index].cantidad += 1;
  }
  actualizarCarrito();
}

// =====================
// Función para renderizar el carrito
// =====================
function actualizarCarrito() {
  const count = document.getElementById('cart-count');
  const dropdown = document.getElementById('cart-dropdown');
  const tbody = document.querySelector('#cart-table tbody');
  count.textContent = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  tbody.innerHTML = '';
  carrito.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${item.image}" alt="${item.title}" width="40"></td>
      <td>${item.title}</td>
      <td>$${item.price}</td>
      <td>${item.cantidad}</td>
    `;
    tbody.appendChild(tr);
  });
  // Si el carrito está vacío, muestra mensaje
  if (carrito.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">El carrito está vacío.</td></tr>';
  }
}

// =====================
// Función para vaciar el carrito
// =====================
function vaciarCarrito() {
  carrito = [];
  actualizarCarrito();
}

// =====================
// Función para mostrar/ocultar el carrito al hacer hover
// =====================
function setupCarritoToggle() {
  const cartIcon = document.getElementById('cart-icon');
  const dropdown = document.getElementById('cart-dropdown');
  const cartContainer = document.querySelector('.cart-container');

  // Alternar visibilidad al hacer clic en el ícono
  cartIcon.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que el clic se propague al documento
    dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
  });

  // Evita que el menú se cierre al interactuar dentro del dropdown
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Cierra el menú si se hace clic fuera del área del carrito
  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  });
}

// =====================
// Función para agregar un nuevo producto desde el formulario
// =====================
function setupFormularioAgregar() {
  const form = document.getElementById('form-agregar');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    // Obtiene los valores del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const imagen = document.getElementById('imagen').value.trim();
    const categoria = document.getElementById('categoria').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const marca = document.getElementById('marca').value.trim();

    // Validación de precio
    if (precio < 1000) {
      alert('El precio debe ser mayor o igual a 1,000');
      return;
    }

    // Crea el nuevo producto
    const nuevoProducto = {
      id: Date.now(),
      title: nombre,
      price: precio,
      image: imagen,
      category: categoria,
      description: descripcion,
      brand: marca
    };
    productos.push(nuevoProducto);
    renderizarProductos();
    form.reset(); // Limpia el formulario
  });
}

// =====================
// Función para cargar productos desde la Fake Store API
// =====================
function cargarProductosAPI() {
  fetch('https://fakestoreapi.com/products')
    .then(res => res.json())
    .then(data => {
      // Adaptar los productos para tener 6 atributos
      productos = data.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        image: p.image,
        category: p.category,
        description: p.description,
        brand: "SAAR"
      }));
      renderizarProductos();
    });
}

// =====================
// Inicialización al cargar la página
// =====================
document.addEventListener('DOMContentLoaded', () => {
  cargarProductosAPI();
  setupCarritoToggle();
  setupFormularioAgregar();
  document.getElementById('empty-cart').addEventListener('click', vaciarCarrito);
  actualizarCarrito();
});
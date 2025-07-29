// ===================================
// ARCHIVO: js/productos.js
// DESCRIPCIÓN: Gestión de productos de la tienda
// AUTOR: Estudiante - Taller Programación Web
// ===================================

/**
 * Módulo para la gestión de productos de la tienda
 * Incluye funciones para cargar, renderizar y manipular productos
 */
const ModuloProductos = {
    // Array que almacena todos los productos de la tienda
    productos: [],
    
    // Configuración de la API
    configuracionAPI: {
        urlBase: 'https://fakestoreapi.com',
        endpointProductos: '/products',
        marcaPorDefecto: 'SAAR Store'
    },

    /**
     * Inicializa el módulo de productos
     * Carga los productos desde la API y configura eventos
     */
    async inicializar() {
        try {
            this.mostrarIndicadorCarga(true);
            await this.cargarProductosDesdeAPI();
            this.renderizarTodosLosProductos();
            this.mostrarIndicadorCarga(false);
            
            // Mostrar notificación de éxito
            if (typeof SistemaNotificaciones !== 'undefined') {
                SistemaNotificaciones.mostrar(
                    '🎉 ¡Productos cargados exitosamente!', 
                    'exito'
                );
            }
            
            console.log('✅ Productos cargados exitosamente');
        } catch (error) {
            console.error('Error al inicializar productos:', error);
            this.mostrarIndicadorCarga(false);
            this.mostrarErrorCarga();
            
            // Mostrar notificación de error
            if (typeof SistemaNotificaciones !== 'undefined') {
                SistemaNotificaciones.mostrar(
                    '❌ Error al cargar productos. Inténtalo de nuevo.', 
                    'error'
                );
            }
        }
    },

    /**
     * Realiza petición a la FakeStore API para obtener productos
     * @returns {Promise<Array>} Array de productos desde la API
     */
    async cargarProductosDesdeAPI() {
        try {
            const urlCompleta = this.configuracionAPI.urlBase + this.configuracionAPI.endpointProductos;
            const respuesta = await fetch(urlCompleta);
            
            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }
            
            const productosAPI = await respuesta.json();
            
            // Transformar los productos para que tengan todos los atributos requeridos
            this.productos = productosAPI.map(producto => this.transformarProductoAPI(producto));
            
            return this.productos;
        } catch (error) {
            console.error('Error en la petición a la API:', error);
            throw error;
        }
    },

    /**
     * Transforma un producto de la API para que tenga los 6 atributos requeridos
     * @param {Object} productoAPI - Producto original de la API
     * @returns {Object} Producto transformado con todos los atributos
     */
    transformarProductoAPI(productoAPI) {
        return {
            id: productoAPI.id,
            title: productoAPI.title || 'Producto sin nombre',
            price: parseFloat(productoAPI.price) || 0,
            image: productoAPI.image || 'https://via.placeholder.com/200x200/cccccc/ffffff?text=Sin+Imagen',
            category: productoAPI.category || 'Sin categoría',
            description: productoAPI.description || 'Sin descripción disponible',
            brand: this.configuracionAPI.marcaPorDefecto // Sexto atributo requerido
        };
    },

    /**
     * Agrega un nuevo producto al array de productos
     * @param {Object} nuevoProducto - Objeto con los datos del nuevo producto
     * @returns {Object} El producto agregado con ID generado
     */
    agregarNuevoProducto(nuevoProducto) {
        try {
            // Validar que el producto tenga todos los campos requeridos
            if (!this.validarProducto(nuevoProducto)) {
                throw new Error('El producto no tiene todos los campos requeridos');
            }
            
            // Generar ID único basado en timestamp
            const productoConID = {
                ...nuevoProducto,
                id: Date.now() + Math.random(), // ID único
                price: parseFloat(nuevoProducto.price) // Asegurar que el precio sea número
            };
            
            // Agregar al inicio del array para que aparezca primero
            this.productos.unshift(productoConID);
            
            // Re-renderizar todos los productos
            this.renderizarTodosLosProductos();
            
            // Mostrar notificación de éxito
            if (typeof SistemaNotificaciones !== 'undefined') {
                SistemaNotificaciones.mostrar(
                    `✅ ¡Producto "${productoConID.title}" agregado exitosamente!`, 
                    'exito'
                );
            }
            
            return productoConID;
        } catch (error) {
            console.error('Error al agregar producto:', error);
            if (typeof SistemaNotificaciones !== 'undefined') {
                SistemaNotificaciones.mostrar(
                    '❌ Error al agregar el producto. Verifica los datos.', 
                    'error'
                );
            }
            throw error;
        }
    },

    /**
     * Valida que un producto tenga todos los campos requeridos
     * @param {Object} producto - Producto a validar
     * @returns {boolean} true si es válido, false si no
     */
    validarProducto(producto) {
        const camposRequeridos = ['title', 'price', 'image', 'category', 'description', 'brand'];
        
        return camposRequeridos.every(campo => {
            const valor = producto[campo];
            return valor !== undefined && valor !== null && valor.toString().trim() !== '';
        }) && parseFloat(producto.price) >= 1000; // Validar precio mínimo
    },

    /**
     * Renderiza todos los productos en el DOM
     */
    renderizarTodosLosProductos() {
        const contenedorProductos = document.getElementById('contenedor-productos');
        
        if (!contenedorProductos) {
            console.error('No se encontró el contenedor de productos');
            return;
        }
        
        // Limpiar contenedor existente
        contenedorProductos.innerHTML = '';
        
        // Renderizar cada producto
        this.productos.forEach(producto => {
            const tarjetaProducto = this.crearTarjetaProducto(producto);
            contenedorProductos.appendChild(tarjetaProducto);
        });
        
        // Agregar animación de entrada
        contenedorProductos.classList.add('fadeIn');
    },

    /**
     * Crea una tarjeta HTML para un producto
     * @param {Object} producto - Datos del producto
     * @returns {HTMLElement} Elemento DOM de la tarjeta
     */
    crearTarjetaProducto(producto) {
        // Crear elemento principal de la tarjeta
        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-producto fadeIn';
        tarjeta.setAttribute('data-producto-id', producto.id);
        
        // Construir HTML interno de la tarjeta
        tarjeta.innerHTML = `
            <img src="${this.validarURLImagen(producto.image)}" 
                 alt="${this.escaparHTML(producto.title)}" 
                 class="imagen-producto"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/200x200/cccccc/ffffff?text=Error+Imagen'">
            
            <div class="contenido-tarjeta">
                <h3 class="titulo-producto">${this.escaparHTML(producto.title)}</h3>
                
                <p class="precio-producto">💰 $${this.formatearPrecio(producto.price)}</p>
                
                <div class="detalles-producto">
                    <p class="info-producto">
                        <strong>🏷️ Categoría:</strong> ${this.escaparHTML(producto.category)}
                    </p>
                    <p class="info-producto">
                        <strong>🔖 Marca:</strong> ${this.escaparHTML(producto.brand)}
                    </p>
                </div>
                
                <p class="descripcion-producto">
                    📄 ${this.escaparHTML(this.truncarTexto(producto.description, 120))}
                </p>
                
                <button class="boton-agregar-carrito" 
                        data-producto-id="${producto.id}"
                        onclick="ModuloProductos.agregarAlCarrito('${producto.id}')">
                    🛒 Agregar al Carrito
                </button>
            </div>
        `;
        
        return tarjeta;
    },

    /**
     * Agrega un producto al carrito
     * @param {string|number} idProducto - ID del producto a agregar
     */
    agregarAlCarrito(idProducto) {
        const producto = this.productos.find(p => p.id.toString() === idProducto.toString());
        if (producto && typeof ModuloCarrito !== 'undefined') {
            ModuloCarrito.agregarProducto(producto);
        } else {
            if (typeof SistemaNotificaciones !== 'undefined') {
                SistemaNotificaciones.mostrar(
                    '❌ Error al agregar al carrito. Producto no encontrado.', 
                    'error'
                );
            }
        }
    },

    /**
     * Muestra u oculta el indicador de carga
     * @param {boolean} mostrar - True para mostrar, false para ocultar
     */
    mostrarIndicadorCarga(mostrar) {
        const indicador = document.getElementById('indicador-carga');
        if (indicador) {
            indicador.classList.toggle('oculto', !mostrar);
        }
    },

    /**
     * Muestra un mensaje de error cuando falla la carga de productos
     */
    mostrarErrorCarga() {
        const contenedorProductos = document.getElementById('contenedor-productos');
        if (contenedorProductos) {
            contenedorProductos.innerHTML = `
                <div class="error-carga">
                    <p>😓 No se pudieron cargar los productos.</p>
                    <button onclick="ModuloProductos.inicializar()" class="boton-reintentar">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    /**
     * Valida y retorna una URL de imagen, con fallback si es inválida
     * @param {string} url - URL a validar
     * @returns {string} URL válida
     */
    validarURLImagen(url) {
        try {
            new URL(url);
            return url;
        } catch {
            return 'https://via.placeholder.com/200x200/cccccc/ffffff?text=Sin+Imagen';
        }
    },

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} texto - Texto a escapar
     * @returns {string} Texto escapado
     */
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    },

    /**
     * Formatea un precio para mostrar
     * @param {number} precio - Precio a formatear
     * @returns {string} Precio formateado
     */
    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(precio);
    },

    /**
     * Trunca un texto a una longitud específica
     * @param {string} texto - Texto a truncar
     * @param {number} longitudMaxima - Longitud máxima
     * @returns {string} Texto truncado
     */
    truncarTexto(texto, longitudMaxima) {
        if (texto.length <= longitudMaxima) return texto;
        return texto.substring(0, longitudMaxima).trim() + '...';
    }
};

// Hacer disponible globalmente
window.ModuloProductos = ModuloProductos;
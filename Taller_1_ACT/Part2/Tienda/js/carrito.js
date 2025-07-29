// ===================================
// ARCHIVO: js/carrito.js
// DESCRIPCIÓN: Gestión del carrito de compras
// AUTOR: Estudiante - Taller Programación Web
// ===================================

/**
 * Módulo para la gestión completa del carrito de compras
 * Incluye funcionalidades para agregar, eliminar, mostrar y gestionar productos
 */
const ModuloCarrito = {
    // Array que almacena los productos del carrito
    // Cada item tiene: {id, title, price, image, category, description, brand, cantidad}
    itemsCarrito: [],
    
    // Referencias a elementos DOM
    elementos: {
        botonCarrito: null,
        contadorCarrito: null,
        dropdownCarrito: null,
        tablaCarrito: null,
        cuerpoTabla: null,
        totalPrecio: null,
        botonVaciar: null
    },

    /**
     * Inicializa el módulo del carrito
     * Configura referencias DOM y eventos
     */
    inicializar() {
        try {
            this.configurarElementosDOM();
            this.configurarEventos();
            this.cargarCarritoDesdeStorage();
            this.actualizarInterfazCarrito();
            
            console.log('✅ Módulo de carrito inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar el carrito:', error);
        }
    },

    /**
     * Configura las referencias a elementos DOM
     */
    configurarElementosDOM() {
        this.elementos = {
            botonCarrito: document.getElementById('boton-carrito'),
            contadorCarrito: document.getElementById('contador-carrito'),
            dropdownCarrito: document.getElementById('dropdown-carrito'),
            tablaCarrito: document.getElementById('tabla-carrito'),
            cuerpoTabla: document.getElementById('cuerpo-tabla-carrito'),
            totalPrecio: document.getElementById('total-precio'),
            botonVaciar: document.getElementById('boton-vaciar-carrito')
        };

        // Verificar que todos los elementos existan
        Object.entries(this.elementos).forEach(([nombre, elemento]) => {
            if (!elemento) {
                console.warn(`⚠️ Elemento ${nombre} no encontrado en el DOM`);
            }
        });
    },

    /**
     * Configura todos los eventos del carrito
     */
    configurarEventos() {
        // Evento para mostrar/ocultar el carrito al hacer clic
        if (this.elementos.botonCarrito) {
            this.elementos.botonCarrito.addEventListener('click', (evento) => {
                evento.stopPropagation();
                this.alternarVisibilidadCarrito();
            });
        }

        // Evento para vaciar el carrito
        if (this.elementos.botonVaciar) {
            this.elementos.botonVaciar.addEventListener('click', (evento) => {
                evento.preventDefault();
                this.mostrarConfirmacionVaciar();
            });
        }

        // Evento para cerrar el carrito al hacer clic fuera
        document.addEventListener('click', (evento) => {
            if (!this.elementos.dropdownCarrito?.contains(evento.target) && 
                !this.elementos.botonCarrito?.contains(evento.target)) {
                this.ocultarDropdownCarrito();
            }
        });

        // Prevenir que el dropdown se cierre al hacer clic dentro
        if (this.elementos.dropdownCarrito) {
            this.elementos.dropdownCarrito.addEventListener('click', (evento) => {
                evento.stopPropagation();
            });
        }
    },

    /**
     * Agrega un producto al carrito o incrementa su cantidad
     * @param {Object} producto - Producto a agregar
     */
    agregarProducto(producto) {
        try {
            if (!this.validarProducto(producto)) {
                throw new Error('Producto inválido');
            }

            // Buscar si el producto ya existe en el carrito
            const indiceExistente = this.itemsCarrito.findIndex(
                item => item.id.toString() === producto.id.toString()
            );

            if (indiceExistente !== -1) {
                // Si existe, incrementar cantidad
                this.itemsCarrito[indiceExistente].cantidad += 1;
                
                SistemaNotificaciones.mostrar(
                    `📦 Cantidad actualizada: ${this.itemsCarrito[indiceExistente].title}`, 
                    'exito'
                );
            } else {
                // Si no existe, agregar nuevo item con cantidad 1
                const nuevoItem = {
                    ...producto,
                    cantidad: 1
                };
                
                this.itemsCarrito.push(nuevoItem);
                
                SistemaNotificaciones.mostrar(
                    `🛒 Producto agregado: ${producto.title}`, 
                    'exito'
                );
            }

            // Actualizar la interfaz y guardar en storage
            this.actualizarInterfazCarrito();
            this.guardarCarritoEnStorage();
            
            // Mostrar brevemente el carrito
            this.mostrarDropdownCarrito();
            
        } catch (error) {
            console.error('Error al agregar producto al carrito:', error);
            SistemaNotificaciones.mostrar(
                '❌ Error al agregar el producto al carrito', 
                'error'
            );
        }
    },

    /**
     * Elimina un producto específico del carrito
     * @param {string|number} idProducto - ID del producto a eliminar
     */
    eliminarProducto(idProducto) {
        try {
            const indice = this.itemsCarrito.findIndex(
                item => item.id.toString() === idProducto.toString()
            );

            if (indice !== -1) {
                const productoEliminado = this.itemsCarrito[indice];
                this.itemsCarrito.splice(indice, 1);
                
                this.actualizarInterfazCarrito();
                this.guardarCarritoEnStorage();
                
                SistemaNotificaciones.mostrar(
                    `🗑️ Producto eliminado: ${productoEliminado.title}`, 
                    'advertencia'
                );
            }
        } catch (error) {
            console.error('Error al eliminar producto del carrito:', error);
            SistemaNotificaciones.mostrar(
                '❌ Error al eliminar el producto del carrito', 
                'error'
            );
        }
    },

    /**
     * Muestra el carrito en el dropdown
     */
    mostrarDropdownCarrito() {
        if (this.elementos.dropdownCarrito) {
            this.elementos.dropdownCarrito.classList.add('mostrar');
            this.actualizarInterfazCarrito();
        }
    },

    /**
     * Oculta el carrito en el dropdown
     */
    ocultarDropdownCarrito() {
        if (this.elementos.dropdownCarrito) {
            this.elementos.dropdownCarrito.classList.remove('mostrar');
        }
    },

    /**
     * Alterna la visibilidad del carrito (mostrar/ocultar)
     */
    alternarVisibilidadCarrito() {
        if (this.elementos.dropdownCarrito) {
            if (this.elementos.dropdownCarrito.classList.contains('mostrar')) {
                this.ocultarDropdownCarrito();
            } else {
                this.mostrarDropdownCarrito();
            }
        }
    },

    /**
     * Actualiza la interfaz del carrito para reflejar los productos actuales
     */
    actualizarInterfazCarrito() {
        if (!this.elementos.cuerpoTabla) {
            console.warn('⚠️ Elementos de tabla no encontrados para actualizar el carrito.');
            return;
        }

        // Limpiar contenido anterior
        this.elementos.cuerpoTabla.innerHTML = '';

        if (this.itemsCarrito.length === 0) {
            this.elementos.cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        🛒 No hay productos en el carrito
                    </td>
                </tr>
            `;
            
            if (this.elementos.totalPrecio) {
                this.elementos.totalPrecio.textContent = '0.00';
            }
            
            if (this.elementos.contadorCarrito) {
                this.elementos.contadorCarrito.textContent = '0';
            }
            return;
        }

        let total = 0;
        let totalItems = 0;

        this.itemsCarrito.forEach(item => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>
                    <img src="${item.image}" alt="${this.escaparHTML(item.title)}" 
                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">
                </td>
                <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${this.escaparHTML(item.title)}
                </td>
                <td>$${this.formatearPrecio(item.price)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <button onclick="ModuloCarrito.actualizarCantidad('${item.id}', ${item.cantidad - 1})" 
                                style="background: #dc3545; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer;">
                            -
                        </button>
                        <span style="min-width: 30px; text-align: center;">${item.cantidad}</span>
                        <button onclick="ModuloCarrito.actualizarCantidad('${item.id}', ${item.cantidad + 1})" 
                                style="background: #28a745; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer;">
                            +
                        </button>
                    </div>
                </td>
                <td>$${this.formatearPrecio(item.price * item.cantidad)}</td>
            `;
            
            this.elementos.cuerpoTabla.appendChild(fila);
            total += item.price * item.cantidad;
            totalItems += item.cantidad;
        });

        if (this.elementos.totalPrecio) {
            this.elementos.totalPrecio.textContent = this.formatearPrecio(total);
        }
        
        if (this.elementos.contadorCarrito) {
            this.elementos.contadorCarrito.textContent = totalItems;
        }
    },

    /**
     * Actualiza la cantidad de un producto en el carrito
     * @param {string|number} idProducto - ID del producto a actualizar
     * @param {number} nuevaCantidad - Nueva cantidad
     */
    actualizarCantidad(idProducto, nuevaCantidad) {
        const cantidad = parseInt(nuevaCantidad);
        
        if (isNaN(cantidad) || cantidad < 0) {
            return;
        }
        
        if (cantidad === 0) {
            this.eliminarProducto(idProducto);
            return;
        }

        const indice = this.itemsCarrito.findIndex(
            item => item.id.toString() === idProducto.toString()
        );

        if (indice !== -1) {
            this.itemsCarrito[indice].cantidad = cantidad;
            this.actualizarInterfazCarrito();
            this.guardarCarritoEnStorage();
        }
    },

    /**
     * Guarda el carrito actual en el almacenamiento local
     */
    guardarCarritoEnStorage() {
        try {
            localStorage.setItem('carrito_fakestore', JSON.stringify(this.itemsCarrito));
        } catch (error) {
            console.error('❌ Error al guardar el carrito en storage:', error);
        }
    },

    /**
     * Carga el carrito desde el almacenamiento local
     */
    cargarCarritoDesdeStorage() {
        try {
            const carritoGuardado = localStorage.getItem('carrito_fakestore');
            if (carritoGuardado) {
                this.itemsCarrito = JSON.parse(carritoGuardado);
                console.log('✅ Carrito cargado desde storage');
            }
        } catch (error) {
            console.error('❌ Error al cargar el carrito desde storage:', error);
            this.itemsCarrito = [];
        }
    },

    /**
     * Muestra una confirmación para vaciar el carrito
     */
    mostrarConfirmacionVaciar() {
        if (this.itemsCarrito.length === 0) {
            SistemaNotificaciones.mostrar('🛒 El carrito ya está vacío', 'info');
            return;
        }
        
        if (confirm('¿Estás seguro de que quieres vaciar el carrito? Esta acción no se puede deshacer.')) {
            this.vaciarCarrito();
        }
    },

    /**
     * Vacía el carrito completamente
     */
    vaciarCarrito() {
        this.itemsCarrito = [];
        this.actualizarInterfazCarrito();
        this.guardarCarritoEnStorage();
        SistemaNotificaciones.mostrar('🗑️ Carrito vaciado', 'advertencia');
    },

    /**
     * Valida si un producto es válido para agregar al carrito
     * @param {Object} producto - Producto a validar
     * @returns {boolean} - True si es válido, false en caso contrario
     */
    validarProducto(producto) {
        return producto && 
               typeof producto === 'object' && 
               producto.id && 
               producto.title && 
               producto.price && 
               producto.image;
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
    }
};

// Hacer el módulo disponible globalmente
window.ModuloCarrito = ModuloCarrito;
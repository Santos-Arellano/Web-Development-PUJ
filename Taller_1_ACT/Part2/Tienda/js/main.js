// ===================================
// ARCHIVO: js/main.js
// DESCRIPCIÓN: Inicialización global de la tienda
// ===================================

/**
 * Función principal que inicializa todos los módulos de la tienda
 * Se ejecuta cuando el DOM está completamente cargado
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando Tienda FakeStore...');

    try {
        // Esperar un momento para asegurar que todos los scripts estén cargados
        await new Promise(resolve => setTimeout(resolve, 100));

        // Inicializar sistema de notificaciones primero
        if (typeof SistemaNotificaciones !== 'undefined') {
            SistemaNotificaciones.inicializar();
            console.log('✅ Sistema de notificaciones inicializado');
        } else {
            console.warn('⚠️ Sistema de notificaciones no disponible');
        }

        // Inicializar carrito de compras
        if (typeof ModuloCarrito !== 'undefined') {
            ModuloCarrito.inicializar();
            console.log('✅ Módulo de carrito inicializado');
        } else {
            console.error('❌ Módulo de carrito no disponible');
            mostrarErrorSistema('Módulo de carrito no disponible');
        }

        // Inicializar módulo de productos
        if (typeof ModuloProductos !== 'undefined') {
            await ModuloProductos.inicializar();
            console.log('✅ Módulo de productos inicializado');
        } else {
            console.error('❌ Módulo de productos no disponible');
            mostrarErrorSistema('Módulo de productos no disponible');
        }

        // Configurar eventos globales adicionales
        configurarEventosGlobales();

        console.log('🎉 ¡Tienda FakeStore inicializada correctamente!');

        // Mostrar notificación de bienvenida
        if (typeof SistemaNotificaciones !== 'undefined') {
            setTimeout(() => {
                SistemaNotificaciones.mostrar(
                    '🎉 ¡Bienvenido a FakeStore! Explora nuestros productos.',
                    'info',
                    4000
                );
            }, 1000);
        }

    } catch (error) {
        console.error('💥 Error crítico al inicializar la tienda:', error);
        mostrarErrorSistema('Error crítico al inicializar la tienda');
    }
});

/**
 * Configura eventos globales de la aplicación
 */
function configurarEventosGlobales() {
    // Manejar errores de imágenes a nivel global
    document.addEventListener('error', (evento) => {
        if (evento.target.tagName === 'IMG') {
            evento.target.src = 'https://via.placeholder.com/200x200/cccccc/ffffff?text=Error+Imagen';
            console.warn('⚠️ Error al cargar imagen:', evento.target.alt);
        }
    }, true);

    // Manejar teclas de acceso rápido
    document.addEventListener('keydown', (evento) => {
        // Esc para cerrar el carrito
        if (evento.key === 'Escape' && typeof ModuloCarrito !== 'undefined') {
            ModuloCarrito.ocultarDropdownCarrito();
        }
        
        // Ctrl/Cmd + K para enfocar el formulario de búsqueda (si existe)
        if ((evento.ctrlKey || evento.metaKey) && evento.key === 'k') {
            evento.preventDefault();
            const formulario = document.getElementById('formulario-nuevo-producto');
            if (formulario) {
                const primerInput = formulario.querySelector('input');
                if (primerInput) {
                    primerInput.focus();
                }
            }
        }
    });

    // Configurar observador de intersección para animaciones
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observar elementos que aparecen gradualmente
        document.querySelectorAll('.tarjeta-producto').forEach(tarjeta => {
            observer.observe(tarjeta);
        });
    }

    console.log('✅ Eventos globales configurados');
}

/**
 * Muestra un error del sistema cuando los módulos críticos no están disponibles
 * @param {string} mensaje - Mensaje de error a mostrar
 */
function mostrarErrorSistema(mensaje) {
    // Crear un div de error si no existe el sistema de notificaciones
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: system-ui, -apple-system, sans-serif;
    `;
    errorDiv.innerHTML = `
        <strong>⚠️ Error del Sistema</strong><br>
        ${mensaje}<br>
        <small>Por favor, recarga la página.</small>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remover después de 10 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 10000);
}

/**
 * Función utilitaria para verificar si todos los módulos están cargados
 * @returns {Object} Estado de carga de los módulos
 */
function verificarEstadoModulos() {
    return {
        notificaciones: typeof SistemaNotificaciones !== 'undefined',
        productos: typeof ModuloProductos !== 'undefined',
        carrito: typeof ModuloCarrito !== 'undefined',
        todosDisponibles: typeof SistemaNotificaciones !== 'undefined' && 
                         typeof ModuloProductos !== 'undefined' && 
                         typeof ModuloCarrito !== 'undefined'
    };
}

/**
 * Función para debug - disponible en la consola del navegador
 */
window.debugTienda = function() {
    const estado = verificarEstadoModulos();
    console.log('🔍 Estado de los módulos:', estado);
    
    if (typeof ModuloProductos !== 'undefined') {
        console.log('📦 Productos cargados:', ModuloProductos.productos.length);
    }
    
    if (typeof ModuloCarrito !== 'undefined') {
        console.log('🛒 Items en carrito:', ModuloCarrito.itemsCarrito.length);
    }
    
    return estado;
};

// Información de la versión para debug
console.log(`
🏪 Tienda FakeStore v1.0
📅 Inicializada: ${new Date().toLocaleString()}
🌐 Navegador: ${navigator.userAgent.split(' ').pop()}
`);

// Manejo global de errores no capturados
window.addEventListener('error', (evento) => {
    console.error('💥 Error no capturado:', evento.error);
    if (typeof SistemaNotificaciones !== 'undefined') {
        SistemaNotificaciones.mostrar(
            '❌ Error inesperado. Por favor, recarga la página.',
            'error'
        );
    }
});

// Manejo de promesas rechazadas
window.addEventListener('unhandledrejection', (evento) => {
    console.error('💥 Promesa rechazada:', evento.reason);
    if (typeof SistemaNotificaciones !== 'undefined') {
        SistemaNotificaciones.mostrar(
            '❌ Error de conexión. Verifica tu internet.',
            'error'
        );
    }
    evento.preventDefault();
});
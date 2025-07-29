// ===================================
// ARCHIVO: js/notificaciones.js
// DESCRIPCIÓN: Sistema de notificaciones toast
// ===================================

/**
 * Sistema de notificaciones para mostrar mensajes al usuario
 * Soporta diferentes tipos: éxito, error, advertencia, información
 */
const SistemaNotificaciones = {
    // Contenedor donde se mostrarán las notificaciones
    contenedor: null,
    
    // Contador para IDs únicos
    contadorIds: 0,

    /**
     * Inicializa el sistema de notificaciones
     */
    inicializar() {
        // Buscar el contenedor existente o crearlo
        this.contenedor = document.getElementById('contenedor-notificaciones');
        
        if (!this.contenedor) {
            this.contenedor = document.createElement('div');
            this.contenedor.id = 'contenedor-notificaciones';
            this.contenedor.className = 'contenedor-notificaciones';
            document.body.appendChild(this.contenedor);
        }
        
        console.log('✅ Sistema de notificaciones inicializado');
    },

    /**
     * Muestra una notificación
     * @param {string} mensaje - El mensaje a mostrar
     * @param {string} tipo - Tipo de notificación: 'exito', 'error', 'advertencia', 'info'
     * @param {number} duracion - Duración en ms (opcional, por defecto 3000)
     */
    mostrar(mensaje, tipo = 'info', duracion = 3000) {
        if (!this.contenedor) {
            this.inicializar();
        }

        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        const id = `notificacion-${++this.contadorIds}`;
        notificacion.id = id;
        notificacion.className = `notificacion ${tipo}`;
        
        // Configurar contenido
        notificacion.innerHTML = `
            <div class="contenido-notificacion">
                <span class="icono-notificacion">${this.obtenerIcono(tipo)}</span>
                <span class="mensaje-notificacion">${this.escaparHTML(mensaje)}</span>
                <button class="boton-cerrar-notificacion" onclick="SistemaNotificaciones.cerrar('${id}')" aria-label="Cerrar notificación">
                    ✕
                </button>
            </div>
            <div class="barra-progreso-notificacion"></div>
        `;

        // Agregar al contenedor
        this.contenedor.appendChild(notificacion);

        // Animar entrada
        requestAnimationFrame(() => {
            notificacion.classList.add('mostrar');
        });

        // Auto-remover después del tiempo especificado
        setTimeout(() => {
            this.cerrar(id);
        }, duracion);

        return id;
    },

    /**
     * Cierra una notificación específica
     * @param {string} id - ID de la notificación a cerrar
     */
    cerrar(id) {
        const notificacion = document.getElementById(id);
        if (notificacion) {
            notificacion.classList.add('cerrando');
            
            // Remover del DOM después de la animación
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }
    },

    /**
     * Cierra todas las notificaciones activas
     */
    cerrarTodas() {
        const notificaciones = this.contenedor.querySelectorAll('.notificacion');
        notificaciones.forEach(notificacion => {
            this.cerrar(notificacion.id);
        });
    },

    /**
     * Obtiene el icono apropiado para cada tipo de notificación
     * @param {string} tipo - Tipo de notificación
     * @returns {string} Icono correspondiente
     */
    obtenerIcono(tipo) {
        const iconos = {
            'exito': '✅',
            'success': '✅',
            'error': '❌',
            'danger': '❌',
            'advertencia': '⚠️',
            'warning': '⚠️',
            'info': 'ℹ️',
            'informacion': 'ℹ️'
        };
        
        return iconos[tipo] || 'ℹ️';
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

    // Métodos de conveniencia para tipos específicos
    exito(mensaje, duracion) {
        return this.mostrar(mensaje, 'exito', duracion);
    },

    error(mensaje, duracion) {
        return this.mostrar(mensaje, 'error', duracion);
    },

    advertencia(mensaje, duracion) {
        return this.mostrar(mensaje, 'advertencia', duracion);
    },

    info(mensaje, duracion) {
        return this.mostrar(mensaje, 'info', duracion);
    }
};

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    SistemaNotificaciones.inicializar();
});

// Hacer disponible globalmente
window.SistemaNotificaciones = SistemaNotificaciones;
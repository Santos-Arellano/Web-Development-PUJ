// ===================================
// ARCHIVO: js/formulario.js
// DESCRIPCIÓN: Lógica para el formulario de agregar productos
// ===================================

/**
 * Configuración y manejo del formulario para agregar nuevos productos
 */
document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formulario-nuevo-producto');
    
    if (!formulario) {
        console.warn('⚠️ Formulario de productos no encontrado');
        return;
    }

    console.log('✅ Configurando formulario de productos');

    // Configurar validación en tiempo real
    configurarValidacionTiempoReal(formulario);

    // Manejar envío del formulario
    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        manejarEnvioFormulario(formulario);
    });

    // Manejar reset del formulario
    formulario.addEventListener('reset', function () {
        limpiarErrores(formulario);
        if (typeof SistemaNotificaciones !== 'undefined') {
            SistemaNotificaciones.mostrar('🧹 Formulario limpiado', 'info', 2000);
        }
    });
});

/**
 * Configura la validación en tiempo real para todos los campos
 * @param {HTMLFormElement} formulario - El formulario a configurar
 */
function configurarValidacionTiempoReal(formulario) {
    const campos = formulario.querySelectorAll('input, textarea');
    
    campos.forEach(campo => {
        // Validar al perder el foco
        campo.addEventListener('blur', () => {
            validarCampoIndividual(campo);
        });

        // Limpiar errores al escribir
        campo.addEventListener('input', () => {
            const campoDiv = campo.closest('.campo-formulario');
            if (campoDiv && campoDiv.classList.contains('error')) {
                campoDiv.classList.remove('error');
                const errorSpan = campoDiv.querySelector('.mensaje-error');
                if (errorSpan) {
                    errorSpan.textContent = '';
                    errorSpan.style.display = 'none';
                }
            }
        });
    });
}

/**
 * Valida un campo individual
 * @param {HTMLElement} campo - Campo a validar
 * @returns {boolean} - true si es válido, false si no
 */
function validarCampoIndividual(campo) {
    const nombre = campo.name;
    const valor = campo.value.trim();
    let esValido = true;
    let mensajeError = '';

    // Limpiar error previo
    limpiarErrorCampo(campo);

    // Validaciones específicas por campo
    switch (nombre) {
        case 'nombre':
            if (valor === '') {
                mensajeError = 'El nombre es obligatorio';
                esValido = false;
            } else if (valor.length < 3) {
                mensajeError = 'El nombre debe tener al menos 3 caracteres';
                esValido = false;
            }
            break;

        case 'precio':
            const precio = parseFloat(valor);
            if (valor === '' || isNaN(precio)) {
                mensajeError = 'El precio es obligatorio y debe ser un número';
                esValido = false;
            } else if (precio < 1000) {
                mensajeError = 'El precio debe ser mayor o igual a 1000';
                esValido = false;
            }
            break;

        case 'imagen':
            if (valor === '') {
                mensajeError = 'La URL de la imagen es obligatoria';
                esValido = false;
            } else if (!esURLValida(valor)) {
                mensajeError = 'Debes ingresar una URL de imagen válida';
                esValido = false;
            }
            break;

        case 'categoria':
            if (valor === '') {
                mensajeError = 'La categoría es obligatoria';
                esValido = false;
            } else if (valor.length < 2) {
                mensajeError = 'La categoría debe tener al menos 2 caracteres';
                esValido = false;
            }
            break;

        case 'marca':
            if (valor === '') {
                mensajeError = 'La marca es obligatoria';
                esValido = false;
            } else if (valor.length < 2) {
                mensajeError = 'La marca debe tener al menos 2 caracteres';
                esValido = false;
            }
            break;

        case 'descripcion':
            if (valor === '') {
                mensajeError = 'La descripción es obligatoria';
                esValido = false;
            } else if (valor.length < 10) {
                mensajeError = 'La descripción debe tener al menos 10 caracteres';
                esValido = false;
            }
            break;
    }

    if (!esValido) {
        mostrarErrorCampo(campo, mensajeError);
    }

    return esValido;
}

/**
 * Muestra un mensaje de error en el campo correspondiente
 * @param {HTMLElement} campo 
 * @param {string} mensaje 
 */
function mostrarErrorCampo(campo, mensaje) {
    const campoDiv = campo.closest('.campo-formulario');
    if (campoDiv) {
        campoDiv.classList.add('error');
        const errorSpan = campoDiv.querySelector('.mensaje-error');
        if (errorSpan) {
            errorSpan.textContent = mensaje;
            errorSpan.style.display = 'block';
        }
    }
}

/**
 * Limpia el error visual de un campo
 * @param {HTMLElement} campo 
 */
function limpiarErrorCampo(campo) {
    const campoDiv = campo.closest('.campo-formulario');
    if (campoDiv && campoDiv.classList.contains('error')) {
        campoDiv.classList.remove('error');
        const errorSpan = campoDiv.querySelector('.mensaje-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
        }
    }
}

/**
 * Limpia todos los errores del formulario
 * @param {HTMLFormElement} formulario 
 */
function limpiarErrores(formulario) {
    const campos = formulario.querySelectorAll('input, textarea');
    campos.forEach(campo => limpiarErrorCampo(campo));
}

/**
 * Valida si una URL es válida (básica)
 * @param {string} url 
 * @returns {boolean}
 */
function esURLValida(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Maneja el envío del formulario, valida todos los campos y agrega el producto
 * @param {HTMLFormElement} formulario 
 */
function manejarEnvioFormulario(formulario) {
    const campos = formulario.querySelectorAll('input, textarea');
    let esValido = true;

    // Validar todos los campos
    campos.forEach(campo => {
        if (!validarCampoIndividual(campo)) {
            esValido = false;
        }
    });

    if (!esValido) {
        if (typeof SistemaNotificaciones !== 'undefined') {
            SistemaNotificaciones.mostrar('❌ Corrige los errores antes de enviar.', 'error', 3000);
        }
        return;
    }

    // Construir el objeto producto
    const nuevoProducto = {
        title: formulario.nombre.value.trim(),
        price: parseFloat(formulario.precio.value),
        image: formulario.imagen.value.trim(),
        category: formulario.categoria.value.trim(),
        brand: formulario.marca.value.trim(),
        description: formulario.descripcion.value.trim()
    };

    // Agregar el producto usando el módulo de productos
    if (typeof ModuloProductos !== 'undefined') {
        try {
            ModuloProductos.agregarNuevoProducto(nuevoProducto);
            formulario.reset();
            limpiarErrores(formulario); // Ensure errors are cleared after successful submission
        } catch (error) {
            // Ya se muestra notificación en el módulo de productos
        }
    } else {
        if (typeof SistemaNotificaciones !== 'undefined') {
            SistemaNotificaciones.mostrar('❌ Módulo de productos no disponible.', 'error', 3000);
        }
    }
}
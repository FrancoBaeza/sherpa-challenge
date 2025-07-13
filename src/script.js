// 🏰 DESAFÍO SHERPA - SCRAPING ARCANO
// PASO 1: Autenticación ✅
// PASO 2: La Danza de los Siglos 🔄

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import axios from 'axios';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Credenciales del ritual sagrado
const CREDENCIALES = {
    usuario: 'monje@sherpa.local',
    contraseña: 'cript@123',
};

// URLs del desafío
const URLS = {
    login: 'https://pruebatecnica-sherpa-production.up.railway.app/login',
    base: 'https://pruebatecnica-sherpa-production.up.railway.app',
    api: 'https://backend-production-9d875.up.railway.app/api/cipher/challenge',
};

// Códigos conocidos para desbloquear manuscritos (se llenan dinámicamente)
const CODIGOS_CONOCIDOS = {};

// Configuración de directorios
const DIRECTORIO_DESCARGAS = './descargas';

// Crear directorio de descargas si no existe
if (!fs.existsSync(DIRECTORIO_DESCARGAS)) {
    fs.mkdirSync(DIRECTORIO_DESCARGAS, { recursive: true });
}

//// HELPER FUNCTIONS ////

/**
 * Es solo una busqueda binaria.
 * @param {string[]} vault
 * @param {number} target
 * @returns {string | null}
 */
function busquedaBinaria(vault, target) {
    let left = 0;
    let right = vault.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (mid === target) {
            return vault[mid];
        } else if (mid < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return null; // No encontrado
}

/**
 * Resuelve el challenge de desbloqueo de un libro especial.
 * @param {string} bookTitle
 * @param {string} unlockCode
 * @returns {Promise<string | null>}
 */
async function resolverChallenge(bookTitle, unlockCode) {
    try {
        console.log(`Resolviendo challenge para: ${bookTitle}`);
        console.log(`Usando unlock code: ${unlockCode}`);

        const url = `${URLS.api}?bookTitle=${encodeURIComponent(
            bookTitle,
        )}&unlockCode=${encodeURIComponent(unlockCode)}`;

        console.log(`Haciendo GET request a: ${url}`);
        const response = await axios.get(url);

        if (response.data.success) {
            const { vault, targets } = response.data.challenge;

            console.log(`Vault size: ${vault.length}`);
            console.log(`Targets: ${targets.join(', ')}`);

            // Implementar búsqueda binaria para cada target
            let contraseña = '';

            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                const caracter = busquedaBinaria(vault, target);

                if (caracter) {
                    contraseña += caracter;
                    console.log(`✅ Target ${target} → Caracter: ${caracter}`);
                } else {
                    console.log(`❌ Target ${target} no encontrado`);
                    return null;
                }
            }

            console.log(`Contraseña encontrada: ${contraseña}`);
            return contraseña;
        } else {
            console.log('❌ El challenge no fue exitoso');
            return null;
        }
    } catch (error) {
        console.error('Error al resolver cipher challenge:', error.message);
        return null;
    }
}

/**
 * Desbloquea un libro especial con modal.
 * @param {Page} page
 * @param {string} siglo
 * @param {string} bookTitle
 * @param {string} unlockCode
 * @returns {Promise<boolean>}
 */
async function desbloquearLibroEspecial(page, siglo, bookTitle, unlockCode) {
    console.log(
        `\nDesbloqueando libro especial: ${bookTitle} (Siglo ${siglo})`,
    );

    try {
        // 1. Buscar y hacer clic en el botón "Ver documentación"
        const botonDocumentacion = await page
            .locator(
                'button:has-text("Ver documentación"), button:has-text("ver documentación")',
            )
            .first();

        if ((await botonDocumentacion.count()) > 0) {
            console.log('Botón "Ver documentación" encontrado');
            await botonDocumentacion.click();

            // Esperar a que se abra el modal
            await page.waitForTimeout(2000);

            // 2. Resolver el challenge
            const contraseña = await resolverChallenge(bookTitle, unlockCode);

            if (!contraseña) {
                console.log('❌ No se pudo resolver el challenge');
                return false;
            }

            // 3. Cerrar el modal
            await page.keyboard.press('Escape');
            console.log('✅ Modal cerrado con Escape');

            // Esperar a que aparezca el input normal
            await page.waitForTimeout(2000);

            // 4. Buscar el input que ahora debería aparecer
            const manuscritoContainer = await page
                .locator(
                    `div:has-text("Siglo ${siglo}"), section:has-text("Siglo ${siglo}"), article:has-text("Siglo ${siglo}")`,
                )
                .first();

            // Si no se encontró el manuscrito, retornar
            if ((await manuscritoContainer.count()) === 0) {
                console.log('❌ No se encontró el manuscrito');
                return false;
            }

            const inputCodigo = await manuscritoContainer
                .locator(
                    'input[type="text"]',
                    // 'input[type="text"], input[name*="codigo"], input[id*="codigo"]',
                )
                .first();

            if ((await inputCodigo.count()) === 0) {
                console.log('❌ No se encontró el input');
                return false;
            }

            await inputCodigo.fill(contraseña);
            console.log(`✅ Contraseña ${contraseña} ingresada en el input`);

            // Buscar y hacer clic en el botón de desbloqueo
            const botonDesbloquear = await manuscritoContainer
                .locator(
                    'button:has-text("desbloquear"), button:has-text("Desbloquear")',
                )
                .first();

            if ((await botonDesbloquear.count()) === 0) {
                console.log('❌ No se encontró el botón de desbloqueo');
                return false;
            }

            await botonDesbloquear.click();
            console.log('🔘 Botón de desbloqueo presionado');

            // Esperar a que se procese
            await page.waitForTimeout(3000);

            // Buscar y cerrar modal de éxito si aparece
            const modalExito = await page
                .locator('.modal, [role="dialog"], .success-modal')
                .first();

            if ((await modalExito.count()) > 0) {
                console.log('🎉 Modal de éxito detectado, cerrando...');

                // Intentar cerrar el modal
                const botonCerrarExito = await page
                    .locator(
                        'button:has-text("Cerrar")',
                        // 'button:has-text("Cerrar"), [aria-label="Close"], .modal-close, button:has-text("OK"), button:has-text("Aceptar")',
                    )
                    .first();

                if ((await botonCerrarExito.count()) > 0) {
                    await botonCerrarExito.click();
                    console.log('✅ Modal de éxito cerrado');
                } else {
                    // Fallback: presionar Escape
                    await page.keyboard.press('Escape');
                    console.log('✅ Modal de éxito cerrado con Escape');
                }

                // Esperar a que se cierre completamente
                await page.waitForTimeout(2000);
            } else {
                console.log('ℹ️ No se detectó modal de éxito');
            }

            return true;
        }

        console.log('❌ No se encontró botón "Ver documentación"');
        return false;
    } catch (error) {
        console.error('Error al manejar libro especial:', error.message);
        return false;
    }
}

/**
 * Obtiene la lista de siglos disponibles del dropdown.
 * @param {Page} page
 * @returns {Promise<string[]>}
 */
async function obtenerSiglosDisponibles(page) {
    console.log('\nObteniendo siglos disponibles del dropdown...');

    try {
        const selectFiltro = await page.locator('select').first();

        if ((await selectFiltro.count()) > 0) {
            // Obtener todas las opciones del select
            const opciones = await selectFiltro.locator('option').all();
            const siglos = [];

            for (const opcion of opciones) {
                const valor = await opcion.getAttribute('value');
                const texto = await opcion.textContent();

                // Filtrar solo los siglos válidos (números romanos)
                if (valor && valor.match(/^(XIV|XV|XVI|XVII|XVIII)$/)) {
                    siglos.push(valor);
                }
            }

            console.log(`Siglos encontrados: ${siglos.join(', ')}`);
            return siglos;
        }

        console.log('❌ No se encontró el dropdown de siglos');
        return [];
    } catch (error) {
        console.error('Error al obtener siglos:', error.message);
        return [];
    }
}

/**
 * Detecta si un manuscrito es especial (tiene botón "Ver documentación").
 * @param {Page} page
 * @param {string} siglo
 * @returns {Promise<{esEspecial: boolean, titulo?: string}>}
 */
async function detectarLibroEspecial(page, siglo) {
    console.log(
        `\nDetectando si el manuscrito del siglo ${siglo} es especial...`,
    );

    try {
        // Buscar el contenedor del manuscrito específico del siglo
        const manuscritoContainer = await page
            .locator(
                `div:has-text("Siglo ${siglo}"), section:has-text("Siglo ${siglo}"), article:has-text("Siglo ${siglo}")`,
            )
            .first();

        if ((await manuscritoContainer.count()) > 0) {
            // Buscar el botón "Ver documentación" dentro del contenedor
            const botonDocumentacion = await manuscritoContainer
                .locator(
                    'button:has-text("Ver documentación"), button:has-text("ver documentación")',
                )
                .first();

            if ((await botonDocumentacion.count()) > 0) {
                // Es un libro especial, obtener el título
                const tituloElement = await manuscritoContainer
                    .locator(
                        'h1, h2, h3, h4, h5, h6, [class*="title"], [class*="titulo"], strong, b',
                    )
                    .first();

                let titulo = 'Libro Especial';
                if ((await tituloElement.count()) > 0) {
                    titulo = await tituloElement.textContent();
                    titulo = titulo.trim();
                }

                // Buscar títulos específicos conocidos en el contenido
                const contenidoCompleto =
                    await manuscritoContainer.textContent();
                const contenidoLimpio = contenidoCompleto.toLowerCase();

                if (contenidoLimpio.includes('necronomicon')) {
                    titulo = 'Necronomicon';
                } else if (contenidoLimpio.includes('malleus maleficarum')) {
                    titulo = 'Malleus Maleficarum';
                } else if (contenidoLimpio.includes('malleus')) {
                    titulo = 'Malleus Maleficarum';
                }

                console.log(`Es un libro especial: ${titulo}`);
                return { esEspecial: true, titulo };
            }
        }

        console.log('Es un libro estándar');
        return { esEspecial: false };
    } catch (error) {
        console.error('Error al detectar tipo de libro:', error.message);
        return { esEspecial: false };
    }
}

/**
 * Filtra los manuscritos por siglo utilizando el select/dropdown de la pagina.
 * @param {Page} page
 * @param {string} siglo
 * @returns {Promise<boolean>}
 */
async function filtrarPorSiglo(page, siglo) {
    console.log(`\nFiltrando manuscritos por siglo ${siglo}...`);

    try {
        // Buscar el select/dropdown del filtro de siglo
        const selectFiltro = await page.locator('select').first();

        if ((await selectFiltro.count()) > 0) {
            console.log('Encontrado select de filtro');

            // Seleccionar la opción del siglo
            await selectFiltro.selectOption(siglo);
            console.log(`Siglo ${siglo} seleccionado en el filtro`);

            // Esperar a que se actualice la página
            await page.waitForTimeout(3000);
            return true;
        }
    } catch (error) {
        console.error('Error al filtrar por siglo:', error.message);
        return false;
    }
}

/**
 * Descarga el primer manuscrito (XIV) que no requiere código.
 * @param {Page} page
 * @param {string} siglo
 * @returns {Promise<boolean>}
 */
async function descargarPrimerManuscrito(page, siglo) {
    console.log(`\nDescargando primer manuscrito del siglo ${siglo}...`);

    try {
        // Filtrar por siglo
        await filtrarPorSiglo(page, siglo);

        // Buscar directamente el botón de descarga
        const manuscritoContainer = await page
            .locator(
                `div:has-text("Siglo ${siglo}"), section:has-text("Siglo ${siglo}"), article:has-text("Siglo ${siglo}")`,
            )
            .first();

        if ((await manuscritoContainer.count()) > 0) {
            const botonDescarga = await manuscritoContainer
                .locator(
                    'button:has-text("descargar"), button:has-text("Descargar")',
                )
                .first();

            if ((await botonDescarga.count()) > 0) {
                console.log('Primer manuscrito ya disponible para descarga');
                return true;
            }

            // Si no hay botón de descarga, verificar si hay un botón de desbloqueo
            const botonDesbloquear = await manuscritoContainer
                .locator(
                    'button:has-text("desbloquear"), button:has-text("Desbloquear")',
                )
                .first();

            if ((await botonDesbloquear.count()) > 0) {
                console.log(
                    'Detectado botón de desbloqueo para primer manuscrito, haciendo click...',
                );
                await botonDesbloquear.click();
                await page.waitForTimeout(3000);

                // Verificar si ahora aparece el botón de descarga
                const botonDescargaPostDesbloqueo = await manuscritoContainer
                    .locator(
                        'button:has-text("descargar"), button:has-text("Descargar")',
                    )
                    .first();

                if ((await botonDescargaPostDesbloqueo.count()) > 0) {
                    console.log(
                        '✅ Primer manuscrito desbloqueado y listo para descarga',
                    );
                    return true;
                }
            }
        }

        console.log('❌ No se encontró el primer manuscrito disponible');
        return false;
    } catch (error) {
        console.error('Error al descargar primer manuscrito:', error.message);
        return false;
    }
}

/**
 * Desbloquea un manuscrito por siglo.
 * @param {Page} page
 * @param {string} siglo
 * @param {string} codigo
 * @returns {Promise<boolean>}
 */
async function desbloquearManuscrito(page, siglo, codigo) {
    console.log(
        `\nIntentando desbloquear manuscrito del siglo ${siglo} con código: ${codigo}`,
    );

    try {
        // Primero filtrar por siglo para asegurar que trabajamos con el correcto
        await filtrarPorSiglo(page, siglo);

        // Verificar si es un libro especial
        const infoLibro = await detectarLibroEspecial(page, siglo);

        if (infoLibro.esEspecial) {
            console.log(`Detectado libro especial: ${infoLibro.titulo}`);
            return await desbloquearLibroEspecial(
                page,
                siglo,
                infoLibro.titulo,
                codigo,
            );
        }

        // Proceso normal para libros estándar
        console.log('Procesando libro estándar...');

        // Buscar el contenedor del manuscrito específico del siglo
        const manuscritoContainer = await page
            .locator(
                `div:has-text("Siglo ${siglo}"), section:has-text("Siglo ${siglo}"), article:has-text("Siglo ${siglo}")`,
            )
            .first();

        if ((await manuscritoContainer.count()) > 0) {
            console.log(`Encontrado contenedor del manuscrito siglo ${siglo}`);

            // Buscar input dentro del contenedor específico
            const inputCodigo = await manuscritoContainer
                .locator(
                    'input[type="text"], input[name*="codigo"], input[id*="codigo"]',
                )
                .first();

            if ((await inputCodigo.count()) > 0) {
                await inputCodigo.fill(codigo);
                console.log(
                    `Código ${codigo} ingresado en el manuscrito del siglo ${siglo}`,
                );

                // Buscar botón de desbloqueo dentro del mismo contenedor
                const botonDesbloquear = await manuscritoContainer
                    .locator(
                        'button:has-text("desbloquear"), button:has-text("Desbloquear"), input[type="submit"]',
                    )
                    .first();

                if ((await botonDesbloquear.count()) > 0) {
                    await botonDesbloquear.click();
                    console.log('Botón de desbloqueo presionado');

                    // Esperar a que se procese
                    await page.waitForTimeout(3000);

                    return true;
                } else {
                    console.log('❌ No se encontró botón de desbloqueo');
                    return false;
                }
            } else {
                console.log(
                    '❌ No se encontró input para código en el manuscrito',
                );
                return false;
            }
        }

        console.log('❌ No se encontró el manuscrito');
        return false;
    } catch (error) {
        console.error('Error al desbloquear manuscrito:', error.message);
        return false;
    }
}

/**
 * Descarga el PDF del manuscrito.
 * @param {Page} page
 * @param {string} siglo
 * @returns {Promise<string | null>}
 */
async function descargarPDF(page, siglo) {
    console.log(`\nIntentando descargar PDF del siglo ${siglo}...`);

    try {
        // Buscar el contenedor del manuscrito específico del siglo
        const manuscritoContainer = await page
            .locator(
                `div:has-text("Siglo ${siglo}"), section:has-text("Siglo ${siglo}"), article:has-text("Siglo ${siglo}")`,
            )
            .first();

        if (!manuscritoContainer) {
            console.log('❌ No se encontró el manuscrito');
            return false;
        }

        const botonDescarga = await manuscritoContainer
            .locator(
                'button:has-text("descargar"), button:has-text("Descargar")',
            )
            .first();

        if ((await botonDescarga.count()) > 0) {
            console.log('Botón de descarga encontrado');

            try {
                // Configurar promesa de descarga ANTES del click con timeout
                const downloadPromise = page.waitForEvent('download', {
                    timeout: 30000,
                });

                // Hacer click en descargar
                await botonDescarga.click();
                console.log('Botón de descarga presionado');

                // Esperar a que se complete la descarga
                const download = await downloadPromise;

                // Guardar el archivo para despues extraer el codigo
                const nombreArchivo = `manuscrito-siglo-${siglo}.pdf`;
                const rutaDestino = path.join(
                    DIRECTORIO_DESCARGAS,
                    nombreArchivo,
                );

                await download.saveAs(rutaDestino);
                console.log(`✅ PDF descargado: ${rutaDestino}`);

                return rutaDestino;
            } catch (downloadError) {
                console.log(
                    '⚠️ Error en la descarga directa, intentando método alternativo...',
                );

                // Intentar con un enfoque alternativo
                await page.waitForTimeout(2000);

                // Verificar si apareció algún modal o diálogo
                const modalError = await page
                    .locator('.modal, [role="dialog"], .alert')
                    .first();
                if ((await modalError.count()) > 0) {
                    console.log('🔍 Detectado modal de error, cerrando...');
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(1000);
                }

                // Intentar click nuevamente
                try {
                    const downloadPromise2 = page.waitForEvent('download', {
                        timeout: 15000,
                    });
                    await botonDescarga.click();
                    console.log('Reintentando descarga...');

                    const download2 = await downloadPromise2;
                    const nombreArchivo = `manuscrito-siglo-${siglo}.pdf`;
                    const rutaDestino = path.join(
                        DIRECTORIO_DESCARGAS,
                        nombreArchivo,
                    );

                    await download2.saveAs(rutaDestino);
                    console.log(
                        `✅ PDF descargado en segundo intento: ${rutaDestino}`,
                    );
                    return rutaDestino;
                } catch (secondError) {
                    console.log('❌ Fallo en segundo intento de descarga');
                    console.log(
                        '💡 Sugerencia: Verificar que el manuscrito esté completamente desbloqueado',
                    );
                    return null;
                }
            }
        }

        console.log('❌ No se encontró botón de descarga');
        return null;
    } catch (error) {
        console.error('Error al descargar PDF:', error.message);
        return null;
    }
}

/**
 * Extrae el código de un PDF.
 * @param {string} rutaPDF
 * @returns {Promise<string | null>}
 */
//TODO: VER ESTO    
async function extraerCodigoDePDF(rutaPDF) {
    try {
        console.log(`📄 Extrayendo código de: ${rutaPDF}`);

        // Método 1: Intentar con pdf-parse
        try {
            const dataBuffer = fs.readFileSync(rutaPDF);
            const data = await pdfParse(dataBuffer);

            const textoCompleto = data.text;
            const patronCodigo = /Código de acceso:\s*([A-Z0-9]+)/i;
            const match = textoCompleto.match(patronCodigo);

            if (match) {
                const codigo = match[1];
                console.log(`✅ Código extraído (pdf-parse): ${codigo}`);
                return codigo;
            }
        } catch (pdfError) {
            console.log('⚠️ pdf-parse falló, intentando método alternativo...');
            console.log(pdfError);
        }

        // Método 2: Leer como texto plano y extraer código
        const contenidoRaw = fs.readFileSync(rutaPDF, 'utf8');

        // Buscar patrón de código en el texto plano
        const patronCodigo = /Código de acceso:\s*([A-Z0-9]+)/i;
        const match = contenidoRaw.match(patronCodigo);

        if (match) {
            const codigo = match[1];
            console.log(`✅ Código extraído (texto plano): ${codigo}`);
            return codigo;
        }

        // Verificar si es el PDF final (sin código)
        const contenidoLimpio = contenidoRaw.toLowerCase();
        if (
            contenidoLimpio.includes('felicitaciones') ||
            contenidoLimpio.includes('completado')
        ) {
            console.log('🎉 Detectado PDF final - Proceso completado');
            return 'FINAL';
        }

        console.log('❌ No se encontró código en el PDF');
        // console.log('📝 Muestra del contenido:', contenidoRaw.substring(0, 500) + '...');
        return null;
    } catch (error) {
        console.error('Error al extraer código del PDF:', error.message);
        return null;
    }
}

//// MAIN FUNCTIONS ////

/**
 * Esta es la funcion principal que se encarga de desbloquear cada manuscrito.
 * @param {Page} page
 */
async function procesarManuscritosPorSiglo(page) {
    console.log('\nIniciando desbloqueo de manuscritos...');

    // 1. Obtener siglos disponibles dinámicamente
    const siglosDisponibles = await obtenerSiglosDisponibles(page);

    if (siglosDisponibles.length === 0) {
        console.log('❌ No se pudieron obtener los siglos disponibles');
        return;
    }

    let codigoActual = null;

    for (let i = 0; i < siglosDisponibles.length; i++) {
        const siglo = siglosDisponibles[i];
        console.log(`\n═══════════════════════════════════════`);
        console.log(`PROCESANDO SIGLO: ${siglo}`);
        console.log(`═══════════════════════════════════════`);

        // Primer manuscrito - verificar si necesita código
        if (i === 0) {
            console.log('Procesando primer manuscrito...');

            // Verificar si el primer manuscrito ya está disponible
            const disponible = await descargarPrimerManuscrito(page, siglo);
            if (!disponible) {
                console.log(
                    '⚠️ El primer manuscrito podría necesitar código de desbloqueo',
                );

                // Intentar con el código conocido del desafío
                const codigoInicial = 'AUREUS1350';
                console.log(
                    `Intentando desbloquear primer manuscrito con código: ${codigoInicial}`,
                );

                const desbloqueado = await desbloquearManuscrito(
                    page,
                    siglo,
                    codigoInicial,
                );
                if (!desbloqueado) {
                    console.log(
                        `❌ No se pudo desbloquear el primer manuscrito del siglo ${siglo}`,
                    );
                    break;
                }

                CODIGOS_CONOCIDOS[siglo] = codigoInicial;
            }
        } else {
            // Manuscritos posteriores requieren código
            if (!codigoActual) {
                console.log(
                    '❌ No hay código disponible para desbloquear este manuscrito',
                );
                break;
            }

            const desbloqueado = await desbloquearManuscrito(
                page,
                siglo,
                codigoActual,
            );
            if (!desbloqueado) {
                console.log(`❌ No se pudo desbloquear el siglo ${siglo}`);
                break;
            }
        }

        // Descargar PDF
        const rutaPDF = await descargarPDF(page, siglo);
        if (!rutaPDF) {
            console.log(`❌ No se pudo descargar el PDF del siglo ${siglo}`);
            break;
        }

        // Extraer código del PDF
        const nuevoCodigo = await extraerCodigoDePDF(rutaPDF);

        if (nuevoCodigo === 'FINAL') {
            console.log(`\n🎉 PROCESO COMPLETADO!`);
            console.log(
                `✅ Todos los manuscritos fueron procesados exitosamente`,
            );
            console.log(`📁 Archivos descargados en: ${DIRECTORIO_DESCARGAS}`);
            return;
        }

        if (!nuevoCodigo) {
            console.log(
                `❌ No se pudo extraer código del PDF del siglo ${siglo}`,
            );
            break;
        }

        // Guardar código para el siguiente siglo
        codigoActual = nuevoCodigo;
        CODIGOS_CONOCIDOS[siglo] = nuevoCodigo;

        console.log(
            `✅ Siglo ${siglo} completado. Código para siguiente siglo: ${codigoActual}`,
        );

        // Pausa adicional
        await page.waitForTimeout(2000);
    }

    console.log('\n✅ Procesamiento finalizado');
}

/**
 * El main.
 */
async function main() {
    console.log('Iniciando Script...');

    // 1. Lanzar el navegador
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000, // Ralentiza las acciones para poder ver
        timeout: 0, // Sin timeout para evitar cierres automáticos
    });

  const page = await browser.newPage();

    try {
        // 2. Autenticación
        console.log('\nAutenticación...');
        await page.goto(URLS.login);
        await page.waitForLoadState('networkidle');

        const campoUsuario = await page.locator(
            'input[type="email"], input[name="email"], input[id="email"]',
        );
        await campoUsuario.fill(CREDENCIALES.usuario);

        const campoContraseña = await page.locator(
            'input[type="password"], input[name="password"], input[id="password"]',
        );
        await campoContraseña.fill(CREDENCIALES.contraseña);

        const botonLogin = await page.locator(
            'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Iniciar")',
        );
        await botonLogin.click();

        await page.waitForLoadState('networkidle');

        if (page.url() !== URLS.login) {
            console.log('✅ LOGIN EXITOSO');
        } else {
            throw new Error('Login falló');
        }

        // 3. Procesar Manuscritos
        await procesarManuscritosPorSiglo(page);

        // Esperar un poco para observar el resultado
        await page.waitForTimeout(3000);
    } catch (error) {
        console.error('Error durante el proceso:', error.message);
    } finally {
        try {
            console.log('\n🔚 Cerrando el portal...');
            await browser.close();
        } catch (closeError) {
            console.log('⚠️ El navegador ya estaba cerrado');
        }
    }
}

main().catch(console.error);

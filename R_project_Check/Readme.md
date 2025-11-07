# README — Evaluación del efecto de “alarmas” sobre feminicidios en municipios de Puebla (2015–2025)

> Proyecto en R que:
>
> 1. limpia y estandariza una base de **delitos municipales**,
> 2. construye un **panel 2015–2025** para Puebla,
> 3. arma etiquetas legibles de municipio (**“código – nombre”**),
> 4. une el **año de instalación de alarmas** y
> 5. estima el efecto con **event-study (Sun & Abraham)** y un **TWFE** (efectos fijos por municipio y año).
>    Incluye salidas en CSV, HTML y PDF listas para exponer.

---

## 1) Requisitos

* **R** (>= 4.1 recomendado).
* Paquetes CRAN: `dplyr`, `tidyr`, `stringr`, `readr`, `janitor`, `lubridate`, `fixest`, `modelsummary`, `tidyselect`.
* Un archivo **delitos_mun_2015_2025.csv** con información municipal (ver “Entradas”).
* (Opcional) **alarmas.csv** con el **año de instalación** por municipio (**cve_mun**).

> El script instala automáticamente cualquier paquete faltante desde CRAN.

---

## 2) Estructura mínima de carpetas

```
tu_proyecto/
  ├── delitos_mun_2015_2025.csv     # TU base de delitos (obligatoria)
  ├── alarmas.csv                   # Años de instalación por municipio (opcional)
  ├── script.R                      # El script principal (el que te pasé)
  └── salidas/                      # (opcional) carpeta para salidas
```

> En el script, cambia `DATA_DIR` si quieres usar otra carpeta.

---

## 3) Archivos de **entrada**

### 3.1. `delitos_mun_2015_2025.csv` (obligatorio)

El script es **robusto** a nombres de columna. Busca automáticamente:

* **Municipio (código):** `cve_mun`, `cve_mnpio`, `cvegeo_mun`, etc.
* **Municipio (nombre):** `nom_mun`, `municipio_nombre`, `municipio` (si **no** es puro número).
* **Estado / entidad:** `estado`, `entidad_federativa`, `cve_ent` (si está).
* **Año:** `anio`, `año`, `year`, `fecha`, `periodo`.
* **Tipo / subtipo de delito:** `tipo_de_delito`, `subtipo_de_delito` (cuando hay meses).
* **Feminicidios:** `feminicidios`, `feminicidio(s)`, `victimas_feminicidio`.
* **Meses** (si la base es mensual tipo SESNSP): `enero`…`diciembre` o `ene`…`dic`.

El script detecta si ya hay una columna explícita de **feminicidios** o si debe:

* **filtrar** las filas de **Feminicidio** (en tipo/subtipo), y
* **sumar los 12 meses** para tener totales anuales.

> Solo se conserva **Puebla (cve_ent = 21)** y el periodo **2015–2025**.

### 3.2. `alarmas.csv` (opcional)

Debe tener:

* `cve_mun` (código municipal de 5 dígitos)
* `anio_instalacion` (año entre 2015 y 2025)

Si no existe, el script **crea un ejemplo** que debes **editar** con datos reales.

---

## 4) ¿Qué produce el script?

* `delitos_puebla_2015_2025.csv`
  Panel de feminicidios por **(municipio, año)** con columnas:

  * `cve_mun` (código de 5 dígitos)
  * `municipio_texto` (nombre legible; p. ej., “Acajete”)
  * `mun_id_nombre` (etiqueta “21001 – Acajete”)
  * `estado` (siempre “Puebla”)
  * `anio` (2015–2025)
  * `feminicidios` (conteo anual)

* `panel_puebla_2015_2025.csv`
  Igual que arriba, pero **completo** (se completan ausencias con 0).

* `ejemplo_exposicion_2025.csv`
  Top de municipios **en 2025** con `mun_id_nombre`, `feminicidios` y estatus de alarma (“pre/post”).

* `modelos_alarmas.html`
  **Event-study (Sun & Abraham)** con FE de municipio y año; errores agrupados por municipio.

* `modelos_alarmas_win55.html`
  Event-study **en ventana [-5, +5]** (reduce colinealidad).

* `modelos_alarmas_twfe.html`
  **TWFE**: regresa `feminicidios ~ tiene_alarma` con FE por municipio y año.

* `modelos_alarmas_pois_nooffset.html`
  **Poisson FE** (sin offset) por si hay muchos ceros.

* `event_study_full.pdf` y `event_study_win55.pdf`
  Gráficas del event-study (completo y con ventana).

* Diagnósticos:

  * `diag_feminicidios_por_anio.csv`
  * `diag_feminicidios_top_municipios.csv`

---

## 5) ¿Cómo se ejecuta?

1. Abre `script.R`.
2. Asegúrate de que `DATA_DIR` apunta a donde está tu `delitos_mun_2015_2025.csv`.
3. (Opcional) Añade/edita `alarmas.csv` con años reales.
4. **Corre el script** completo (Ctrl/Cmd + Shift + Enter en RStudio).

> Las salidas se guardan en `DATA_DIR` (o donde indiques).

---

## 6) Qué hace el script, paso a paso

1. **Carga e instala** paquetes si faltan.
2. **Lee y limpia** la base de delitos:

   * Normaliza nombres de columnas (snake_case).
   * Detecta automáticamente columnas clave (código, nombre, año, estado).
   * Si **no** hay `feminicidios` explícitos, **filtra** “Feminicidio” y **suma meses**.
3. **Filtra Puebla** (cve_ent = 21 si existe; si no, por texto) y **2015–2025**.
4. Crea etiquetas:

   * `municipio_texto` = nombre legible (si no está disponible, usa “Cód. 21001”).
   * `mun_id_nombre` = `cve_mun – municipio_texto` (p. ej. “21001 – Acajete”).
5. **Completa panel** con todos los años 2015–2025 por municipio (rellena ceros).
6. **Une alarmas** por `cve_mun` y crea:

   * `tiene_alarma` (1 si anio ≥ anio_instalacion, 0 en caso contrario o NA).
   * `estatus_alarma` (“pre”, “post”, “sin info”).
7. **Estima modelos**:

   * Event-study (**Sun & Abraham**) con FE de municipio y año (`feols`).
   * **TWFE**: `feminicidios ~ tiene_alarma` con FE por municipio y año.
   * **Poisson FE** (sin offset) como respaldo.
     Exporta tablas (HTML) y gráficas (PDF).

---

## 7) Diccionario de columnas principales

* **cve_mun**: código municipal (5 dígitos, p. ej., “21001”).
* **municipio_texto**: nombre del municipio (p. ej., “Acajete”).
* **mun_id_nombre**: etiqueta “código – nombre” (p. ej., “21001 – Acajete”).
* **anio**: año 2015–2025.
* **feminicidios**: conteo anual.
* **anio_instalacion**: año en que se instaló la alarma (si está).
* **tiene_alarma**: indicador 1/0 (post-tratamiento).
* **estatus_alarma**: “Sin info de alarma / Sin alarma (pre) / Con alarma (post)”.

---

## 8) Metodología de evaluación

* **TWFE (Two-Way Fixed Effects)**
  Regresión OLS con **FE por municipio** y **FE por año**:
  [
  y_{it} = \beta \cdot \text{tiene_alarma}*{it} + \alpha_i + \gamma_t + \varepsilon*{it}
  ]
  donde (y_{it}) son feminicidios en municipio (i) y año (t).
  Errores agrupados por municipio.

* **Event-Study (Sun & Abraham)**
  Implementado con `sunab(cohort, time)` en **fixest**:

  * `cohort` = `anio_instalacion` (año de entrada al tratamiento).
  * `time` = `anio`.
  * Permite ver **leads** (pre-tendencias) y **lags** (efectos dinámicos).
  * Se usa `ref.p = -1` como periodo de referencia (año anterior a la instalación).

* **Poisson FE (sin offset)**
  Útil cuando hay muchos ceros. Si más adelante incorporas **población femenina anual**, cambia a **Poisson con offset** `offset = log(poblacion_femenina)`.

---

## 9) Controles adicionales (opcional)

Si consigues bases de **INEGI/CONAPO** con población o PIB municipal anual, puedes:

1. Cargar CONAPO municipal anual (población femenina `pobfem` y total `pobtot`) y unir por `(cve_mun, anio)`.
2. Construir **tasas**: `tasa_fem_100k = 100000 * feminicidios / pobfem`.
3. Cargar **PIB municipal** e incluir `log_pib_pc` como control.

Ejemplo (esqueleto):

```r
conapo <- read_csv("conapo_poblacion_municipal.csv") %>%
  clean_names() %>%
  transmute(
    cve_mun = str_pad(as.character(cve_mun), 5, pad = "0"),
    anio = as.integer(anio),
    pobfem = as.numeric(pobfem),
    pobtot = as.numeric(pobtot)
  )

pib_mun <- read_csv("pib_municipal_2013_2024.csv") %>%
  clean_names() %>%
  transmute(
    cve_mun = str_pad(as.character(cve_mun), 5, pad = "0"),
    anio = as.integer(anio),
    pib = as.numeric(pib)
  )

panel3 <- panel2 %>%
  left_join(conapo, by = c("cve_mun","anio")) %>%
  left_join(pib_mun, by = c("cve_mun","anio")) %>%
  mutate(
    tasa_fem_100k = if_else(!is.na(pobfem) & pobfem>0, 1e5 * feminicidios / pobfem, NA_real_),
    pib_pc        = if_else(!is.na(pib) & !is.na(pobtot) & pobtot>0, pib/pobtot, NA_real_),
    log_pib_pc    = if_else(!is.na(pib_pc) & pib_pc>0, log(pib_pc), NA_real_)
  )
```

Con eso puedes re-estimar:

```r
m_es_rate <- feols(
  tasa_fem_100k ~ sunab(anio_instalacion, anio, ref.p = -1) + log_pib_pc,
  data = panel3, fixef = c("cve_mun","anio"), cluster = "cve_mun"
)
```

> **Nota:** si no hay población anual, el script ya corre con conteos (es válido al incluir FE por año y municipio).

---

## 10) ¿Por qué me salía el código en `municipio_texto`?

En la base original, algunas columnas rotuladas como “municipio” en realidad traen **el código**.
El script ahora distingue:

* si el “municipio” **tiene letras**, lo toma como **nombre**;
* si **no**, asume que es **código** y usa etiquetas tipo **“Cód. 21001”**.

Si **quieres forzar** un catálogo de nombres (recomendado), prepara un CSV con mapping:

```csv
cve_mun,municipio_texto
21001,Acajete
21002,Acateno
...
```

y júntalo así:

```r
cat_puebla <- read_csv("catalogo_municipios_puebla.csv") %>%
  mutate(cve_mun = str_pad(as.character(cve_mun), 5, pad = "0"),
         municipio_texto = str_to_title(municipio_texto, locale = "es"))

panel2 <- panel2 %>%
  select(-municipio_texto, -mun_id_nombre) %>%
  left_join(cat_puebla, by = "cve_mun") %>%
  mutate(mun_id_nombre = paste0(cve_mun, " – ", municipio_texto))
```

---

## 11) Errores y advertencias comunes

* **“The VCOV matrix is not positive semi-definite…”**
  Suele pasar con muchos ceros o colinealidad. El modelo se “arregla” internamente; reporta de todas formas, pero interpreta con cuidado.

* **“variables removed because of collinearity”**
  Normal en event-study con cohortes poco pobladas. Usa la **ventana [-5,+5]** para reducir colinealidad.

* **Municipio sin nombre legible**
  Tu CSV no trae el nombre textual. Usa el **catálogo** (Sección 10).

* **Todos los `anio_instalacion` son NA**
  Edita `alarmas.csv`. Sin cohortes no hay tratamiento.

---

## 12) Personalización rápida

* **Carpeta de trabajo**: cambia `DATA_DIR`.
* **Período**: modifica `complete(cve_mun, anio = 2015:2025, ...)` y los filtros `between(anio, ...)`.
* **Periodo de referencia** en event-study: `ref.p = -1` (año anterior).
* **Ventana**: cambia `between(et, -5, 5)`.

---

## 13) Interpretación (muy breve)

* **TWFE**: el coeficiente de `tiene_alarma` es la diferencia promedio en feminicidios **post vs pre**, controlando por efectos fijos del municipio (invariantes en el tiempo) y choques comunes por año.
* **Event-Study**: revisa que los **leads (k<0)** estén cerca de 0 (pre-tendencias planas). Observa la **trayectoria** de los lags (k≥0) para el efecto dinámico tras la instalación.

---

## 14) Reproducibilidad

* Deja **bloqueado** `DATA_DIR` al folder del proyecto.
* Guarda `sessionInfo()` al final si necesitas anexarlo a un informe.
* Versiona `alarmas.csv` y cualquier **catálogo** que uses para nombres de municipio.

---

## 15) Próximos pasos / mejoras

* Incorporar **CONAPO** (población femenina anual) y re-estimar **tasas** y **Poisson con offset**.
* Añadir **controles socioeconómicos** (PIB per cápita, urbanización, etc.).
* Reportar **robusteces**: ventanas alternativas, exclusión de outliers, placebo tests.

---

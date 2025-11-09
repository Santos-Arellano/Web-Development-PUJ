# README — Evaluación del efecto de **alarmas** sobre feminicidios en municipios de Puebla (2015–2025)

Proyecto en **R** que:

1. limpia y estandariza una base de **delitos municipales** (tu CSV),
2. construye un **panel 2015–2025** para **Puebla**,
3. agrega etiquetas legibles de municipio (**“código – nombre”**),
4. integra **población femenina municipal (ITER 2020 Puebla)** para calcular **tasas por 100 mil**,
5. une el **año de instalación de alarmas** y
6. estima el efecto con **Event Study (Sun & Abraham)** y **TWFE** (efectos fijos por municipio y año).

Incluye salidas **CSV/HTML/PDF/PNG** listas para exponer y un **gráfico de tendencias** (tratados vs. controles).

---

## 0) TL;DR (arranque rápido)

1. Asegúrate de tener esta estructura (ajusta `DATA_DIR` si usas otra ruta):

```
/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check/
  ├── delitos_mun_2015_2025.csv
  ├── alarmas.csv                     # opcional (si no, se crea ejemplo)
  └── iter_21_cpv2020/
      ├── catalogos/tam_loc.csv.csv
      ├── conjunto_de_datos/conjunto_de_datos_iter_21CSV20.csv
      ├── diccionario_datos/diccionario_datos_iter_21CSV20.csv
      └── metadatos/metadatos_iter_21_cpv2020.txt
```

2. Abre el **script** que te pasé (el último que generamos con ITER + tasas).
3. Verifica que `DATA_DIR` apunte a la carpeta anterior.
4. Ejecuta todo el script.
5. Revisa las salidas (ver sección **5**).

---

## 1) Requisitos

* **R** (≥ 4.1 recomendado).
* Paquetes CRAN:
  `dplyr`, `tidyr`, `stringr`, `readr`, `janitor`, `lubridate`, `fixest`, `modelsummary`, `tidyselect`, `ggplot2`, `scales`.

  > El script los **instala automáticamente** si faltan.
* Archivos de entrada mínimos:

  * `delitos_mun_2015_2025.csv` (obligatorio).
  * Carpeta **ITER Puebla 2020** con las rutas exactas que indicaste (para **población femenina**).
  * `alarmas.csv` (opcional; si no existe, el script crea un **ejemplo** para que lo edites).

---

## 2) Entradas y cómo deben verse

### 2.1 `delitos_mun_2015_2025.csv` (obligatorio)

El script es **robusto** a nombres. Detecta automáticamente:

* **Municipio (código)**: `cve_mun`, `cve_mnpio`, `cvegeo_mun`, `id_municipio`…
* **Municipio (texto)**: `nom_mun`, `municipio_nombre`, `municipio` (si trae letras y no solo dígitos).
* **Estado / entidad**: `estado`, `entidad_federativa`, `cve_ent`…
* **Año**: `anio`, `año`, `year`, `fecha`, `periodo`.
* **Tipo/Subtipo**: `tipo_de_delito`, `subtipo_de_delito` (cuando hay meses).
* **Feminicidios**: `feminicidios`, `feminicidio(s)`, `victimas_feminicidio`.
* **Meses** (si tu base es mensual, como SESNSP): `enero`…`diciembre` o `ene`…`dic`.

El script:

* usa la columna explícita **feminicidios** si ya existe; o
* **filtra** “Feminicidio” en tipo/subtipo y **suma los 12 meses**.

Después **filtra Puebla** (cve_ent==21 cuando esté) y **años 2015–2025**.

### 2.2 ITER Puebla 2020 (obligatorio para tasas)

Rutas usadas por el script (las que tú diste):

* `/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check/iter_21_cpv2020/catalogos/tam_loc.csv.csv`
* `/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check/iter_21_cpv2020/conjunto_de_datos/conjunto_de_datos_iter_21CSV20.csv`
* `/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check/iter_21_cpv2020/diccionario_datos/diccionario_datos_iter_21CSV20.csv`
* `/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check/iter_21_cpv2020/metadatos/metadatos_iter_21_cpv2020.txt`

El script lee el **conjunto de datos** y arma:

* `cve_mun` (5 dígitos) desde **CVEGEO** o **ENT+MUN**,
* `nom_mun` (nombre municipal limpio),
* **población femenina 2020** `pobfem_2020` (y total 2020 `pobtot_2020`):

  * si el archivo trae registros con *ámbito = Municipio*, los usa directo;
  * si no, **suma localidades** por municipio.

> Nota: El archivo del catálogo se llama `tam_loc.csv.csv` con doble `.csv`. Déjalo así (el script lo acepta). Si lo renombras a `tam_loc.csv` no pasa nada siempre que cambies la ruta en el script.

### 2.3 `alarmas.csv` (opcional, pero necesario para la evaluación)

Formato mínimo:

```csv
cve_mun,anio_instalacion
21001,2019
21002,
21003,2021
...
```

* `cve_mun`: **5 dígitos** (21001, 21002, …).
* `anio_instalacion`: año en 2015–2025.
  Si no existe el archivo, el script **genera uno de ejemplo** (con años aleatorios) para que lo edites.

---

## 3) Cómo correr el proyecto

1. Abre el script completo (el último que te di con **ITER + tasas**).
2. Revisa la línea `DATA_DIR <- "/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check"`.
3. Ejecuta **todo** el script (en RStudio: **Cmd/Ctrl + Shift + Enter**).
4. Comprueba que **no hay errores**, y revisa las **salidas** (Sección 5).

---

## 4) Qué hace el script (paso a paso)

1. **Carga paquetes** e instala si faltan.
2. **Lee delitos** y **normaliza** nombres.
3. Construye **feminicidios anuales** (directo o sumando meses) y **filtra Puebla 2015–2025**.
4. **Lee ITER Puebla 2020**, identifica/crea `cve_mun`, limpia `nom_mun` y obtiene **población femenina municipal (`pobfem_2020`)**.
5. **Arma el panel** `(cve_mun × 2015…2025)` y **une** `pobfem_2020`.
6. Calcula **tasa de feminicidios por 100 mil mujeres**:
   `tasa_fem_100k = 100000 * feminicidios / pobfem_2020`
   (denominador **constante 2020** por municipio).
7. **Une alarmas** y crea indicadores:

   * `ever_tratado` (alguna vez instala),
   * `tiene_alarma` (1 si `anio >= anio_instalacion`),
   * `estatus_alarma` (“pre”, “post”, “sin info”).
8. **Modelos**:

   * **Event Study (Sun & Abraham)** con `sunab(anio_instalacion, anio, ref.p = -1)` y **FE** por municipio y año; clúster por municipio.
   * **TWFE**: `feminicidios ~ tiene_alarma` con **FE** por municipio y año.
   * **Poisson FE sin offset** (respaldo) para conteos raros.
9. **Gráficos**:

   * `event_study_full.pdf` y `event_study_win55.pdf` (ventana [-5,+5]).
   * **Tendencias tratados vs. controles** en **tasa**: `tendencias_tratado_control_tasa.png/.pdf` (línea vertical en 2019 de referencia).
10. **Exporta** CSV/HTML/PNG/PDF listos para exponer.

---

## 5) Salidas (qué encontrarás y para qué sirve)

* **Paneles / datos**

  * `delitos_puebla_2015_2025.csv`: feminicidios por municipio–año (Puebla).
  * `panel_puebla_2015_2025_con_pobfem_tasas.csv`: **panel final** con:

    * `municipio`, `cve_mun`, `estado`, `anio`,
    * `feminicidios`, `tasa_fem_100k`,
    * `municipio_texto` (= nombre municipal ITER),
    * `mun_id_nombre` (ej. “21001 – Acajete”),
    * `pobfem_2020`, `pobtot_2020`.
  * `panel_puebla_2015_2025.csv`: versión “simple” (sin pobfem ni tasa) para compatibilidad.

* **Para exponer**

  * `ejemplo_exposicion_2025.csv`: top municipios en **2025** con `mun_id_nombre`, `feminicidios`, `tasa_fem_100k`, `estatus_alarma`.

* **Modelos (tablas HTML)**

  * `modelos_alarmas.html`: **Event Study completo** (OLS + FE).
  * `modelos_alarmas_win55.html`: Event Study en **ventana [-5,+5]**.
  * `modelos_alarmas_twfe.html`: **TWFE** (OLS + FE).
  * `modelos_alarmas_pois_nooffset.html`: **Poisson FE** (sin offset).

* **Gráficas**

  * `event_study_full.pdf` y `event_study_win55.pdf`.
  * `tendencias_tratado_control_tasa.png` y `.pdf` (promedio de tasa por grupo: “tratados alguna vez” vs. “nunca”).

* **Diagnósticos**

  * `diag_feminicidios_por_anio.csv`: suma por año.
  * `diag_feminicidios_top_municipios.csv`: top acumulado 2015–2025.

---

## 6) Diccionario de variables (panel con tasas)

| Columna            | Descripción                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| `cve_mun`          | Código municipal **INEGI** (5 dígitos).                                              |
| `municipio_texto`  | Nombre municipal (limpio) tomado de **ITER**.                                        |
| `mun_id_nombre`    | Etiqueta “**código – nombre**” (ej. “21001 – Acajete”).                              |
| `estado`           | Siempre “Puebla”.                                                                    |
| `anio`             | 2015–2025.                                                                           |
| `feminicidios`     | Conteo anual (delitos).                                                              |
| `pobfem_2020`      | Población femenina municipal (Censo/ITER 2020).                                      |
| `pobtot_2020`      | Población total municipal (Censo/ITER 2020).                                         |
| `tasa_fem_100k`    | `100000 * feminicidios / pobfem_2020`.                                               |
| `anio_instalacion` | Año en que se instaló la alarma (si existe en `alarmas.csv`).                        |
| `tiene_alarma`     | 1 si `anio >= anio_instalacion`, 0 si `anio < anio_instalacion` o NA si no hay info. |
| `estatus_alarma`   | “Sin info de alarma” / “Sin alarma (pre)” / “Con alarma (post)”.                     |
| `ever_tratado`     | 1 si el municipio alguna vez instala alarma.                                         |

---

## 7) Metodología (muy claro y directo)

### 7.1 TWFE (Two-Way Fixed Effects)

Regresión OLS con efectos fijos por municipio y por año:

[
y_{it} = \beta \cdot \text{tiene_alarma}*{it} + \alpha_i + \gamma_t + \varepsilon*{it}
]

* ( y_{it} ): feminicidios (conteo) en municipio (i), año (t).
* (\alpha_i): FE municipio (absorbe diferencias invariables).
* (\gamma_t): FE año (choques comunes).
* Errores **cluster** por municipio.

### 7.2 Event Study (Sun & Abraham)

* `sunab(cohort = anio_instalacion, time = anio, ref.p = -1)` en **fixest**.
* Muestra **leads** (pre-tendencias) y **lags** (efecto dinámico post-instalación).
* `ref.p = -1` usa como referencia el año **previo** a la instalación.
* Se reportan FE por municipio y año, y clúster por municipio.

> Si consigues **población femenina anual** (CONAPO), re-estima en **tasas** o usa **Poisson con offset** `offset = log(pobfem_anual)`.

---

## 8) Gráfico de tendencias (tratados vs. controles)

* Usa **tasas** promediadas por grupo:
  “Tratados (ever)” = municipios que **alguna vez** instalan alarma;
  “Controles (never)” = municipios que **nunca** instalan.
* Línea vertical en **2019** (guía visual del momento típico de instalación; cámbiala si quieres).
* Archivos: `tendencias_tratado_control_tasa.png/.pdf`.

---

## 9) Personalización

* **Carpeta**: cambia `DATA_DIR`.
* **Periodo**: edita `complete(cve_mun, anio = 2015:2025, ...)` y el filtro `between(anio, ...)`.
* **Referencia** event-study: cambia `ref.p = -1`.
* **Ventana**: ajusta `between(et, -5, 5)`.
* **Año línea vertical** del gráfico: cambia `geom_vline(xintercept = 2019, ...)`.

---

## 10) Trucos de verificación

* Ver primeras filas del conjunto ITER:

```r
readr::read_csv(file.path(DATA_DIR, "iter_21_cpv2020/conjunto_de_datos/conjunto_de_datos_iter_21CSV20.csv"),
                show_col_types = FALSE) %>% head()
```

* ¿Cuántos municipios con `pobfem_2020` válidos?

```r
iter_mun %>% summarise(munis = n_distinct(cve_mun), con_pobfem = sum(!is.na(pobfem_2020)))
```

* Top 2025 para exponer:

```r
readr::read_csv(file.path(DATA_DIR, "ejemplo_exposicion_2025.csv")) %>% head(10)
```

---

## 11) Problemas comunes y cómo resolverlos

* **`alarmas.csv` no existe** → el script crea un **ejemplo**. **Edita** con años reales.
* **“variables removed because of collinearity”** → normal con ES. Revisa la versión **ventana [-5,+5]**.
* **“VCOV no es semi-definida positiva”** → aparece con conteos raros / muchos ceros. Se “arregla” internamente; interpreta con cuidado.
* **`municipio_texto` sale como código** → ahora tomamos **`nom_mun` de ITER** para nombrar.
  Si hubiera discrepancias, puedes forzar un catálogo propio y hacer `left_join` por `cve_mun`.
* **Faltan municipios en ITER** → asegúrate de que el conjunto es el **de Puebla (entidad 21)**.
  El script arma `cve_mun` con **CVEGEO** o **ENT+MUN**.

---

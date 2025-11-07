# =========================================================
# 0) Paquetes e instalación (solo CRAN)
# =========================================================
options(repos = c(CRAN = "https://cloud.r-project.org"))
req <- c("dplyr","tidyr","stringr","readr","janitor","lubridate",
         "fixest","modelsummary","tidyselect")
new <- req[!(req %in% installed.packages()[,"Package"])]
if (length(new)) install.packages(new, dependencies = TRUE)

library(dplyr); library(tidyr); library(stringr); library(readr)
library(janitor); library(lubridate); library(fixest); library(modelsummary)
library(tidyselect)
set.seed(21)

# =========================================================
# A) Rutas (ajusta DATA_DIR si hace falta)
# =========================================================
DATA_DIR <- "/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check"
# setwd(DATA_DIR)  # opcional

# Entradas
delitos_file <- file.path(DATA_DIR, "delitos_mun_2015_2025.csv")
alarmas_file <- file.path(DATA_DIR, "alarmas.csv")  # se crea ejemplo si no existe

# Salidas
out_delitos      <- file.path(DATA_DIR, "delitos_puebla_2015_2025.csv")
out_panel        <- file.path(DATA_DIR, "panel_puebla_2015_2025.csv")
out_modelo       <- file.path(DATA_DIR, "modelos_alarmas.html")
out_modelo55     <- file.path(DATA_DIR, "modelos_alarmas_win55.html")
out_pois_nooff   <- file.path(DATA_DIR, "modelos_alarmas_pois_nooffset.html")
out_twfe         <- file.path(DATA_DIR, "modelos_alarmas_twfe.html")
plot_event_all   <- file.path(DATA_DIR, "event_study_full.pdf")
plot_event_win   <- file.path(DATA_DIR, "event_study_win55.pdf")
out_diag_year    <- file.path(DATA_DIR, "diag_feminicidios_por_anio.csv")
out_diag_top     <- file.path(DATA_DIR, "diag_feminicidios_top_municipios.csv")
out_exponer_2025 <- file.path(DATA_DIR, "ejemplo_exposicion_2025.csv")

stopifnot(file.exists(delitos_file))
cat("\n✔ Usando delitos_file en: ", delitos_file, "\n", sep = "")

# =========================================================
# Helpers
# =========================================================
msg_ok   <- function(txt) cat(sprintf("\n✔ %s\n", txt))
msg_step <- function(txt) cat(sprintf("\n=== %s ===\n", txt))

first_col <- function(df, pattern, default = NA_character_) {
  x <- names(dplyr::select(df, tidyselect::matches(pattern)))
  if (length(x) >= 1) x[1] else default
}
first_col_any <- function(df, patterns, default = NA_character_) {
  for (p in patterns) {
    x <- names(dplyr::select(df, tidyselect::matches(p)))
    if (length(x) >= 1) return(x[1])
  }
  default
}

# --- NUEVO: elegir de forma robusta la columna de NOMBRE de municipio ---
pick_mun_name_col <- function(df) {
  # candidatos que suelen ser nombre textual
  cand <- names(dplyr::select(df, tidyselect::matches(
    "(^|_)nom_?mun(icipio)?$|(^|_)municipio_?nombre$|(^|_)nombre_?mun(icipio)?$|(^|_)municipio$|(^|_)mun(icipio)?$"
  )))
  # quitar el cve/código si se coló en cand
  cod_col <- first_col_any(df, c("(^|_)cve_?mun(icipio)?$","(^|_)cve_?mnpio$","(cve|clave|codigo).*mun"))
  cand <- setdiff(cand, cod_col)
  # escoger el primero que tenga letras (no sea puro dígito)
  for (c in cand) {
    v <- df[[c]]
    if (is.factor(v)) v <- as.character(v)
    if (is.character(v)) {
      if (any(grepl("[A-Za-zÁÉÍÓÚÑáéíóúñ]", v), na.rm = TRUE)) return(c)
    }
  }
  NA_character_
}

# =========================================================
# 1) CARGAR Y LIMPIAR DELITOS (Puebla 2015–2025)
# =========================================================
msg_step("Leyendo y limpiando delitos")
delitos_raw <- tryCatch(
  readr::read_csv(delitos_file, locale = readr::locale(encoding = "LATIN1"), show_col_types = FALSE),
  error = function(e) readr::read_csv(delitos_file, show_col_types = FALSE)
) %>% janitor::clean_names()
stopifnot(nrow(delitos_raw) > 0)

# Detectar columnas
nm_cod    <- first_col_any(delitos_raw, c("(^|_)cve_?mun(icipio)?$","(^|_)cve_?mnpio$","(^|_)cvegeo(_mun)?$","(cve|clave|codigo).*mun"))
nm_mun_nm <- pick_mun_name_col(delitos_raw)  # nombre textual (robusto)
nm_edo    <- first_col_any(delitos_raw, c("(^|_)estado$","(^|_)entidad(_federativa)?$"))
nm_cveent <- first_col_any(delitos_raw, c("(^|_)cve_?ent($|_)","(^|_)entidad_?id$"))
nm_anio   <- first_col_any(delitos_raw, c("^anio$","^ano$","año","(^|_)year$","(^|_)periodo$","(^|_)fecha$"))
nm_tipo   <- first_col_any(delitos_raw, c("(^|_)tipo_?de_?delito$","(^|_)tipo$","(^|_)delito$"))
nm_subtp  <- first_col_any(delitos_raw, c("(^|_)subtipo_?de_?delito$","(^|_)subtipo$"))
nm_fem    <- first_col_any(delitos_raw, c("(^|_)femini(cidio|cidios)?$","(^|_)feminicidios$","(^|_)victimas?_?feminicidio$"))

mes_cols <- names(dplyr::select(
  delitos_raw,
  tidyselect::matches("^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$")
))

# Estandarizar
delitos_std <- delitos_raw %>%
  mutate(
    anio = if (!is.na(nm_anio)) as.integer(substr(as.character(.data[[nm_anio]]), 1, 4)) else NA_integer_,
    cve_mun = if (!is.na(nm_cod))
      stringr::str_pad(stringr::str_extract(as.character(.data[[nm_cod]]), "\\d+"), 5, pad = "0")
      else NA_character_,
    mun_nombre_raw = if (!is.na(nm_mun_nm)) as.character(.data[[nm_mun_nm]]) else NA_character_,
    estado  = if (!is.na(nm_edo)) as.character(.data[[nm_edo]]) else NA_character_,
    cve_ent = if (!is.na(nm_cveent)) suppressWarnings(as.integer(stringr::str_extract(as.character(.data[[nm_cveent]]), "\\d+"))) else NA_integer_
  ) %>%
  mutate(
    estado  = dplyr::coalesce(estado, "Puebla")
  )

# Feminicidios (explícito o suma de meses para "Feminicidio")
if (!is.na(nm_fem)) {
  msg_ok("Usando columna explícita de 'feminicidios'.")
  delitos_fem <- delitos_std %>%
    transmute(cve_mun, mun_nombre_raw, estado, cve_ent, anio,
              feminicidios = suppressWarnings(as.integer(.data[[nm_fem]])))
} else if (length(mes_cols) >= 1 && (!is.na(nm_tipo) || !is.na(nm_subtp))) {
  msg_ok("Detectada base mensual por delito; filtrando 'Feminicidio' y sumando meses.")
  delitos_fem <- delitos_std %>%
    mutate(
      es_fem =
        (if (!is.na(nm_tipo))
           stringr::str_detect(as.character(.data[[nm_tipo]]), stringr::regex("femini", ignore_case = TRUE))
         else FALSE) |
        (if (!is.na(nm_subtp))
           stringr::str_detect(as.character(.data[[nm_subtp]]), stringr::regex("femini", ignore_case = TRUE))
         else FALSE)
    ) %>%
    filter(es_fem) %>%
    mutate(across(all_of(mes_cols), ~ suppressWarnings(as.numeric(.x)))) %>%
    rowwise() %>% mutate(feminicidios = sum(c_across(all_of(mes_cols)), na.rm = TRUE)) %>% ungroup() %>%
    transmute(cve_mun, mun_nombre_raw, estado, cve_ent, anio, feminicidios = as.integer(feminicidios))
} else {
  stop("No se pudo identificar 'feminicidios' ni (meses + tipo/subtipo).")
}

# Filtro Puebla + años, y construir etiquetas limpias
has_cveent <- !all(is.na(delitos_fem$cve_ent))
delitos_pue <- delitos_fem %>%
  filter(dplyr::between(anio, 2015L, 2025L)) %>%
  {
    if (has_cveent) filter(., cve_ent == 21L) else
      filter(., stringr::str_detect(tolower(estado), "puebla") | estado %in% c("21","021","Puebla","puebla"))
  } %>%
  mutate(
    cve_mun = stringr::str_pad(as.character(cve_mun), 5, pad = "0"),
    municipio_texto = dplyr::case_when(
      !is.na(mun_nombre_raw) & grepl("[A-Za-zÁÉÍÓÚÑáéíóúñ]", mun_nombre_raw) ~
        stringr::str_to_title(stringr::str_squish(mun_nombre_raw), locale = "es"),
      TRUE ~ NA_character_
    ),
    municipio_texto = if_else(is.na(municipio_texto), paste0("Cód. ", cve_mun), municipio_texto),
    mun_id_nombre   = paste0(cve_mun, " – ", municipio_texto)
  ) %>%
  group_by(cve_mun, municipio_texto, mun_id_nombre, anio) %>%
  summarise(feminicidios = sum(feminicidios, na.rm = TRUE), .groups = "drop") %>%
  mutate(estado = "Puebla") %>%
  # para compatibilidad con tu layout previo
  rename(municipio = cve_mun) %>%  # 'municipio' era el campo primero; lo dejamos como código
  relocate(municipio, .before = 1) %>%
  rename(cve_mun = municipio)

stopifnot(nrow(delitos_pue) > 0)
readr::write_csv(delitos_pue, out_delitos)
msg_ok(paste0("Guardado: ", out_delitos))

# Diagnósticos simples
delitos_pue %>% count(anio, wt = feminicidios, name = "feminicidios_totales") %>%
  arrange(anio) %>% readr::write_csv(out_diag_year)

delitos_pue %>% group_by(municipio_texto, cve_mun) %>%
  summarise(fem_total = sum(feminicidios), .groups="drop") %>%
  arrange(desc(fem_total)) %>% slice_head(n = 20) %>%
  readr::write_csv(out_diag_top)
msg_ok("Exportados diagnósticos (por año y top municipios).")

# =========================================================
# 2) PANEL con etiquetas correctas
# =========================================================
msg_step("Armando panel 2015–2025 (con etiquetas listas)")
mun_ref <- delitos_pue %>% distinct(cve_mun, estado, municipio_texto, mun_id_nombre)

panel <- delitos_pue %>%
  select(cve_mun, anio, feminicidios) %>%
  complete(cve_mun, anio = 2015:2025, fill = list(feminicidios = 0L)) %>%
  left_join(mun_ref, by = "cve_mun") %>%
  mutate(
    estado          = coalesce(estado, "Puebla"),
    mun_id_nombre   = paste0(cve_mun, " – ", municipio_texto)
  ) %>%
  # columna 'municipio' solo por compatibilidad (texto)
  mutate(municipio = municipio_texto) %>%
  select(municipio, cve_mun, estado, anio, feminicidios, municipio_texto, mun_id_nombre) %>%
  arrange(cve_mun, anio)

readr::write_csv(panel, out_panel)
msg_ok(paste0("Guardado panel: ", out_panel))

# =========================================================
# 3) TRATAMIENTO (alarmas) y columnas útiles para exponer
# =========================================================
if (!file.exists(alarmas_file)) {
  cat("\nℹ Creando ejemplo 'alarmas.csv' en: ", alarmas_file, " (EDÍTALO con tus fechas reales)\n", sep = "")
  ejemplo_alarmas <- panel %>% distinct(cve_mun) %>%
    mutate(anio_instalacion = sample(c(2017:2022, NA_integer_), size = dplyr::n(), replace = TRUE))
  readr::write_csv(ejemplo_alarmas, alarmas_file)
}

alarmas <- readr::read_csv(alarmas_file, show_col_types = FALSE) %>%
  clean_names() %>%
  transmute(
    cve_mun = stringr::str_pad(as.character(cve_mun), 5, pad = "0"),
    anio_instalacion = as.integer(anio_instalacion)
  ) %>%
  mutate(anio_instalacion = if_else(anio_instalacion %in% 2015:2025, anio_instalacion, NA_integer_))

panel2 <- panel %>%
  left_join(alarmas, by = "cve_mun") %>%
  mutate(
    tiene_alarma = !is.na(anio_instalacion) & anio >= anio_instalacion,
    estatus_alarma = dplyr::case_when(
      is.na(anio_instalacion)  ~ "Sin info de alarma",
      anio < anio_instalacion  ~ "Sin alarma (pre)",
      anio >= anio_instalacion ~ "Con alarma (post)"
    )
  )

# Top 2025 para exponer
panel2 %>%
  filter(anio == 2025) %>%
  arrange(desc(feminicidios)) %>%
  select(mun_id_nombre, cve_mun, municipio_texto, anio, feminicidios, estatus_alarma) %>%
  slice_head(n = 30) %>%
  readr::write_csv(out_exponer_2025)

# =========================================================
# 4) Event-study (Sun & Abraham) + tablas/plots
# =========================================================
msg_step("Estimación DiD con evento (fixest)")
stopifnot(any(!is.na(panel2$anio_instalacion)))

fml_es <- feminicidios ~ sunab(anio_instalacion, anio, ref.p = -1)
m_es <- feols(fml_es, data = panel2, fixef = c("cve_mun","anio"), cluster = "cve_mun")
print(summary(m_es))
pdf(plot_event_all, width = 8, height = 5); try(iplot(m_es), silent = TRUE); dev.off()
modelsummary(list("Event study (Sun-Abraham) – OLS" = m_es), output = out_modelo)
msg_ok(paste0("Tabla exportada: ", out_modelo))

# =========================================================
# 4b) TWFE simple (lo que pediste): FE por municipio y año
# =========================================================
msg_step("Regresión TWFE (FE municipio y año)")
m_twfe <- feols(
  feminicidios ~ tiene_alarma,
  data    = panel2,
  fixef   = c("cve_mun","anio"),
  cluster = "cve_mun"
)
print(summary(m_twfe))
modelsummary(list("TWFE – OLS (FE mun & año)" = m_twfe), output = out_twfe)
msg_ok(paste0("Tabla exportada: ", out_twfe))

# =========================================================
# 5) Ventana [-5, +5] y pruebas conjuntas
# =========================================================
msg_step("ES con ventana de evento [-5, +5] + pruebas conjuntas")
panel2_event <- panel2 %>%
  mutate(et = anio - anio_instalacion) %>%
  filter(is.na(anio_instalacion) | dplyr::between(et, -5, 5))

m_es_short <- feols(
  feminicidios ~ sunab(anio_instalacion, anio, ref.p = -1),
  data = panel2_event, fixef = c("cve_mun","anio"), cluster = "cve_mun"
)
print(summary(m_es_short))
pdf(plot_event_win, width = 8, height = 5); try(iplot(m_es_short), silent = TRUE); dev.off()
modelsummary(list("ES ventana [-5,5] – OLS" = m_es_short), output = out_modelo55)
msg_ok(paste0("Tabla exportada: ", out_modelo55))

# =========================================================
# 6) Poisson FE SIN offset (respaldo)
# =========================================================
msg_step("Poisson FE sin offset (respaldo)")
m_pois_nooff <- fepois(
  feminicidios ~ sunab(anio_instalacion, anio, ref.p = -1),
  data = panel2, fixef = c("cve_mun","anio"), cluster = "cve_mun"
)
print(summary(m_pois_nooff))
modelsummary(list("Poisson FE (sin offset)" = m_pois_nooff), output = out_pois_nooff)
msg_ok(paste0("Tabla exportada: ", out_pois_nooff))

cat("\n✅ Listo para exponer. Revisa:\n- ", out_delitos,
    "\n- ", out_panel,
    "\n- ", out_exponer_2025,
    "\n- ", out_modelo,
    "\n- ", out_modelo55,
    "\n- ", out_twfe,
    "\n- ", out_pois_nooff,
    "\n- ", plot_event_all,
    "\n- ", plot_event_win, "\n", sep = "")

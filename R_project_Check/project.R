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

# Entradas (solo tu CSV de delitos + alarmas si lo tienes)
delitos_file <- file.path(DATA_DIR, "delitos_mun_2015_2025.csv")
alarmas_file <- file.path(DATA_DIR, "alarmas.csv")  # se crea ejemplo si no existe

# Salidas
out_delitos    <- file.path(DATA_DIR, "delitos_puebla_2015_2025.csv")
out_panel      <- file.path(DATA_DIR, "panel_puebla_2015_2025.csv")
out_modelo     <- file.path(DATA_DIR, "modelos_alarmas.html")
out_modelo55   <- file.path(DATA_DIR, "modelos_alarmas_win55.html")
out_pois_nooff <- file.path(DATA_DIR, "modelos_alarmas_pois_nooffset.html")
plot_event_all <- file.path(DATA_DIR, "event_study_full.pdf")
plot_event_win <- file.path(DATA_DIR, "event_study_win55.pdf")
out_diag_year  <- file.path(DATA_DIR, "diag_feminicidios_por_anio.csv")
out_diag_top   <- file.path(DATA_DIR, "diag_feminicidios_top_municipios.csv")

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

# =========================================================
# 1) CARGAR Y LIMPIAR DELITOS (Puebla 2015–2025)
#    Soporta:
#    (A) Base mensual (SESNSP) con columnas de meses + tipo/subtipo
#    (B) Base ya agregada con columna 'feminicidios'
# =========================================================
msg_step("Leyendo y limpiando delitos")
delitos_raw <- tryCatch(
  readr::read_csv(delitos_file, locale = readr::locale(encoding = "LATIN1"), show_col_types = FALSE),
  error = function(e) readr::read_csv(delitos_file, show_col_types = FALSE)
) %>% janitor::clean_names()
stopifnot(nrow(delitos_raw) > 0)

# Detectar columnas relevantes (robusto a nombres distintos)
nm_mun    <- first_col_any(delitos_raw, c("(^|_)mun(icipio)?$","(^|_)nom_?mun(icipio)?$","(^|_)municipio_?nombre$"))
nm_cod    <- first_col_any(delitos_raw, c("(^|_)cve_?mun(icipio)?$","(^|_)cve_?mnpio$","(^|_)cvegeo(_mun)?$","(cve|clave|codigo).*mun","(^|_)id_?(mun|municipio)$"))
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
    municipio = if (!is.na(nm_mun)) as.character(.data[[nm_mun]]) else NA_character_,
    cve_mun = if (!is.na(nm_cod))
      stringr::str_pad(stringr::str_extract(as.character(.data[[nm_cod]]), "\\d+"), 5, pad = "0")
      else as.character(municipio),
    estado  = if (!is.na(nm_edo)) as.character(.data[[nm_edo]]) else NA_character_,
    cve_ent = if (!is.na(nm_cveent)) suppressWarnings(as.integer(stringr::str_extract(as.character(.data[[nm_cveent]]), "\\d+"))) else NA_integer_
  ) %>%
  mutate(
    municipio = dplyr::coalesce(stringr::str_squish(municipio), cve_mun),
    estado    = dplyr::coalesce(estado, "Puebla")
  )

# Feminicidios: usa columna explícita si existe; si no, filtra por tipo/subtipo y suma meses
if (!is.na(nm_fem)) {
  msg_ok("Usando columna explícita de 'feminicidios'.")
  delitos_fem <- delitos_std %>%
    transmute(municipio, cve_mun, estado, cve_ent, anio,
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
    transmute(municipio, cve_mun, estado, cve_ent, anio, feminicidios = as.integer(feminicidios))
} else {
  stop("No se pudo identificar 'feminicidios' ni (meses + tipo/subtipo).")
}

# Filtro Puebla y años (2015–2025)
has_cveent <- !all(is.na(delitos_fem$cve_ent))
delitos_pue <- delitos_fem %>%
  filter(dplyr::between(anio, 2015L, 2025L)) %>%
  {
    if (has_cveent) filter(., cve_ent == 21L) else
      filter(., stringr::str_detect(tolower(estado), "puebla") | estado %in% c("21","021","Puebla","puebla"))
  } %>%
  group_by(municipio, cve_mun, anio) %>%
  summarise(feminicidios = sum(feminicidios, na.rm = TRUE), .groups = "drop") %>%
  mutate(
    cve_mun      = if_else(stringr::str_detect(cve_mun, "^\\d+$"), stringr::str_pad(cve_mun, 5, pad = "0"), cve_mun),
    municipio    = as.character(municipio),
    feminicidios = as.integer(replace_na(feminicidios, 0L))
  )

stopifnot(nrow(delitos_pue) > 0)
readr::write_csv(delitos_pue, out_delitos)
msg_ok(paste0("Guardado: ", out_delitos))

# Diagnósticos simples
diag_year <- delitos_pue %>% count(anio, wt = feminicidios, name = "feminicidios_totales") %>% arrange(anio)
readr::write_csv(diag_year, out_diag_year)

diag_top <- delitos_pue %>% group_by(municipio) %>% summarise(fem_total = sum(feminicidios), .groups="drop") %>%
  arrange(desc(fem_total)) %>% slice_head(n = 20)
readr::write_csv(diag_top, out_diag_top)
msg_ok("Exportados diagnósticos (por año y top municipios).")

# =========================================================
# 2) PANEL (sin controles externos; FE capturan invarianza)
# =========================================================
msg_step("Armando panel 2015–2025 (sin controles externos)")
panel <- delitos_pue %>%
  complete(cve_mun, anio = 2015:2025, fill = list(feminicidios = 0L)) %>%
  left_join(delitos_pue %>% distinct(cve_mun, municipio), by = "cve_mun")

readr::write_csv(panel, out_panel)
msg_ok(paste0("Guardado panel: ", out_panel))

# =========================================================
# 3) TRATAMIENTO (alarmas)
#     Requiere archivo con columnas: cve_mun, anio_instalacion
#     Si no existe, se crea un ejemplo (EDITA con tus años reales)
# =========================================================
if (!file.exists(alarmas_file)) {
  cat("\nℹ Creando ejemplo 'alarmas.csv' en: ", alarmas_file, " (EDÍTALO con tus fechas reales)\n", sep = "")
  ejemplo_alarmas <- panel %>%
    distinct(cve_mun) %>%
    mutate(anio_instalacion = sample(c(2017:2022, NA_integer_), size = dplyr::n(), replace = TRUE))
  readr::write_csv(ejemplo_alarmas, alarmas_file)
}

alarmas <- readr::read_csv(alarmas_file, show_col_types = FALSE) %>%
  janitor::clean_names() %>%
  transmute(
    cve_mun = stringr::str_pad(as.character(cve_mun), 5, pad = "0"),
    anio_instalacion = as.integer(anio_instalacion)
  ) %>%
  mutate(anio_instalacion = if_else(anio_instalacion %in% 2015:2025, anio_instalacion, NA_integer_))

panel2 <- panel %>% left_join(alarmas, by = "cve_mun")
stopifnot(nrow(panel2) > 0)

# =========================================================
# 4) DiD con evento (Sun & Abraham) – FE municipio y año
# =========================================================
msg_step("Estimación DiD con evento (fixest)")

has_treated <- any(!is.na(panel2$anio_instalacion))
if (!has_treated) stop("Todos los 'anio_instalacion' son NA. Edita 'alarmas.csv' con años reales.")

# Modelo OLS con FE (conteos; no hay tasas porque no tenemos población anual)
fml <- feminicidios ~ sunab(anio_instalacion, anio)
m_es <- fixest::feols(
  fml,
  data    = panel2,
  fixef   = c("cve_mun","anio"),
  cluster = "cve_mun"
)
print(summary(m_es))
pdf(plot_event_all, width = 8, height = 5); try(iplot(m_es), silent = TRUE); dev.off()
msg_ok(paste0("Gráfico ES (full) exportado: ", plot_event_all))

modelsummary::modelsummary(list("Event study (Sun-Abraham) – OLS" = m_es), output = out_modelo)
msg_ok(paste0("Tabla exportada: ", out_modelo))

# =========================================================
# 5) Ventana de evento [-5, +5] (reduce colinealidad) + pruebas conjuntas
# =========================================================
msg_step("ES con ventana de evento [-5, +5] + pruebas conjuntas")
panel2_event <- panel2 %>%
  mutate(et = anio - anio_instalacion) %>%
  filter(is.na(anio_instalacion) | dplyr::between(et, -5, 5))

m_es_short <- fixest::feols(
  feminicidios ~ sunab(anio_instalacion, anio),
  data = panel2_event,
  fixef = c("cve_mun","anio"),
  cluster = "cve_mun"
)
print(summary(m_es_short))
pdf(plot_event_win, width = 8, height = 5); try(iplot(m_es_short), silent = TRUE); dev.off()
msg_ok(paste0("Gráfico ES (ventana [-5,5]) exportado: ", plot_event_win))

modelsummary::modelsummary(list("ES ventana [-5,5] – OLS" = m_es_short), output = out_modelo55)
msg_ok(paste0("Tabla exportada: ", out_modelo55))

# ---- Pruebas conjuntas robustas (detecta nombres con o sin ':cohort::AAAA')
coef_names <- names(coef(m_es_short))
event_k <- function(x) { k <- stringr::str_extract(x, "(?<=anio::)-?\\d+"); suppressWarnings(as.integer(k)) }
k_vals  <- vapply(coef_names, event_k, integer(1))
is_event <- !is.na(k_vals)
lead_coefs <- coef_names[is_event & k_vals <= -1]   # PRE
post_coefs <- coef_names[is_event & k_vals >=  0]   # POST

if (length(lead_coefs) >= 1) {
  cat("\n== Wald PRE (todos los leads = 0) ==\n")
  print(fixest::wald(m_es_short, paste(lead_coefs, "= 0")))
}
if (length(post_coefs) >= 1) {
  cat("\n== Wald POST (todos los lags = 0) ==\n")
  print(fixest::wald(m_es_short, paste(post_coefs, "= 0")))
  # Promedio POST = 0
  R <- matrix(0, nrow = 1, ncol = length(coef(m_es_short))); colnames(R) <- names(coef(m_es_short))
  R[1, post_coefs] <- 1 / length(post_coefs)
  cat("\n== Wald PROMEDIO POST (prom(lags) = 0) ==\n")
  print(fixest::wald(m_es_short, R = R, r = 0))
}

# =========================================================
# 6) Poisson FE SIN offset (respaldo para conteos raros, sin población)
# =========================================================
msg_step("Poisson FE sin offset (respaldo)")
m_pois_nooff <- fixest::fepois(
  feminicidios ~ sunab(anio_instalacion, anio),
  data    = panel2,
  fixef   = c("cve_mun","anio"),
  cluster = "cve_mun"
)
print(summary(m_pois_nooff))
modelsummary::modelsummary(list("Poisson FE (sin offset)" = m_pois_nooff), output = out_pois_nooff)
msg_ok(paste0("Tabla exportada: ", out_pois_nooff))

cat("\n✅ Flujo completo finalizado. Revisa salidas en:\n- ", out_delitos,
    "\n- ", out_panel,
    "\n- ", out_modelo,
    "\n- ", out_modelo55,
    "\n- ", out_pois_nooff,
    "\n- ", plot_event_all,
    "\n- ", plot_event_win, "\n", sep = "")

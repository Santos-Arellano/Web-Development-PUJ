# =========================================================
# 0) Paquetes e instalación (solo CRAN)
# =========================================================
options(repos = c(CRAN = "https://cloud.r-project.org"))
req <- c("dplyr","tidyr","stringr","readr","janitor","lubridate",
         "fixest","modelsummary","tidyselect","ggplot2","scales")
new <- req[!(req %in% installed.packages()[,"Package"])]
if (length(new)) install.packages(new, dependencies = TRUE)

library(dplyr); library(tidyr); library(stringr); library(readr)
library(janitor); library(lubridate); library(fixest); library(modelsummary)
library(tidyselect); library(ggplot2); library(scales)

set.seed(21)

# =========================================================
# A) Rutas
# =========================================================
DATA_DIR <- "/Users/santosa/Documents/GitHub/Web-Development-PUJ/R_project_Check"
# ---- Delitos y alarmas
delitos_file <- file.path(DATA_DIR, "delitos_mun_2015_2025.csv")
alarmas_file <- file.path(DATA_DIR, "alarmas.csv")  # ejemplo si no existe

# ---- ITER 2020 Puebla (rutas exactas que compartiste)
iter_dir   <- file.path(DATA_DIR, "iter_21_cpv2020")
iter_tam   <- file.path(iter_dir, "catalogos", "tam_loc.csv.csv")
iter_dd    <- file.path(iter_dir, "diccionario_datos", "diccionario_datos_iter_21CSV20.csv")
iter_conj  <- file.path(iter_dir, "conjunto_de_datos", "conjunto_de_datos_iter_21CSV20.csv")
iter_meta  <- file.path(iter_dir, "metadatos", "metadatos_iter_21_cpv2020.txt")

# ---- Salidas
out_delitos        <- file.path(DATA_DIR, "delitos_puebla_2015_2025.csv")
out_panel          <- file.path(DATA_DIR, "panel_puebla_2015_2025.csv")
out_panel_rates    <- file.path(DATA_DIR, "panel_puebla_2015_2025_con_pobfem_tasas.csv")
out_exponer_2025   <- file.path(DATA_DIR, "ejemplo_exposicion_2025.csv")
out_diag_year      <- file.path(DATA_DIR, "diag_feminicidios_por_anio.csv")
out_diag_top       <- file.path(DATA_DIR, "diag_feminicidios_top_municipios.csv")
out_modelo         <- file.path(DATA_DIR, "modelos_alarmas.html")
out_modelo55       <- file.path(DATA_DIR, "modelos_alarmas_win55.html")
out_pois_nooff     <- file.path(DATA_DIR, "modelos_alarmas_pois_nooffset.html")
out_twfe           <- file.path(DATA_DIR, "modelos_alarmas_twfe.html")
plot_event_all     <- file.path(DATA_DIR, "event_study_full.pdf")
plot_event_win     <- file.path(DATA_DIR, "event_study_win55.pdf")
plot_trend_png     <- file.path(DATA_DIR, "tendencias_tratado_control_tasa.png")
plot_trend_pdf     <- file.path(DATA_DIR, "tendencias_tratado_control_tasa.pdf")

stopifnot(file.exists(delitos_file))

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
# =========================================================
msg_step("Leyendo y limpiando delitos")
delitos_raw <- tryCatch(
  readr::read_csv(delitos_file, locale = readr::locale(encoding = "LATIN1"), show_col_types = FALSE),
  error = function(e) readr::read_csv(delitos_file, show_col_types = FALSE)
) %>% janitor::clean_names()
stopifnot(nrow(delitos_raw) > 0)

# Detectar columnas relevantes
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

# Feminicidios
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

# Filtro Puebla (cve_ent==21 si existe) + años
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
    cve_mun      = if_else(stringr::str_detect(cve_mun, "^\\d+$"),
                           stringr::str_pad(cve_mun, 5, pad = "0"), cve_mun),
    municipio    = as.character(municipio),
    estado       = "Puebla",
    feminicidios = as.integer(replace_na(feminicidios, 0L))
  )

stopifnot(nrow(delitos_pue) > 0)
readr::write_csv(delitos_pue, out_delitos)
msg_ok(paste0("Guardado: ", out_delitos))

# =========================================================
# 2) CARGAR ITER 2020 PUEBLA y OBTENER POBLACIÓN FEMENINA MUNICIPAL (pobfem_2020)
# =========================================================
msg_step("Leyendo ITER Puebla 2020 y calculando pobfem municipal")

# Lecturas rápidas para que puedas "ver los datos"
if (file.exists(iter_tam))  suppressMessages(print(head(readr::read_csv(iter_tam, show_col_types = FALSE))))
if (file.exists(iter_dd))   suppressMessages(print(head(readr::read_csv(iter_dd,  show_col_types = FALSE))))
if (file.exists(iter_meta)) suppressMessages(cat(readLines(iter_meta, n = 10), sep = "\n"))

stopifnot(file.exists(iter_conj))
iter_raw <- readr::read_csv(iter_conj, locale = readr::locale(encoding="LATIN1"), show_col_types = FALSE) %>%
  janitor::clean_names()

# Detectores
nm_ent   <- first_col_any(iter_raw, c("^ent$","^cve_?ent$","entidad"))
nm_mun   <- first_col_any(iter_raw, c("^mun$","^cve_?mun$","^mun_id$"))
nm_loc   <- first_col_any(iter_raw, c("^loc$","^cve_?loc$","localidad"))
nm_cvegeo<- first_col_any(iter_raw, c("^cvegeo"))
nm_nom_m <- first_col_any(iter_raw, c("(^|_)nom_?mun(icipio)?$"))
nm_nom_l <- first_col_any(iter_raw, c("(^|_)nom_?loc(alidad)?$"))
nm_pobf  <- first_col_any(iter_raw, c("^pobfem$","pob_?fem","poblacion_?femenina"))
nm_pobt  <- first_col_any(iter_raw, c("^pobtot$","pob_?tot","poblacion(_)?total"))
nm_amb   <- first_col_any(iter_raw, c("^ambito$","^ámbito$","^ambito_?geo$"))

# Armar cve_mun 5 dígitos desde CVEGEO o ENT+MUN
iter_tmp <- iter_raw %>%
  mutate(
    ent_chr = if (!is.na(nm_ent)) stringr::str_pad(as.character(.data[[nm_ent]]), 2, pad = "0") else NA_character_,
    mun_chr = if (!is.na(nm_mun)) stringr::str_pad(as.character(.data[[nm_mun]]), 3, pad = "0") else NA_character_,
    cvegeo  = if (!is.na(nm_cvegeo)) as.character(.data[[nm_cvegeo]]) else NA_character_,
    cve_mun = dplyr::case_when(
      !is.na(cvegeo) & nchar(gsub("\\D","", cvegeo)) >= 5 ~ substr(gsub("\\D","", cvegeo), 1, 5),
      !is.na(ent_chr) & !is.na(mun_chr) ~ paste0(ent_chr, mun_chr),
      TRUE ~ NA_character_
    ),
    nom_mun = if (!is.na(nm_nom_m)) as.character(.data[[nm_nom_m]])
              else NA_character_,
    nom_loc = if (!is.na(nm_nom_l)) as.character(.data[[nm_nom_l]])
              else NA_character_,
    pobfem  = if (!is.na(nm_pobf)) suppressWarnings(as.numeric(.data[[nm_pobf]])) else NA_real_,
    pobtot  = if (!is.na(nm_pobt)) suppressWarnings(as.numeric(.data[[nm_pobt]])) else NA_real_,
    ambito  = if (!is.na(nm_amb))  as.character(.data[[nm_amb]]) else NA_character_
  ) %>%
  filter(!is.na(cve_mun))

# Si hay "ámbito == Municipio", úsalo. Si no, suma localidades a nivel municipio.
if ("ambito" %in% names(iter_tmp) && any(grepl("Municipio", iter_tmp$ambito, ignore.case = TRUE))) {
  iter_mun <- iter_tmp %>%
    filter(grepl("Municipio", ambito, ignore.case = TRUE)) %>%
    transmute(cve_mun, nom_mun,
              pobfem_2020 = pobfem, pobtot_2020 = pobtot) %>%
    distinct(cve_mun, .keep_all = TRUE)
} else {
  iter_mun <- iter_tmp %>%
    group_by(cve_mun, nom_mun) %>%
    summarise(pobfem_2020 = sum(pobfem, na.rm = TRUE),
              pobtot_2020 = sum(pobtot, na.rm = TRUE), .groups = "drop")
}

# Limpieza del nombre municipal y etiqueta "código – nombre"
iter_mun <- iter_mun %>%
  mutate(
    nom_mun = ifelse(!is.na(nom_mun) & nom_mun != "",
                     stringr::str_to_title(stringr::str_squish(nom_mun), locale = "es"),
                     paste0("Cód. ", cve_mun)),
    mun_id_nombre = paste0(cve_mun, " – ", nom_mun)
  )

msg_ok("pobfem_2020 y nombre municipal listos desde ITER.")

# =========================================================
# 3) ARMAR PANEL, UNIR ITER, CALCULAR TASAS, ARMAR ETIQUETAS
# =========================================================
msg_step("Armando panel y uniendo población femenina 2020")
# Panel base (completo 2015–2025) y etiquetas desde ITER
panel <- delitos_pue %>%
  select(cve_mun, anio, feminicidios) %>%
  complete(cve_mun, anio = 2015:2025, fill = list(feminicidios = 0L)) %>%
  left_join(iter_mun %>% select(cve_mun, nom_mun, mun_id_nombre, pobfem_2020, pobtot_2020), by = "cve_mun") %>%
  mutate(
    municipio_texto = nom_mun,
    municipio       = municipio_texto,
    estado          = "Puebla",
    tasa_fem_100k   = if_else(!is.na(pobfem_2020) & pobfem_2020 > 0,
                              100000 * feminicidios / pobfem_2020, NA_real_)
  ) %>%
  select(municipio, cve_mun, estado, anio, feminicidios, tasa_fem_100k,
         municipio_texto, mun_id_nombre, pobfem_2020, pobtot_2020) %>%
  arrange(cve_mun, anio)

readr::write_csv(panel, out_panel_rates)
msg_ok(paste0("Guardado panel con tasas: ", out_panel_rates))

# También guardamos el panel “simple” por compatibilidad
readr::write_csv(panel %>% select(municipio, cve_mun, estado, anio, feminicidios,
                                  municipio_texto, mun_id_nombre),
                 out_panel)
msg_ok(paste0("Guardado panel simple: ", out_panel))

# Diagnósticos
panel %>% count(anio, wt = feminicidios, name = "feminicidios_totales") %>%
  arrange(anio) %>% readr::write_csv(out_diag_year)
panel %>% group_by(municipio_texto, cve_mun) %>%
  summarise(fem_total = sum(feminicidios), .groups="drop") %>%
  arrange(desc(fem_total)) %>% slice_head(n = 20) %>% readr::write_csv(out_diag_top)
msg_ok("Exportados diagnósticos (por año y top municipios).")

# =========================================================
# 4) TRATAMIENTO (alarmas) y columnas útiles
# =========================================================
if (!file.exists(alarmas_file)) {
  cat("\nℹ Creando ejemplo 'alarmas.csv' en: ", alarmas_file, " (EDÍTALO con tus fechas reales)\n", sep = "")
  ejemplo_alarmas <- panel %>%
    distinct(cve_mun) %>%
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
    ever_tratado  = !is.na(anio_instalacion),
    tiene_alarma  = !is.na(anio_instalacion) & anio >= anio_instalacion,
    estatus_alarma = dplyr::case_when(
      is.na(anio_instalacion)  ~ "Sin info de alarma",
      anio < anio_instalacion  ~ "Sin alarma (pre)",
      anio >= anio_instalacion ~ "Con alarma (post)"
    )
  )

# Auxiliar para exponer (año 2025)
panel2 %>%
  filter(anio == 2025) %>%
  arrange(desc(feminicidios)) %>%
  select(mun_id_nombre, cve_mun, municipio_texto, anio, feminicidios, tasa_fem_100k,
         estatus_alarma, pobfem_2020) %>%
  slice_head(n = 30) %>%
  readr::write_csv(out_exponer_2025)

# =========================================================
# 5) MODELOS: Event Study (Sun-Abraham) y TWFE con FE por municipio y año
# =========================================================
msg_step("Estimación DiD con evento (fixest)")
stopifnot(any(!is.na(panel2$anio_instalacion)))

# OLS con FE (conteos)
m_es <- feols(feminicidios ~ sunab(anio_instalacion, anio, ref.p = -1),
              data = panel2, fixef = c("cve_mun","anio"), cluster = "cve_mun")
print(summary(m_es))
pdf(plot_event_all, width = 8, height = 5); try(iplot(m_es), silent = TRUE); dev.off()
modelsummary(list("Event study (Sun-Abraham) – OLS" = m_es), output = out_modelo)
msg_ok(paste0("Tabla exportada: ", out_modelo))

# TWFE simple (lo que te pidieron): FE municipio y año
msg_step("Regresión TWFE (FE municipio y año)")
m_twfe <- feols(feminicidios ~ tiene_alarma,
                data = panel2, fixef = c("cve_mun","anio"), cluster = "cve_mun")
print(summary(m_twfe))
modelsummary(list("TWFE – OLS (FE mun & año)" = m_twfe), output = out_twfe)
msg_ok(paste0("Tabla exportada: ", out_twfe))

# Ventana [-5,+5] para el ES (reduce colinealidad)
msg_step("ES con ventana de evento [-5, +5]")
panel2_event <- panel2 %>%
  mutate(et = anio - anio_instalacion) %>%
  filter(is.na(anio_instalacion) | dplyr::between(et, -5, 5))
m_es_short <- feols(feminicidios ~ sunab(anio_instalacion, anio, ref.p = -1),
                    data = panel2_event, fixef = c("cve_mun","anio"), cluster = "cve_mun")
print(summary(m_es_short))
pdf(plot_event_win, width = 8, height = 5); try(iplot(m_es_short), silent = TRUE); dev.off()
modelsummary(list("ES ventana [-5,5] – OLS" = m_es_short), output = out_modelo55)
msg_ok(paste0("Tabla exportada: ", out_modelo55))

# Poisson FE sin offset (respaldo para conteos raros)
msg_step("Poisson FE sin offset (respaldo)")
m_pois_nooff <- fepois(feminicidios ~ sunab(anio_instalacion, anio, ref.p = -1),
                       data = panel2, fixef = c("cve_mun","anio"), cluster = "cve_mun")
print(summary(m_pois_nooff))
modelsummary(list("Poisson FE (sin offset)" = m_pois_nooff), output = out_pois_nooff)
msg_ok(paste0("Tabla exportada: ", out_pois_nooff))

# =========================================================
# 6) EXTRA: Gráfico de tendencias (tratados vs controles) usando TASA
#     - ever_tratado = municipios que alguna vez instalan alarma
#     - control      = municipios que nunca instalan
# =========================================================
msg_step("Gráfico de tendencias tratados vs. controles (tasa por 100k)")

trend <- panel2 %>%
  mutate(grupo = if_else(ever_tratado, "Tratados (ever)", "Controles (never)")) %>%
  group_by(anio, grupo) %>%
  summarise(tasa_prom = mean(tasa_fem_100k, na.rm = TRUE), .groups = "drop")

p_trend <- ggplot(trend, aes(x = anio, y = tasa_prom, linetype = grupo)) +
  geom_line(size = 1) +
  geom_point() +
  geom_vline(xintercept = 2019, linetype = "dashed") +
  labs(title = "Tendencias de tasa de feminicidios (por 100 mil mujeres)",
       subtitle = "Promedio anual por grupo: municipios que alguna vez instalan alarma vs. nunca",
       x = "Año", y = "Tasa por 100 mil", linetype = "Grupo") +
  scale_x_continuous(breaks = 2015:2025) +
  theme_minimal(base_size = 12)

ggsave(plot_trend_png, p_trend, width = 9, height = 5, dpi = 300)
ggsave(plot_trend_pdf, p_trend, width = 9, height = 5)
msg_ok(paste0("Gráficos de tendencias exportados: ",
              basename(plot_trend_png), " y ", basename(plot_trend_pdf)))

cat("\n✅ Listo. Revisa archivos clave:\n- ", out_panel_rates,
    "\n- ", out_exponer_2025,
    "\n- ", out_modelo, "\n- ", out_modelo55, "\n- ", out_twfe,
    "\n- ", out_pois_nooff,
    "\n- ", plot_event_all, "\n- ", plot_event_win,
    "\n- ", plot_trend_png, "\n", sep = "")

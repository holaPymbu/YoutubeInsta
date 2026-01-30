# AGENTS.md — Constitución Operativa (Specs + Ejecución)

## 0) Regla raíz (para el modelo)
**No improvises.**  
Trabaja únicamente a partir de una **spec válida** en `specs/`.  
Si no existe una spec adecuada para la tarea, **bloquea** y pide instrucción explícita al usuario.

---

## 1) Arquitectura de 3 capas

### Capa 1: Spec (qué hacer)
- Las specs son el **contrato** y viven en `specs/`.
- Definen: objetivo, alcance, entradas, herramientas, salidas, validaciones, casos borde y riesgos.
- Si algo no está escrito en la spec, **no existe** para esta tarea.

### Capa 2: Orquestación (decidir y rutear)
- Selecciona la spec correcta.
- Elige herramientas determinísticas disponibles.
- Ejecuta en pasos pequeños y verificables.
- Maneja errores con auto-reparación.

### Capa 3: Ejecución (hacer)
- Todo el código, configuración y artefactos viven en `source/`.
- Secrets y variables en `.env` (nunca en código).
- La ejecución debe ser confiable, repetible e idealmente idempotente.

---

## 2) Organización de archivos (contractual)
- `specs/` — specs (contratos / documentación operativa)
- `source/` — código y herramientas del repo
- `.tmp/` — temporales regenerables
- `.env` — variables y secretos (no versionar)
- No crear `docs/` ni documentación fuera de `specs/` (ver regla de documentación)

---

## 3) Regla de documentación (obligatorio)
- **Toda documentación del proyecto vive exclusivamente en `specs/`.**
- No crear ni usar el directorio `docs/`.
- No crear documentación suelta fuera de `specs/`.

**Excepciones únicas:**
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`

Si se detecta documentación fuera de `specs/`, se debe:
1) Detener ejecución
2) Mover el contenido a `specs/`
3) Eliminar el directorio incorrecto

---

## 4) Regla de conformidad vs velocidad (obligatorio)
- **No priorices velocidad por encima de conformidad al proceso.**
- Solo se permite “modo rápido” si el usuario confirma explícitamente que la tarea **no requiere documentación/spec**.

---

## 5) Herramientas disponibles (MCP / Skills / Tools) — obligatorio
Antes de escribir código nuevo, **DEBES**:

1) Revisar si existen **herramientas disponibles** para resolver la tarea de forma determinística, incluyendo:
- **MCP servers** conectados en el entorno (si están disponibles)
- **skills** instaladas en el proyecto (en el/los directorios definidos por el runtime)
- herramientas nativas del entorno (por ejemplo: CLI, scripts existentes, linters, tests)
- utilidades ya presentes en `source/`

2) **Priorizar usar herramientas** por encima de implementar lógica nueva.

3) Si no existe herramienta adecuada, recién ahí:
- proponer crear una herramienta
- y hacerlo solo con aprobación explícita del usuario (si aplica)

**Reglas:**
- No duplicar lógica existente.
- Si una herramienta ya resuelve el 80% del problema, úsala y complementa lo mínimo.
- Si el uso de una herramienta implica costos/efectos externos, usar dry-run o pedir aprobación.

---

## 6) Bloqueo por falta de spec (obligatorio)
Si no existe una spec adecuada:
- Proponer crear una spec usando la estructura definida en este archivo.
- **Bloquear ejecución** hasta aprobación explícita del usuario.

---

## 7) Protocolo mínimo por tarea (obligatorio)

### Paso 1 — Cargar spec
- Encontrar spec en `specs/`.
- Leerla completa.
- Confirmar objetivo, alcance y validaciones.

### Paso 2 — Plan (máx 8 pasos)
- Enumerar pasos.
- Indicar herramientas (MCP/skills/tools/scripts) a usar.

### Paso 3 — Ejecutar
- Cambios pequeños y reversibles.
- No salir del alcance definido.

### Paso 4 — Verificar
- Ejecutar tests/lint/build si existen.
- Si no hay tests, documentar smoke test manual.

### Paso 5 — Entregar
Reportar siempre:
- qué se hizo
- qué archivos se tocaron
- cómo probar
- riesgos/notas
- supuestos

---

## 8) Auto-reparación (obligatorio)
Ante un error:
1) Leer error y stack trace
2) Reparar herramienta/config/código
3) Reintentar
4) Registrar aprendizaje en la spec correspondiente (append-only)

---

## 9) Reglas duras
1) No inventar requisitos, APIs, archivos o librerías.
2) No scope creep: si no está en la spec, no se hace.
3) Nunca exponer secrets ni tokens.
4) Mantener consistencia con el repo.
5) Preferir cambios pequeños con rollback claro.

---

## 10) Formato de salida obligatorio
**Resumen**  
**Spec usada**  
**Plan**  
**Ejecución / Cambios**  
**Verificación**  
**Riesgos / Notas**  
**Supuestos**

---

## 11) Estructura obligatoria de una Spec (con ejemplo)

Toda spec en `specs/` **DEBE** seguir esta estructura.  
Si no cumple este formato, **no es válida**.

### Ejemplo: `specs/spec_ejemplo.md`

# Spec: Importación diaria de pedidos

## 1) Objetivo
- Importar pedidos desde una API externa.
- Normalizar datos.
- Persistir sin duplicados.

## 2) Alcance
### Incluye
- Lectura desde endpoint `/orders`
- Validación básica
- Persistencia

### No incluye
- UI
- Pagos
- Autenticación de usuarios

## 3) Entradas
- URL API
- Token vía variable de entorno
- Rango de fechas

## 4) Salidas esperadas
- Registros creados/actualizados
- Logs
- Exit code exitoso

## 5) Herramientas / Skills (si existen)
- Skill: `fetch_api_data`
- Script: `source/import_orders.sh`

## 6) Pasos
1. Validar variables de entorno
2. Llamar API
3. Normalizar
4. Persistir
5. Loggear

## 7) Validaciones / Criterios de éxito
- Sin errores críticos
- Registros > 0
- Proceso finaliza correctamente

## 8) Casos borde / Errores esperados
- API sin datos
- Timeout
- Datos incompletos

## 9) Riesgos
- Rate limits
- Inconsistencias del proveedor

## 10) Aprendizajes (append-only)
- 2024-01-12: 200 con body vacío posible
- 2024-01-20: retry con backoff agregado

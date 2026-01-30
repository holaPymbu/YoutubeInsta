# Spec: Deployment en Render

## 1) Objetivo
- Deployar la aplicación YoutubeInsta en Render.com
- Configurar variables de entorno para producción
- Obtener URL pública funcional

## 2) Alcance
### Incluye
- Creación de servicio web en Render
- Configuración de variables de entorno (GEMINI_API_KEY, ASSEMBLYAI_API_KEY)
- Conexión con repositorio GitHub
- Auto-deploy habilitado

### No incluye
- Cambios en lógica de negocio
- Configuración de base de datos
- CI/CD avanzado

## 3) Entradas
- Código fuente en `source/`
- Repositorio GitHub: holaPymbu/YoutubeInsta
- Variables de entorno desde `.env`
- API Key de Render

## 4) Salidas esperadas
- URL de producción: https://youtube-instagram-carousel.onrender.com
- Dashboard: https://dashboard.render.com/web/srv-d5ugupvgi27c7397cr1g
- Service ID: srv-d5ugupvgi27c7397cr1g

## 5) Herramientas / Skills
- MCP: `render` (list_services, get_deploys, create_service)
- API REST de Render (fallback)

## 6) Pasos
1. Configurar MCP de Render con API key
2. Obtener owner ID de Render
3. Crear servicio web con configuración Node.js
4. Configurar variables de entorno
5. Verificar estado del deploy

## 7) Validaciones / Criterios de éxito
- Deployment exitoso sin errores
- Frontend carga correctamente en URL pública
- API responde a requests
- Variables de entorno configuradas

## 8) Casos borde / Errores esperados
- Build timeout en dependencias pesadas
- Puppeteer funciona en Render (a diferencia de Vercel)
- Free tier tiene sleep en inactividad

## 9) Riesgos
- Timeouts en operaciones largas de transcripción
- Cold start de ~30s después de inactividad

## 10) Aprendizajes (append-only)
- 2026-01-30: Railway trial expirado, migrado a Render
- 2026-01-30: MCP de Render requiere `start` como subcomando
- 2026-01-30: API REST de Render es más confiable que MCP para crear servicios

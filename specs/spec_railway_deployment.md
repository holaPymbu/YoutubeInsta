# Spec: Deployment en Railway

## 1) Objetivo
- Deployar la aplicación YoutubeInsta en Railway
- Configurar variables de entorno para producción
- Obtener URL pública funcional

## 2) Alcance
### Incluye
- Login a Railway CLI con token
- Creación de proyecto en Railway
- Configuración de variables de entorno (GEMINI_API_KEY, ASSEMBLYAI_API_KEY)
- Deploy del código
- Generación de dominio público

### No incluye
- Cambios en lógica de negocio
- Configuración de base de datos
- CI/CD automatizado

## 3) Entradas
- Código fuente en `source/`
- Variables de entorno desde `.env`
- Token de Railway API: configurado en MCP
- Railway CLI instalado

## 4) Salidas esperadas
- URL de producción funcional en Railway
- Frontend estático servido correctamente
- API endpoints funcionando
- Variables de entorno configuradas en producción

## 5) Herramientas / Skills
- MCP: `railway` (create-project-and-link, set-variables, deploy, generate-domain)
- Railway CLI para login

## 6) Pasos
1. Login a Railway CLI con token
2. Crear proyecto en Railway y vincular
3. Configurar variables de entorno
4. Ejecutar deploy
5. Generar dominio público
6. Verificar funcionamiento

## 7) Validaciones / Criterios de éxito
- Deployment exitoso sin errores
- Frontend carga correctamente en URL pública
- API responde a requests de transcripción
- Generación de carousels funciona

## 8) Casos borde / Errores esperados
- Build timeout (funciones de IA pueden tardar)
- Puppeteer requiere configuración especial
- Sharp binarios para Linux

## 9) Riesgos
- Puppeteer puede requerir Chrome/Chromium en contenedor
- Timeouts en operaciones largas de transcripción

## 10) Aprendizajes (append-only)
- (pendiente)

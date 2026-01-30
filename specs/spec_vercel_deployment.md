# Spec: Deployment en Vercel

## 1) Objetivo
- Deployar la aplicación YoutubeInsta en Vercel
- Mantener funcionalidad completa (transcripción, generación con IA, generación de imágenes)
- Configurar variables de entorno para producción

## 2) Alcance
### Incluye
- Configuración de Vercel para Express.js
- Adaptación de estructura para Vercel Functions
- Configuración de variables de entorno
- Verificación de deployment funcional

### No incluye
- Cambios en lógica de negocio
- Nuevas funcionalidades
- Optimización de performance

## 3) Entradas
- Código fuente en `source/`
- Variables de entorno: `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`
- Cuenta de Vercel configurada

## 4) Salidas esperadas
- URL de producción funcional en Vercel
- Frontend estático servido correctamente
- API endpoints funcionando
- Variables de entorno configuradas

## 5) Herramientas / Skills
- MCP: `vercel` (deploy_to_vercel, search_vercel_documentation)
- Skill: `vercel-deployment`

## 6) Pasos
1. Crear configuración `vercel.json`
2. Adaptar estructura para Vercel (si necesario)
3. Deployar usando MCP de Vercel
4. Configurar variables de entorno
5. Verificar deployment

## 7) Validaciones / Criterios de éxito
- Deployment exitoso sin errores
- Frontend carga correctamente
- API responde a requests
- Generación de carousels funciona

## 8) Casos borde / Errores esperados
- Puppeteer no compatible con Vercel Serverless (límite 50MB)
- Sharp requiere binarios específicos
- Timeout en funciones serverless (default 10s)

## 9) Riesgos
- **CRÍTICO**: Puppeteer excede límites de Vercel Functions
- Sharp puede fallar en entorno serverless
- Timeouts en operaciones de IA/transcripción

## 10) Aprendizajes (append-only)
- (pendiente)

# Spec: YouTube Transcript to Instagram Carousel Generator

## 1) Objetivo
- Recibir un link de YouTube y extraer el transcript del video
- Procesar el transcript con IA para identificar conceptos clave
- Generar un carrusel de imágenes (diapositivas) profesionales y vistosas
- Crear un copy optimizado para Instagram
- Exportar imágenes en dimensiones compatibles con Instagram (1080x1350 px recomendado para carrusel)

## 2) Alcance

### Incluye
- Web app con interfaz moderna y profesional
- Input para URL de YouTube
- Extracción de transcript vía API/biblioteca
- Procesamiento de texto para extraer conceptos clave (5-10 slides)
- Generación de imágenes usando generate_image (modelo nano/banana disponible)
- Generación de copy para Instagram (caption + hashtags)
- Descarga de imágenes individuales y/o como pack

### No incluye
- Autenticación de usuarios
- Almacenamiento persistente de carruseles
- Publicación directa a Instagram (solo genera contenido)
- Monetización/pagos

## 3) Entradas
- URL de video de YouTube (validación de formato)
- Opcional: tema/estilo visual preferido
- Opcional: cantidad de slides deseadas

## 4) Salidas esperadas
- Carrusel de 5-10 imágenes en formato PNG (1080x1350 px)
- Copy para Instagram (texto principal + hashtags sugeridos)
- Preview visual del carrusel en la web
- Opción de descarga individual o ZIP

## 5) Herramientas / Skills

### Skills disponibles
- `canvas-design`: Para filosofía de diseño visual y creación de imágenes
- `content-creator`: Para optimización de copy y estrategia de contenido social
- `web-design-guidelines`: Para UI/UX de la aplicación web

### Tools del entorno
- `generate_image`: Para generación de imágenes de slides
- YouTube Transcript API (npm: `youtube-transcript` o similar)

### Stack técnico
- Frontend: HTML/CSS/JavaScript vanilla (diseño premium moderno)
- Backend: Node.js con Express (o Python FastAPI)
- APIs: YouTube transcript extraction

## 6) Pasos

### Fase 1: Setup del proyecto
1. Crear estructura base en `source/`
2. Instalar dependencias (transcript API, servidor web)

### Fase 2: Backend - Extracción de transcript
3. Implementar endpoint para recibir URL de YouTube
4. Extraer transcript usando biblioteca/API
5. Implementar procesamiento de texto para extraer conceptos clave

### Fase 3: Generación de contenido
6. Diseñar prompts para generación de slides (usando generate_image)
7. Generar imágenes de carrusel con estilo consistente
8. Generar copy de Instagram optimizado

### Fase 4: Frontend - UI/UX
9. Crear interfaz web moderna y profesional
10. Implementar input de URL con validación
11. Mostrar preview de carrusel generado
12. Implementar descarga de imágenes

### Fase 5: Integración y pulido
13. Conectar frontend con backend
14. Agregar estados de loading y feedback visual
15. Testing end-to-end

## 7) Validaciones / Criterios de éxito
- URL de YouTube válida detectada correctamente
- Transcript extraído sin errores
- Imágenes generadas en dimensiones correctas (1080x1350 px)
- Copy generado con formato adecuado para Instagram
- UI responsiva y visualmente atractiva
- Tiempo de procesamiento < 2 minutos para video promedio

## 8) Casos borde / Errores esperados
- Video sin transcript disponible → Mostrar error descriptivo
- Video privado o eliminado → Validar y notificar
- URL inválida → Validación frontend antes de procesar
- Transcript muy corto → Ajustar cantidad de slides
- Transcript muy largo → Resumir/segmentar inteligentemente
- Error en generación de imagen → Retry con backoff

## 9) Riesgos
- Rate limits en APIs de generación de imágenes
- Calidad variable del transcript (auto-generado vs manual)
- Tiempo de procesamiento puede variar según longitud del video
- Dependencia de servicios externos (YouTube, generación de imágenes)

## 10) Aprendizajes (append-only)
- 2026-01-29: Spec inicial creada

/**
 * AI Content Processor using Google Gemini
 * Interprets transcripts and generates coherent slide content
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
function getGenAI() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is required');
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Process transcript with AI to extract coherent concepts for slides
 * @param {Object} transcript - Transcript object with text property
 * @param {Object} options - Options including slideCount
 * @returns {Promise<Object>} Processed concepts
 */
async function processTranscript(transcript, options = {}) {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const slideCount = options.slideCount || 5;

    const prompt = `Eres un experto en crear contenido para carruseles de Instagram. Analiza este transcript de un video de YouTube y extrae los ${slideCount} conceptos más importantes y valiosos.

Para cada concepto genera:
1. Un TÍTULO impactante y llamativo (máximo 6 palabras, sin emojis)
2. Un CONTENIDO rico y detallado que incluya:
   - El punto clave o tip específico
   - Datos, estadísticas o ejemplos cuando existan
   - Beneficios concretos o resultados esperados
   (mínimo 150, máximo 250 caracteres)

REGLAS CRÍTICAS:
- El contenido debe ser ESPECÍFICO y ACCIONABLE, no genérico
- Incluye números, porcentajes o datos cuando el video los mencione
- Si el video da tips o pasos, describe cada uno claramente
- NO uses frases vagas como "es importante" o "debes considerar"
- Escribe en el MISMO idioma del transcript
- Evita repetir información entre slides

Transcript:
${transcript.text.substring(0, 8000)}

Responde ÚNICAMENTE con JSON válido (sin markdown, sin backticks):
{"concepts":[{"title":"...", "content":"..."}]}`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean response (remove markdown code blocks if present)
        const cleanedResponse = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanedResponse);
        console.log(`✅ AI processed ${parsed.concepts.length} concepts`);
        return parsed;
    } catch (error) {
        console.error('❌ AI processing error:', error.message);
        throw error;
    }
}

/**
 * Generate an attractive cover title from video title
 * @param {string} videoTitle - Original YouTube video title
 * @returns {Promise<string>} Optimized cover title
 */
async function generateCoverTitle(videoTitle) {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Genera un título atractivo para la portada de un carrusel de Instagram basado en este título de video:
"${videoTitle}"

Requisitos:
- Máximo 8 palabras
- Atractivo y que genere curiosidad
- En el MISMO idioma que el original
- Sin emojis ni caracteres especiales
- Sin comillas

Responde SOLO con el título, nada más.`;

    try {
        const result = await model.generateContent(prompt);
        const title = result.response.text().trim().replace(/['"]/g, '');
        console.log(`✅ Generated cover title: "${title}"`);
        return title;
    } catch (error) {
        console.error('❌ Cover title generation error:', error.message);
        return videoTitle; // Fallback to original
    }
}

/**
 * Transcribe video using Gemini's video understanding
 * Fallback when YouTube transcript is not available
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Transcript-like object
 */
async function transcribeWithGemini(videoId) {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const prompt = `Mira este video de YouTube y genera una transcripción detallada del contenido hablado.
    
Video: ${videoUrl}

Genera una transcripción completa del audio/narración del video. Si no puedes acceder al video directamente, indica que no es posible.

Responde SOLO con el texto de la transcripción, sin marcas de tiempo ni formato especial.`;

    try {
        const result = await model.generateContent(prompt);
        const transcriptText = result.response.text().trim();

        if (transcriptText.length < 100) {
            throw new Error('Transcription too short or failed');
        }

        console.log(`✅ Gemini transcription generated (${transcriptText.length} chars)`);
        return {
            text: transcriptText,
            segments: [],
            videoTitle: 'Unknown',
            duration: 0,
            source: 'gemini-fallback'
        };
    } catch (error) {
        console.error('❌ Gemini transcription error:', error.message);
        throw new Error('Could not transcribe video with AI fallback');
    }
}

module.exports = {
    processTranscript,
    generateCoverTitle,
    transcribeWithGemini
};

/**
 * Extract key concepts from transcript text for carousel slides
 * Uses AI processing with Gemini, with fallback to heuristic extraction
 */

const { processTranscript } = require('./aiProcessor');

/**
 * Clean and normalize text
 */
function cleanText(text) {
    return text
        .replace(/\[.*?\]/g, '') // Remove bracketed content like [Music]
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text) {
    return text
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.length > 10)
        .map(s => s.trim());
}

/**
 * Calculate importance score for a sentence
 */
function scoreSentence(sentence, allText) {
    let score = 0;

    // Length bonus (prefer medium-length sentences)
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 8 && wordCount <= 25) score += 2;

    // Key phrase indicators
    const keyPhrases = [
        'important', 'key', 'main', 'essential', 'critical',
        'remember', 'note', 'tip', 'secret', 'strategy',
        'first', 'second', 'third', 'finally', 'conclusion',
        'best', 'top', 'must', 'should', 'need',
        'success', 'growth', 'improve', 'learn', 'discover'
    ];

    const lowerSentence = sentence.toLowerCase();
    keyPhrases.forEach(phrase => {
        if (lowerSentence.includes(phrase)) score += 1;
    });

    // Action words bonus
    const actionWords = ['do', 'make', 'create', 'build', 'start', 'begin', 'try', 'use'];
    actionWords.forEach(word => {
        if (lowerSentence.includes(word)) score += 0.5;
    });

    // Numbers/statistics bonus
    if (/\d+%?/.test(sentence)) score += 1;

    return score;
}

/**
 * Generate a catchy title from concept text (heuristic)
 */
function generateTitle(text, index, total) {
    const words = text.split(/\s+/).slice(0, 6);
    let title = words.join(' ');

    // Clean up and capitalize
    title = title.replace(/[.!?,;:]$/, '');
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Add emoji based on position
    const emojis = ['💡', '🎯', '✨', '🚀', '💪', '🔥', '⭐', '📌', '🎨', '💎'];
    const emoji = emojis[index % emojis.length];

    return `${emoji} ${title}`;
}

/**
 * Fallback heuristic extraction (when AI is unavailable)
 */
function extractConceptsHeuristic(transcript, slideCount = 7) {
    const text = cleanText(transcript.text);
    const sentences = splitIntoSentences(text);

    if (sentences.length < 3) {
        throw new Error('Transcript too short to extract meaningful concepts');
    }

    // Score all sentences
    const scoredSentences = sentences.map((sentence, idx) => ({
        text: sentence,
        score: scoreSentence(sentence, text),
        position: idx / sentences.length
    }));

    // Sort by score and select top concepts
    const sortedSentences = [...scoredSentences]
        .sort((a, b) => b.score - a.score);

    // Select sentences distributed throughout the video
    const selectedCount = Math.min(slideCount, Math.ceil(sentences.length / 3));
    const selected = [];
    const usedPositions = new Set();

    for (const sentence of sortedSentences) {
        if (selected.length >= selectedCount) break;

        const positionKey = Math.floor(sentence.position * 10);
        if (!usedPositions.has(positionKey)) {
            selected.push(sentence);
            usedPositions.add(positionKey);
        }
    }

    // Sort selected by original position
    selected.sort((a, b) => a.position - b.position);

    // Create slide concepts
    const concepts = selected.map((item, index) => {
        let slideText = item.text;
        if (slideText.length > 120) {
            slideText = slideText.substring(0, 117) + '...';
        }

        return {
            slideNumber: index + 1,
            title: generateTitle(item.text, index, selected.length),
            content: slideText,
            position: item.position,
            isIntro: index === 0,
            isOutro: index === selected.length - 1
        };
    });

    // Enhance first and last slides
    if (concepts.length > 0) {
        concepts[0].title = '🎬 ' + concepts[0].title.replace(/^[^\s]+\s/, '');
        concepts[concepts.length - 1].title = '🎯 Conclusión Clave';
    }

    return concepts;
}

/**
 * Extract key concepts from transcript using AI
 * Falls back to heuristic extraction if AI fails
 * @param {Object} transcript - Transcript object with text property
 * @param {number} slideCount - Number of slides to generate (default 7)
 * @returns {Promise<Array>} Array of concept objects for slides
 */
async function extractConcepts(transcript, slideCount = 7) {
    // Try AI processing first
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.log('⚠️ No GEMINI_API_KEY, using heuristic extraction');
            return extractConceptsHeuristic(transcript, slideCount);
        }

        console.log('🤖 Processing transcript with Gemini AI...');
        const aiResult = await processTranscript(transcript, { slideCount });

        // Transform AI result to match expected format
        const concepts = aiResult.concepts.map((concept, index) => ({
            slideNumber: index + 1,
            title: concept.title,
            content: concept.content,
            position: index / aiResult.concepts.length,
            isIntro: index === 0,
            isOutro: index === aiResult.concepts.length - 1,
            aiGenerated: true
        }));

        console.log(`✅ AI extracted ${concepts.length} coherent concepts`);
        return concepts;

    } catch (error) {
        console.log('⚠️ AI processing failed, using heuristic fallback:', error.message);
        return extractConceptsHeuristic(transcript, slideCount);
    }
}

/**
 * Generate slide prompts for image generation
 */
function generateSlidePrompts(concepts, style = 'modern') {
    const styleGuides = {
        modern: 'Modern minimalist design with bold typography, gradient background, clean geometric shapes',
        vibrant: 'Vibrant colorful design with dynamic gradients, bold colors, energetic composition',
        professional: 'Professional corporate design with clean lines, subtle gradients, elegant typography',
        creative: 'Creative artistic design with abstract shapes, artistic elements, unique composition'
    };

    const baseStyle = styleGuides[style] || styleGuides.modern;

    return concepts.map((concept, index) => ({
        slideNumber: concept.slideNumber,
        prompt: `Instagram carousel slide, ${baseStyle}. Title: "${concept.title}". Key message displayed prominently. Slide ${index + 1} of ${concepts.length}. Professional social media content, 1080x1350 pixels, portrait orientation. Text should be large and readable. High quality, polished design.`,
        concept
    }));
}

module.exports = {
    extractConcepts,
    extractConceptsHeuristic,
    generateSlidePrompts,
    cleanText,
    splitIntoSentences
};

/**
 * Image Generator Service
 * Generates professional Instagram carousel slide images using Google Imagen 4
 */

const { GoogleGenAI } = require('@google/genai');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const OUTPUT_DIR = path.join(__dirname, '../../public/generated');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Get YouTube thumbnail URL (high resolution)
 */
function getThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Download image from URL and return as base64
 */
async function downloadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImageAsBase64(response.headers.location)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer.toString('base64'));
            });
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Download image from URL to file
 */
async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(outputPath);
            });

            fileStream.on('error', (err) => {
                fs.unlink(outputPath, () => { });
                reject(err);
            });
        }).on('error', reject);
    });
}

/**
 * Generate image prompt for cover slide
 * Creates an attractive visual representing the video topic
 */
function getCoverSlidePrompt(title, videoTopic) {
    // Extract keywords for visual representation
    const topic = videoTopic || title;

    return `A professional social media carousel cover image, portrait format (3:4 aspect ratio).

Visual elements:
- Modern dark gradient background with deep navy blue and subtle purple tones
- Abstract geometric shapes and soft glowing accents in coral and cyan colors
- Professional, minimal design with plenty of negative space
- Elegant typography-style composition

The image should evoke the theme: "${topic}"

Include the text "${title}" as the main title, displayed in large, bold, modern white sans-serif font, centered.
Below the title, include smaller text "Swipe to explore →" in a muted gray color.

Style: Premium editorial design, modern and sleek, similar to high-end marketing materials. Clean, sophisticated, museum-quality aesthetic.`;
}

/**
 * Generate image prompt for content slide
 * Creates consistent visual slides with readable text
 */
function getContentSlidePrompt(slideNumber, totalSlides, title, content) {
    const paddedNumber = String(slideNumber).padStart(2, '0');

    return `A professional social media carousel content slide, portrait format (3:4 aspect ratio).

Visual design:
- Dark gradient background transitioning from deep navy (#1a1a2e) to darker blue (#0f3460)
- Clean, minimal layout with ample white space
- Subtle geometric accent elements in coral color (#e94560)

Text content to display:
- Large number "${paddedNumber}" in coral color (#e94560), bold font, positioned in upper left area
- Title: "${title}" in white, bold, medium-large size font below the number
- Body text: "${content}" in light gray color, smaller readable font, centered

Include a thin progress bar at the bottom showing ${Math.round((slideNumber / totalSlides) * 100)}% progress in coral-to-orange gradient.
Include "${slideNumber}/${totalSlides}" as small text in the bottom right corner.

Style: Consistent with a premium Instagram carousel series. Editorial quality, clean typography, professional presentation.`;
}

/**
 * Generate actual slide images using Imagen 4 API
 */
async function generateSlideImages(concepts, videoId, videoTitle, onProgress) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is required for image generation');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const slides = [];
    const total = concepts.length;
    const timestamp = Date.now();

    // Generate AI-enhanced cover title if possible
    let coverTitle = videoTitle;
    if (process.env.GEMINI_API_KEY && videoTitle) {
        try {
            const { generateCoverTitle } = require('./aiProcessor');
            coverTitle = await generateCoverTitle(videoTitle);
        } catch (error) {
            console.log('⚠️ Could not generate AI cover title, using original');
        }
    }

    for (let i = 0; i < concepts.length; i++) {
        const concept = concepts[i];
        const isCover = i === 0;
        const slideNum = concept.slideNumber ?? (i + 1);

        // Generate prompt
        let prompt;
        let filename;

        if (isCover) {
            prompt = getCoverSlidePrompt(coverTitle || concept.title, videoTitle);
            filename = `slide_01_cover_${timestamp}.png`;
        } else {
            const cleanTitle = concept.title.replace(/[🎬🎯✨💡🔥⚡📌]/g, '').trim();
            prompt = getContentSlidePrompt(slideNum, total, cleanTitle, concept.content);
            filename = `slide_${String(slideNum).padStart(2, '0')}_content_${timestamp}.png`;
        }

        console.log(`🖼️ Generating slide ${i + 1}/${total}...`);
        if (onProgress) onProgress(i + 1, total);

        try {
            // Call Imagen 4 API
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '3:4', // Portrait format for Instagram
                }
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                // Save the image
                const imageBytes = response.generatedImages[0].image.imageBytes;
                const buffer = Buffer.from(imageBytes, 'base64');
                const outputPath = path.join(OUTPUT_DIR, filename);
                fs.writeFileSync(outputPath, buffer);

                slides.push({
                    slideNumber: slideNum,
                    type: isCover ? 'cover' : 'content',
                    title: isCover ? (coverTitle || concept.title) : concept.title,
                    filename: filename,
                    url: `/generated/${filename}`,
                    success: true
                });

                console.log(`✅ Slide ${i + 1} generated: ${filename}`);
            } else {
                throw new Error('No images returned from API');
            }
        } catch (error) {
            console.error(`❌ Failed to generate slide ${i + 1}:`, error.message);
            slides.push({
                slideNumber: slideNum,
                type: isCover ? 'cover' : 'content',
                title: concept.title,
                error: error.message,
                success: false
            });
        }

        // Small delay between requests to avoid rate limiting
        if (i < concepts.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    return slides;
}

/**
 * Generate slide image data (prompts and metadata for external generation)
 */
async function generateSlidePrompts(concepts, videoId, videoTitle) {
    const slides = [];
    const total = concepts.length;

    let coverTitle = videoTitle;
    if (process.env.GEMINI_API_KEY && videoTitle) {
        try {
            const { generateCoverTitle } = require('./aiProcessor');
            coverTitle = await generateCoverTitle(videoTitle);
        } catch (error) {
            console.log('⚠️ Could not generate AI cover title, using original');
        }
    }

    concepts.forEach((concept, index) => {
        const isCover = index === 0;
        const slideNum = concept.slideNumber ?? (index + 1);

        if (isCover) {
            slides.push({
                slideNumber: 1,
                type: 'cover',
                title: coverTitle || concept.title,
                originalTitle: videoTitle,
                prompt: getCoverSlidePrompt(coverTitle || concept.title, videoTitle),
                thumbnailUrl: videoId ? getThumbnailUrl(videoId) : null,
                filename: `slide_01_cover.png`
            });
        } else {
            const cleanTitle = concept.title.replace(/[🎬🎯✨💡🔥⚡📌]/g, '').trim();
            slides.push({
                slideNumber: slideNum,
                type: 'content',
                title: cleanTitle,
                content: concept.content,
                prompt: getContentSlidePrompt(slideNum, total, cleanTitle, concept.content),
                filename: `slide_${String(slideNum).padStart(2, '0')}_content.png`
            });
        }
    });

    return slides;
}

/**
 * Save generated image
 */
async function saveGeneratedImage(imageUrl, filename) {
    const outputPath = path.join(OUTPUT_DIR, filename);

    if (imageUrl.startsWith('http')) {
        await downloadImage(imageUrl, outputPath);
    } else if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
    }

    return `/generated/${filename}`;
}

/**
 * Check if image generation is available
 */
function isImageGenerationAvailable() {
    return !!process.env.GEMINI_API_KEY;
}

module.exports = {
    getThumbnailUrl,
    downloadImage,
    downloadImageAsBase64,
    getCoverSlidePrompt,
    getContentSlidePrompt,
    generateSlideImages,
    generateSlidePrompts,
    saveGeneratedImage,
    isImageGenerationAvailable,
    OUTPUT_DIR
};

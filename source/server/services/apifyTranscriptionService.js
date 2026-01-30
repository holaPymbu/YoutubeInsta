/**
 * Apify Transcription Service
 * Uses Apify YouTube Transcripts actor (karamelo) as fallback for server-side transcription
 * Works from any server because Apify handles anti-bot measures internally
 */

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const APIFY_ACTOR_ID = 'karamelo~youtube-transcripts';

/**
 * Check if Apify is configured
 */
function isAvailable() {
    return !!APIFY_API_KEY;
}

/**
 * Get transcript from YouTube video using Apify actor
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Transcript object
 */
async function getTranscript(videoId) {
    if (!isAvailable()) {
        throw new Error('APIFY_API_KEY not configured');
    }

    console.log(`🔄 Trying Apify transcript scraper (karamelo) for video ${videoId}...`);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Use run-sync-get-dataset-items for simpler synchronous execution
    const response = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                urls: [videoUrl]
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
    }

    const results = await response.json();

    if (!results || results.length === 0) {
        throw new Error('No transcript data returned from Apify');
    }

    const transcriptData = results[0];

    // Extract transcript text from captions array (karamelo actor format)
    let fullText = '';
    let segments = [];

    if (transcriptData.captions && Array.isArray(transcriptData.captions)) {
        // karamelo returns captions as array of strings
        segments = transcriptData.captions.map((caption, index) => ({
            text: caption || '',
            offset: index * 3000, // Approximate timing
            duration: 3000
        }));

        fullText = transcriptData.captions
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/\[.*?\]/g, '')
            .replace(/♪/g, '')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .trim();
    } else if (transcriptData.transcript && Array.isArray(transcriptData.transcript)) {
        // Alternative format some actors use
        segments = transcriptData.transcript.map(item => ({
            text: item.text || '',
            offset: item.start ? item.start * 1000 : 0,
            duration: item.duration ? item.duration * 1000 : 0
        }));

        fullText = segments
            .map(s => s.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/\[.*?\]/g, '')
            .trim();
    }

    if (!fullText || fullText.length < 50) {
        throw new Error('Apify returned empty or too short transcript');
    }

    console.log(`✅ Apify transcript retrieved (${fullText.length} chars)`);

    return {
        text: fullText,
        segments,
        videoTitle: transcriptData.title || 'YouTube Video',
        duration: transcriptData.duration || 0,
        source: 'apify'
    };
}

module.exports = {
    getTranscript,
    isAvailable
};

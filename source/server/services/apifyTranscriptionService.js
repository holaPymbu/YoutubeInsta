/**
 * Apify Transcription Service
 * Uses Apify YouTube Transcript Scraper as fallback for server-side transcription
 * Works from any server because Apify handles anti-bot measures internally
 */

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const APIFY_ACTOR_ID = 'im_broke~youtube-transcript-scraper';

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

    console.log(`🔄 Trying Apify transcript scraper for video ${videoId}...`);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Start the Apify actor run
    const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                urls: [videoUrl],
                maxRetries: 2
            })
        }
    );

    if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`Apify API error: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    console.log(`⏳ Apify run started: ${runId}, waiting for completion...`);

    // Wait for the run to complete (poll every 2 seconds, max 60 seconds)
    const maxWaitTime = 60000;
    const pollInterval = 2000;
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        elapsed += pollInterval;

        const statusResponse = await fetch(
            `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`
        );

        if (!statusResponse.ok) {
            throw new Error(`Failed to check run status: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        if (status === 'SUCCEEDED') {
            console.log(`✅ Apify run completed successfully`);
            break;
        } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
            throw new Error(`Apify run failed with status: ${status}`);
        }

        console.log(`⏳ Apify run status: ${status}, waiting...`);
    }

    if (elapsed >= maxWaitTime) {
        throw new Error('Apify run timed out after 60 seconds');
    }

    // Get the results from the default dataset
    const datasetResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}`
    );

    if (!datasetResponse.ok) {
        throw new Error(`Failed to get dataset: ${datasetResponse.status}`);
    }

    const results = await datasetResponse.json();

    if (!results || results.length === 0) {
        throw new Error('No transcript data returned from Apify');
    }

    const transcriptData = results[0];

    // Extract transcript text
    let fullText = '';
    let segments = [];

    if (transcriptData.transcript && Array.isArray(transcriptData.transcript)) {
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
    } else if (transcriptData.transcriptText) {
        fullText = transcriptData.transcriptText
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

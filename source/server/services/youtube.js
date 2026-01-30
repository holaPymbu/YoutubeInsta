const { Innertube } = require('youtubei.js');
const { YoutubeTranscript } = require('youtube-transcript');

let innertube = null;

/**
 * Initialize InnerTube client
 */
async function getClient() {
    if (!innertube) {
        innertube = await Innertube.create({
            lang: 'en',
            location: 'US',
            retrieve_player: false
        });
    }
    return innertube;
}

/**
 * Get transcript using youtube-transcript package (works better on servers)
 */
async function getTranscriptAlternative(videoId) {
    console.log(`🔄 Trying youtube-transcript package for video ${videoId}...`);

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
        throw new Error('No transcript found with alternative method');
    }

    const fullText = transcriptItems
        .map(item => item.text)
        .join(' ')
        .replace(/\\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\[.*?\]/g, '') // Remove [Music] etc
        .trim();

    if (fullText.length < 50) {
        throw new Error('Transcript too short');
    }

    console.log(`✅ Alternative transcript retrieved (${fullText.length} chars)`);

    return {
        text: fullText,
        segments: transcriptItems.map(item => ({
            text: item.text,
            offset: item.offset || 0,
            duration: item.duration || 0
        })),
        videoTitle: 'YouTube Video',
        duration: 0,
        source: 'youtube-transcript'
    };
}

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url) {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Get transcript from a YouTube video using InnerTube API
 */
async function getTranscript(videoId) {
    try {
        const yt = await getClient();
        const info = await yt.getInfo(videoId);

        // Get transcript
        const transcriptInfo = await info.getTranscript();

        if (!transcriptInfo || !transcriptInfo.transcript || !transcriptInfo.transcript.content) {
            throw new Error('No transcript available');
        }

        const segments = transcriptInfo.transcript.content.body.initial_segments;

        if (!segments || segments.length === 0) {
            throw new Error('Transcript is empty');
        }

        // Extract text from segments
        const fullText = segments
            .map(segment => {
                if (segment.snippet && segment.snippet.text) {
                    return segment.snippet.text;
                }
                return '';
            })
            .filter(text => text.length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/\[.*?\]/g, '') // Remove [Music] etc
            .trim();

        if (fullText.length < 50) {
            throw new Error('Transcript too short');
        }

        console.log(`✅ Transcript retrieved for video ${videoId} (${fullText.length} chars)`);

        return {
            text: fullText,
            segments: segments.map(s => ({
                text: s.snippet?.text || '',
                offset: s.start_ms || 0,
                duration: s.end_ms ? s.end_ms - (s.start_ms || 0) : 0
            })),
            videoTitle: info.basic_info?.title || 'Unknown',
            duration: info.basic_info?.duration || 0
        };

    } catch (error) {
        console.error(`❌ InnerTube failed for ${videoId}:`, error.message);

        // Fallback 1: Try youtube-transcript package (works better on servers)
        try {
            console.log('⚠️ InnerTube failed, trying youtube-transcript package...');
            return await getTranscriptAlternative(videoId);
        } catch (altError) {
            console.error('❌ youtube-transcript also failed:', altError.message);

            // Fallback 2: Try AssemblyAI (download audio + transcribe)
            const transcriptionService = require('./transcriptionService');

            if (transcriptionService.isAvailable()) {
                try {
                    console.log('⚠️ All YouTube methods failed, using AssemblyAI fallback...');
                    return await transcriptionService.transcribeVideo(videoId);
                } catch (fallbackError) {
                    console.error('❌ AssemblyAI fallback also failed:', fallbackError.message);
                    throw new Error(`Transcription failed. InnerTube: ${error.message}. youtube-transcript: ${altError.message}. AssemblyAI: ${fallbackError.message}`);
                }
            } else {
                console.log('⚠️ AssemblyAI not configured (missing ASSEMBLYAI_API_KEY)');
                throw new Error(
                    `Failed to get transcript. InnerTube: ${error.message}. youtube-transcript: ${altError.message}. ` +
                    'AssemblyAI not configured. Add ASSEMBLYAI_API_KEY to your .env file for audio transcription fallback.'
                );
            }
        }
    }
}

/**
 * Validate if URL is a valid YouTube URL
 */
function isValidYoutubeUrl(url) {
    return extractVideoId(url) !== null;
}

module.exports = {
    extractVideoId,
    getTranscript,
    isValidYoutubeUrl
};

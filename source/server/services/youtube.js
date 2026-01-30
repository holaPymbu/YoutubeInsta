const { Innertube } = require('youtubei.js');

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
        console.error(`❌ Failed to get transcript for ${videoId}:`, error.message);

        // Try AssemblyAI fallback for transcription
        const transcriptionService = require('./transcriptionService');

        if (transcriptionService.isAvailable()) {
            try {
                console.log('⚠️ YouTube transcript failed, using AssemblyAI fallback...');
                return await transcriptionService.transcribeVideo(videoId);
            } catch (fallbackError) {
                console.error('❌ AssemblyAI fallback also failed:', fallbackError.message);
                throw new Error(`Transcription failed. YouTube error: ${error.message}. AssemblyAI error: ${fallbackError.message}`);
            }
        } else {
            console.log('⚠️ AssemblyAI not configured (missing ASSEMBLYAI_API_KEY)');
            // Provide clear message about how to fix this
            throw new Error(
                'This video does not have YouTube captions. To transcribe videos without captions, ' +
                'add ASSEMBLYAI_API_KEY to your .env file. Get a free key at: https://www.assemblyai.com/dashboard/signup'
            );
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

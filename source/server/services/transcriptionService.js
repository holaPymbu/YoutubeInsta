/**
 * Transcription Service using AssemblyAI
 * Fallback service when YouTube captions are not available
 */

const { AssemblyAI } = require('assemblyai');
const { create: createYoutubeDl } = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Create youtube-dl instance using system yt-dlp binary (installed in Dockerfile)
const youtubedl = createYoutubeDl('/usr/local/bin/yt-dlp');

// Get AssemblyAI client
function getAssemblyAIClient() {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('ASSEMBLYAI_API_KEY environment variable is required for transcription fallback');
    }
    return new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
}

/**
 * Download audio from YouTube video using yt-dlp to a local file
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{audioPath: string, videoTitle: string, duration: number}>}
 */
async function downloadAudio(videoId) {
    console.log(`🎵 Downloading audio for video ${videoId} using yt-dlp...`);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const tempDir = os.tmpdir();
    const outputTemplate = path.join(tempDir, `youtube_audio_${videoId}`);

    try {
        // Download audio using yt-dlp (binary configured via create())
        const result = await youtubedl(videoUrl, {
            output: `${outputTemplate}.%(ext)s`,
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '192K',
            noWarnings: true,
            noCheckCertificates: true,
            quiet: false, // Enable output to see errors
            printJson: true
        });

        const videoTitle = result.title || 'Unknown';
        const duration = result.duration || 0;

        // Find the downloaded file
        const possibleExtensions = ['mp3', 'webm', 'm4a', 'opus', 'ogg'];
        let audioPath = null;

        for (const ext of possibleExtensions) {
            const filePath = `${outputTemplate}.${ext}`;
            if (fs.existsSync(filePath)) {
                audioPath = filePath;
                break;
            }
        }

        // If not found with expected extensions, check for .mp3 specifically
        if (!audioPath) {
            // yt-dlp might have converted to mp3
            const mp3Path = `${outputTemplate}.mp3`;
            if (fs.existsSync(mp3Path)) {
                audioPath = mp3Path;
            }
        }

        if (!audioPath) {
            // List files in temp to debug
            const files = fs.readdirSync(tempDir).filter(f => f.includes(videoId));
            console.log('Files found:', files);
            if (files.length > 0) {
                audioPath = path.join(tempDir, files[0]);
            }
        }

        if (!audioPath || !fs.existsSync(audioPath)) {
            throw new Error('Audio file was not downloaded');
        }

        console.log(`✅ Audio downloaded: ${audioPath}`);

        return {
            audioPath,
            videoTitle,
            duration
        };
    } catch (error) {
        console.error('❌ yt-dlp download failed:', error.message);
        throw new Error(`Failed to download audio: ${error.message}`);
    }
}

/**
 * Transcribe local audio file using AssemblyAI
 * @param {string} audioPath - Path to local audio file
 * @returns {Promise<string>} Transcript text
 */
async function transcribeWithAssemblyAI(audioPath) {
    console.log(`🎙️ Uploading and transcribing ${path.basename(audioPath)} with AssemblyAI...`);

    const client = getAssemblyAIClient();

    // Upload the local file to AssemblyAI and transcribe
    const transcript = await client.transcripts.transcribe({
        audio: audioPath,
        language_detection: true // Auto-detect language
    });

    if (transcript.status === 'error') {
        throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
    }

    if (!transcript.text || transcript.text.length < 50) {
        throw new Error('AssemblyAI transcription returned empty or too short result');
    }

    console.log(`✅ AssemblyAI transcription completed (${transcript.text.length} chars)`);

    return transcript.text;
}

/**
 * Clean up temporary audio file
 * @param {string} audioPath - Path to the audio file to delete
 */
function cleanupAudioFile(audioPath) {
    try {
        if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
            console.log(`🧹 Cleaned up temporary audio file`);
        }
    } catch (e) {
        console.log('⚠️ Could not clean up audio file:', e.message);
    }
}

/**
 * Main function to transcribe a YouTube video using AssemblyAI
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Transcript object compatible with youtube.js format
 */
async function transcribeVideo(videoId) {
    console.log(`⚠️ Using AssemblyAI fallback for video ${videoId}...`);

    let audioPath = null;

    try {
        // Step 1: Download audio from YouTube
        const { audioPath: downloadedPath, videoTitle, duration } = await downloadAudio(videoId);
        audioPath = downloadedPath;

        // Step 2: Transcribe with AssemblyAI (upload local file)
        const transcriptText = await transcribeWithAssemblyAI(audioPath);

        return {
            text: transcriptText,
            segments: [],
            videoTitle,
            duration,
            source: 'assemblyai-fallback'
        };
    } finally {
        // Always cleanup the temporary audio file
        if (audioPath) {
            cleanupAudioFile(audioPath);
        }
    }
}

/**
 * Check if AssemblyAI is configured
 * @returns {boolean}
 */
function isAvailable() {
    return !!process.env.ASSEMBLYAI_API_KEY;
}

module.exports = {
    transcribeVideo,
    downloadAudio,
    transcribeWithAssemblyAI,
    isAvailable
};

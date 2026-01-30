/**
 * Generate Instagram copy (caption and hashtags) from concepts
 */

/**
 * Generate engaging Instagram caption
 */
function generateCaption(concepts, transcript) {
    const mainPoints = concepts
        .slice(0, 5)
        .map((c, i) => `${i + 1}. ${c.content}`)
        .join('\n\n');

    const caption = `✨ Swipe through for key insights! ✨

${mainPoints}

💡 Save this post for later!
👉 Share with someone who needs to see this

Which point resonated with you the most? Drop a comment below! 👇

---
📌 Follow for more valuable content
🔄 Share to help others learn`;

    return caption;
}

/**
 * Generate relevant hashtags based on content
 */
function generateHashtags(concepts, transcript) {
    const baseHashtags = [
        '#knowledge',
        '#learning',
        '#education',
        '#tips',
        '#insights',
        '#motivation',
        '#growthmindset',
        '#selfimprovement',
        '#carousel',
        '#infographic'
    ];

    const contentHashtags = [];
    const text = transcript.text.toLowerCase();

    // Detect topic-specific hashtags
    const topicMap = {
        business: ['#business', '#entrepreneur', '#success', '#startup'],
        tech: ['#technology', '#tech', '#innovation', '#digital'],
        marketing: ['#marketing', '#digitalmarketing', '#socialmedia', '#branding'],
        finance: ['#finance', '#investing', '#money', '#wealth'],
        health: ['#health', '#wellness', '#fitness', '#mindfulness'],
        productivity: ['#productivity', '#timemanagement', '#efficiency', '#habits'],
        leadership: ['#leadership', '#management', '#teamwork', '#leader']
    };

    for (const [topic, hashtags] of Object.entries(topicMap)) {
        if (text.includes(topic)) {
            contentHashtags.push(...hashtags.slice(0, 2));
        }
    }

    // Combine and limit hashtags
    const allHashtags = [...new Set([...contentHashtags, ...baseHashtags])];
    return allHashtags.slice(0, 15);
}

/**
 * Generate call to action text
 */
function generateCTA() {
    const ctas = [
        '💾 Save this post for reference!',
        '📲 Share with your network!',
        '💬 Comment your thoughts below!',
        '👆 Double tap if you agree!',
        '🔔 Turn on notifications for more!'
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
}

/**
 * Generate complete Instagram copy
 */
function generateCopy(concepts, transcript) {
    const caption = generateCaption(concepts, transcript);
    const hashtags = generateHashtags(concepts, transcript);
    const cta = generateCTA();

    return {
        caption,
        hashtags: hashtags.join(' '),
        hashtagsList: hashtags,
        cta,
        fullPost: `${caption}\n\n${hashtags.join(' ')}`,
        characterCount: caption.length + hashtags.join(' ').length + 2
    };
}

module.exports = {
    generateCopy,
    generateCaption,
    generateHashtags,
    generateCTA
};

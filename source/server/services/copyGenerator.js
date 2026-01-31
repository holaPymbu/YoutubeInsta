/**
 * Genera copy para Instagram (descripción y hashtags) desde los conceptos
 */

/**
 * Generar descripción atractiva para Instagram
 */
function generateCaption(concepts, transcript) {
    const mainPoints = concepts
        .slice(0, 5)
        .map((c, i) => `${i + 1}. ${c.content}`)
        .join('\n\n');

    const caption = `✨ ¡Desliza para ver las ideas clave! ✨

${mainPoints}

💡 ¡Guarda esta publicación para después!
👉 Comparte con alguien que necesite ver esto

¿Qué punto te resonó más? ¡Déjalo en los comentarios! 👇

---
📌 Síguenos para más contenido valioso
🔄 Comparte para ayudar a otros a aprender`;

    return caption;
}

/**
 * Generar hashtags relevantes basados en el contenido
 */
function generateHashtags(concepts, transcript) {
    const baseHashtags = [
        '#conocimiento',
        '#aprendizaje',
        '#educacion',
        '#consejos',
        '#insights',
        '#motivacion',
        '#crecimientopersonal',
        '#desarrollopersonal',
        '#carrusel',
        '#infografia'
    ];

    const contentHashtags = [];
    const text = transcript.text.toLowerCase();

    // Detectar hashtags específicos por tema
    const topicMap = {
        negocio: ['#negocios', '#emprendedor', '#exito', '#startup'],
        business: ['#negocios', '#emprendedor', '#exito', '#startup'],
        tecnología: ['#tecnologia', '#tech', '#innovacion', '#digital'],
        tech: ['#tecnologia', '#tech', '#innovacion', '#digital'],
        marketing: ['#marketing', '#marketingdigital', '#redessociales', '#marca'],
        finanzas: ['#finanzas', '#inversiones', '#dinero', '#finanzaspersonales'],
        finance: ['#finanzas', '#inversiones', '#dinero', '#finanzaspersonales'],
        salud: ['#salud', '#bienestar', '#fitness', '#vidasaludable'],
        health: ['#salud', '#bienestar', '#fitness', '#vidasaludable'],
        productividad: ['#productividad', '#gestiondeltiempo', '#eficiencia', '#habitos'],
        productivity: ['#productividad', '#gestiondeltiempo', '#eficiencia', '#habitos'],
        liderazgo: ['#liderazgo', '#gestion', '#trabajoenequipo', '#lider'],
        leadership: ['#liderazgo', '#gestion', '#trabajoenequipo', '#lider']
    };

    for (const [topic, hashtags] of Object.entries(topicMap)) {
        if (text.includes(topic)) {
            contentHashtags.push(...hashtags.slice(0, 2));
        }
    }

    // Combinar y limitar hashtags
    const allHashtags = [...new Set([...contentHashtags, ...baseHashtags])];
    return allHashtags.slice(0, 15);
}

/**
 * Generar texto de llamada a la acción
 */
function generateCTA() {
    const ctas = [
        '💾 ¡Guarda esta publicación como referencia!',
        '📲 ¡Comparte con tu red!',
        '💬 ¡Comenta tus pensamientos abajo!',
        '👆 ¡Doble toque si estás de acuerdo!',
        '🔔 ¡Activa las notificaciones para más!'
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
}

/**
 * Generar copy completo para Instagram
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

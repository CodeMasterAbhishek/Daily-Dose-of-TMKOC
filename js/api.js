/**
 * API module for fetching TMKOC dataset and transforming into DailyBrief article objects.
 */

function extractVideoId(url) {
    if (!url) return '';
    const match = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|^)([a-zA-Z0-9_-]{11})(?:[&?]|$)/);
    return match ? match[1] : '';
}

function getCategoryForEp(epNum) {
    if (epNum >= 4450) return 'Trending';
    if (epNum <= 500) return 'Classic';
    if (epNum <= 1500) return 'Golden';
    if (epNum <= 3000) return 'Modern';
    return 'Recent';
}

export async function fetchNewsData() {
    try {
        const response = await fetch(`episodes.csv?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const lines = text.split('\n');

        const articles = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const match = line.match(/^(\d+),"?([^",]+|"[^"]+")?"?,([^,]+),?([^,]+)?$/);
            let epNum = 0, title = '', url = '', status = 'Found';

            if (match) {
                epNum = parseInt(match[1]);
                title = (match[2] || '').replace(/^"|"$/g, '');
                url = match[3] || '';
                status = match[4] || 'Found';
            } else {
                const parts = line.split(',');
                epNum = parseInt(parts[0]);
                url = parts[2] || '';
                title = parts[1] || '';
            }

            if (epNum > 0) {
                const videoId = extractVideoId(url);
                const category = getCategoryForEp(epNum);
                const image = videoId 
                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    : 'https://via.placeholder.com/480x270/18181b/818cf8?text=TMKOC+Episode';

                articles.push({
                    id: `ep_${epNum}`,
                    epNumber: epNum,
                    title: title || `Episode ${epNum} - Taarak Mehta Ka Ooltah Chashmah`,
                    description: `Watch full single episode ${epNum} of Gokuldham Society adventures.`,
                    category: category,
                    source: 'SONY SAB',
                    url: url,
                    videoId: videoId,
                    image: image,
                    publishedAt: new Date(Date.now() - (4500 - epNum) * 86400000).toISOString()
                });
            }
        }

        // Return articles sorted by newest episode first (like DailyBrief)
        return articles.sort((a, b) => b.epNumber - a.epNumber);

    } catch (error) {
        console.error("Could not fetch TMKOC dataset:", error);
        return [];
    }
}

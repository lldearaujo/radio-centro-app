import { XMLParser } from 'fast-xml-parser';
import { Config } from '../constants/config';

export interface YouTubeVideo {
    id: string;
    title: string;
    link: string;
    publishedAt: string;
    thumbnail: string;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

export const fetchYouTubeVideos = async (maxResults: number = 10): Promise<YouTubeVideo[]> => {
    try {
        if (!Config.youtube?.channelId) {
            console.warn('[YouTube] Config.youtube.channelId não configurado');
            return [];
        }

        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${Config.youtube.channelId}`;
        const response = await fetch(feedUrl);
        const xml = await response.text();
        const data = parser.parse(xml);

        const entries = data?.feed?.entry;
        if (!entries) {
            return [];
        }

        const list = Array.isArray(entries) ? entries : [entries];

        const videos: YouTubeVideo[] = list.map((entry: any) => {
            const videoId: string =
                entry['yt:videoId'] ||
                entry['yt:videoid'] ||
                (typeof entry.id === 'string' ? entry.id.replace('yt:video:', '') : '');

            const rawLink = Array.isArray(entry.link)
                ? entry.link[0]?.['@_href']
                : entry.link?.['@_href'];

            const link = rawLink || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');

            return {
                id: videoId || entry.id,
                title: entry.title || '',
                link,
                publishedAt: entry.published || entry.updated || '',
                thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
            };
        });

        return videos
            .filter((v) => v.id && v.title)
            .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
            .slice(0, maxResults);
    } catch (error) {
        console.error('Erro ao buscar vídeos do YouTube:', error);
        return [];
    }
};


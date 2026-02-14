import { XMLParser } from 'fast-xml-parser';
import { Config } from '../constants/config';

export interface Article {
    id: string;
    title: string;
    link: string;
    published: string;
    description: string;
    image?: string;
    content?: string;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});

export const fetchNews = async (): Promise<Article[]> => {
    try {
        const response = await fetch(Config.urls.newsFeed);
        const xml = await response.text();
        const feed = parser.parse(xml);

        // Check if feed.rss.channel.item exists and is an array
        const items = feed?.rss?.channel?.item;

        if (!items || !Array.isArray(items)) {
            console.warn('Feed items not found or not an array');
            return [];
        }

        return items.map((item: any) => {
            // Tentar extrair imagem do content:encoded ou description
            // fast-xml-parser fields might look different depending on structure, usually mapped directly
            let image = '';

            const contentEncoded = item['content:encoded'];

            if (item.enclosure && item.enclosure['@_url']) {
                image = item.enclosure['@_url'];
            } else if (contentEncoded) {
                const imgMatch = contentEncoded.match(/src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
            }

            return {
                id: item.guid || item.link || Math.random().toString(),
                title: item.title || 'Sem título',
                link: item.link || '',
                published: item.pubDate || '',
                description: item.description || '',
                image: image,
                content: contentEncoded,
            };
        });
    } catch (error) {
        console.error('Erro ao buscar notícias RSS:', error);
        return [];
    }
};

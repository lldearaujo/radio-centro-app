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
    categories?: string[];       // Todas as categorias da notícia
    primaryCategory?: string;    // Categoria principal (primeira)
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
        // Manter apenas notícias dos últimos 3 dias
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        const recentItems = items.filter((item: any) => {
            const rawDate: string | undefined =
                item.pubDate || item.pubdate || item.pub_date;
            if (!rawDate) return false;
            const parsed = new Date(rawDate);
            if (isNaN(parsed.getTime())) return false;
            return parsed >= threeDaysAgo;
        });

        return recentItems.map((item: any) => {
            // Tentar extrair imagem do content:encoded ou description
            // fast-xml-parser fields might look different depending on structure, usually mapped directly
            let image = '';

            const contentEncoded = item['content:encoded'];

            // Normalizar categorias (podem vir como string ou array)
            let categories: string[] = [];
            const rawCategory = item.category;

            if (Array.isArray(rawCategory)) {
                categories = rawCategory
                    .map((c: any) =>
                        typeof c === 'string'
                            ? c
                            : typeof c === 'object' && c !== null
                                ? (c['#text'] as string | undefined) ?? ''
                                : ''
                    )
                    .filter((c: string) => c.trim().length > 0);
            } else if (rawCategory) {
                if (typeof rawCategory === 'string') {
                    categories = [rawCategory];
                } else if (typeof rawCategory === 'object' && rawCategory !== null) {
                    const text = (rawCategory['#text'] as string | undefined) ?? '';
                    if (text.trim().length > 0) {
                        categories = [text];
                    }
                }
            }

            const primaryCategory = categories[0] || 'Geral';

            // Limpar códigos como &#124; ou "|" no início do título
            const rawTitle: string = item.title || 'Sem título';
            const cleanedTitle = rawTitle
                // remove combinações iniciais de espaços + &#124; ou |
                .replace(/^(\s*(\&\#124;|&#124;|\|))+/g, '')
                .trimStart();

            if (item.enclosure && item.enclosure['@_url']) {
                image = item.enclosure['@_url'];
            } else if (contentEncoded) {
                const imgMatch = contentEncoded.match(/src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
            }

            // Garantir ID único e em formato string para usar como key em listas
            let id: string | undefined;
            if (typeof item.link === 'string' && item.link.length > 0) {
                id = item.link;
            } else if (typeof item.guid === 'string') {
                id = item.guid;
            } else if (item.guid && typeof item.guid === 'object' && typeof item.guid['#text'] === 'string') {
                id = item.guid['#text'];
            } else {
                id = Math.random().toString();
            }

            return {
                id,
                title: cleanedTitle || 'Sem título',
                link: item.link || '',
                published: item.pubDate || '',
                description: item.description || '',
                image: image,
                content: contentEncoded,
                categories,
                primaryCategory,
            };
        });
    } catch (error) {
        console.error('Erro ao buscar notícias RSS:', error);
        return [];
    }
};

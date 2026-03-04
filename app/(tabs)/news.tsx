import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { fetchNews, Article } from '../../src/services/rss';
import { NewsCard } from '../../src/components/NewsCard';

export default function NewsScreen() {
    const [news, setNews] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        setLoading(true);
        const articles = await fetchNews();
        setNews(articles);

        // Extrair categorias e ordenar por "densidade" (mais notícias primeiro)
        const categoryCounts: Record<string, number> = {};
        for (const article of articles) {
            for (const category of article.categories ?? []) {
                const key = category.trim();
                if (!key) continue;
                categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
            }
        }

        const sortedCategories = Object.keys(categoryCounts).sort(
            (a, b) => categoryCounts[b] - categoryCounts[a]
        );

        setCategories(sortedCategories);
        setLoading(false);
    };

    const filteredNews =
        selectedCategory === 'Todas'
            ? news
            : news.filter((item) => item.categories?.includes(selectedCategory));

    const getArticleContent = (article: Article | null): string => {
        if (!article) return '';
        const source = article.content || article.description || '';
        if (!source) return '';

        let text = source;

        // Quebras de linha mais naturais
        text = text.replace(/<\/p>\s*<p>/gi, '\n\n');
        text = text.replace(/<br\s*\/?>/gi, '\n');

        // Remover todas as demais tags HTML
        text = text.replace(/<\/?[^>]+(>|$)/g, '');

        // Decodificar algumas entidades comuns
        const entities: Record<string, string> = {
            '&nbsp;': ' ',
            '&amp;': '&',
            '&quot;': '"',
            '&#39;': '\'',
            '&lt;': '<',
            '&gt;': '>',
        };

        Object.entries(entities).forEach(([entity, char]) => {
            text = text.replace(new RegExp(entity, 'g'), char);
        });

        return text.trim();
    };

    return (
        <View style={styles.container}>
            {/* Faixa de identidade visual mais leve (sem redundância de título) */}
            <View style={styles.brandHeader}>
                <Image
                    source={require('../../logos/radio_centro_logo_icon_vermelha.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                    <Text style={styles.brandTitle}>Rádio Centro Cajazeiras</Text>
                    <Text style={styles.brandSubtitle}>Sempre ligada na informação</Text>
                </View>
            </View>

            {/* Filtros por categoria */}
            {!loading && categories.length > 0 && (
                <View style={styles.filtersContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersScrollContent}
                    >
                        {['Todas', ...categories].map((category) => {
                            const isActive = selectedCategory === category;
                            return (
                                <TouchableOpacity
                                    key={category}
                                    onPress={() => setSelectedCategory(category)}
                                    style={[
                                        styles.filterChip,
                                        isActive && styles.filterChipActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            isActive && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredNews}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NewsCard article={item} onPress={setSelectedArticle} />
                    )}
                    refreshing={loading}
                    onRefresh={loadNews}
                    contentContainerStyle={{ paddingVertical: Spacing.sm }}
                />
            )}

            <Modal
                visible={!!selectedArticle}
                animationType="slide"
                onRequestClose={() => setSelectedArticle(null)}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setSelectedArticle(null)}>
                            <MaterialIcons name="close" size={24} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle} numberOfLines={1}>
                            {selectedArticle?.title}
                        </Text>
                    </View>
                    {selectedArticle && (
                        <ScrollView
                            style={styles.detailContent}
                            contentContainerStyle={styles.detailContentInner}
                        >
                            <View style={styles.detailBrand}>
                                <Image
                                    source={require('../../logos/radio_centro_logo_icon_vermelha.png')}
                                    style={styles.detailBrandLogo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.detailBrandText}>
                                    Rádio Centro • Notícias
                                </Text>
                            </View>

                            {selectedArticle.image ? (
                                <Image
                                    source={{ uri: selectedArticle.image }}
                                    style={styles.detailImage}
                                    resizeMode="cover"
                                />
                            ) : null}

                            <Text style={styles.detailTitle}>{selectedArticle.title}</Text>

                            <Text style={styles.detailMeta}>
                                {selectedArticle.primaryCategory
                                    ? `${selectedArticle.primaryCategory} • `
                                    : ''}
                                {selectedArticle.published
                                    ? new Date(selectedArticle.published).toLocaleDateString()
                                    : ''}
                            </Text>

                            <Text style={styles.detailBody}>
                                {getArticleContent(selectedArticle)}
                            </Text>
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    brandHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    brandLogo: {
        width: 40,
        height: 40,
        marginRight: Spacing.sm,
    },
    brandTitle: {
        fontSize: FontSize.lg,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    brandSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textLight,
    },
    filtersContainer: {
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.white,
    },
    filtersScrollContent: {
        paddingHorizontal: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: Spacing.xs,
        backgroundColor: Colors.white,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    filterChipTextActive: {
        color: Colors.white,
        fontWeight: 'bold',
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        color: Colors.text,
    },
    modalHeader: {
        height: 56,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    modalTitle: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: 'bold',
        marginLeft: Spacing.md,
        flex: 1,
    },
    detailContent: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    detailContentInner: {
        padding: Spacing.md,
    },
    detailImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: Spacing.md,
        backgroundColor: Colors.gray,
    },
    detailTitle: {
        fontSize: FontSize.lg,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    detailMeta: {
        fontSize: FontSize.xs,
        color: Colors.textLight,
        marginBottom: Spacing.md,
    },
    detailBody: {
        fontSize: FontSize.md,
        color: Colors.text,
        lineHeight: 22,
    },
    detailBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    detailBrandLogo: {
        width: 28,
        height: 28,
        marginRight: Spacing.sm,
    },
    detailBrandText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textLight,
    },
});

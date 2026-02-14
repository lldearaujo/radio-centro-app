import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { fetchNews, Article } from '../../src/services/rss';
import { NewsCard } from '../../src/components/NewsCard';

export default function NewsScreen() {
    const [news, setNews] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        setLoading(true);
        const articles = await fetchNews();
        setNews(articles);
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={news}
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
                        <WebView source={{ uri: selectedArticle.link }} style={{ flex: 1 }} />
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
});

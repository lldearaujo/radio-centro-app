import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Article } from '../services/rss';
import { Colors, Spacing, FontSize } from '../constants/theme';

interface NewsCardProps {
    article: Article;
    onPress: (article: Article) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(article)}>
            {article.image ? (
                <Image source={{ uri: article.image }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.placeholder]} />
            )}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
                <Text style={styles.date}>{new Date(article.published).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 8,
        marginVertical: Spacing.xs,
        marginHorizontal: Spacing.sm,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        padding: Spacing.sm,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 4,
        backgroundColor: Colors.gray,
    },
    placeholder: {
        backgroundColor: Colors.primary,
        opacity: 0.1,
    },
    content: {
        flex: 1,
        marginLeft: Spacing.sm,
        justifyContent: 'center',
    },
    title: {
        fontSize: FontSize.md,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    date: {
        fontSize: FontSize.xs,
        color: Colors.textLight,
    },
});

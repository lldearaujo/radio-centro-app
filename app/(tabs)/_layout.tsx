import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: Colors.white,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textLight,
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Ao vivo',
                    tabBarLabel: 'Rádio',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="radio" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="video"
                options={{
                    title: 'TV Centro',
                    tabBarLabel: 'TV/Vídeo',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="live-tv" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="news"
                options={{
                    title: 'Notícias',
                    tabBarLabel: 'Notícias',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="article" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Programação',
                    tabBarLabel: 'Programação',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="schedule" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="polls"
                options={{
                    title: 'Enquetes',
                    tabBarLabel: 'Enquetes',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="how-to-vote" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

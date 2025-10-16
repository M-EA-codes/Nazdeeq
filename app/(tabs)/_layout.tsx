import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function TabBarIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="neighborcommute"
        options={{
          title: 'Commute',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'car' : 'car-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="neighborworks"
        options={{
          title: 'Works',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'briefcase' : 'briefcase-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vibetribe"
        options={{
          title: 'VibeTribe',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'musical-notes' : 'musical-notes-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
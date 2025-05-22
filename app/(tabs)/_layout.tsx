import React from 'react';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  const tintColor = useThemeColor({ light: '#3b5998', dark: '#4c669f' }, 'tint');
  const tabColor = useThemeColor({ light: '#666', dark: '#ccc' }, 'text');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: tabColor,
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
        },
        tabBarBackground: () => TabBarBackground,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <IconSymbol name="person.3.fill" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="neighborWorks"
        options={{
          title: 'NeighborWorks',
          tabBarIcon: ({ color }) => <IconSymbol name="wrench.and.screwdriver.fill" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol name="person.crop.circle.fill" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
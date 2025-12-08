import React from 'react';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

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
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="home"
              size={24}
              color={focused ? '#3b5998' : '#4c669f'}
              solid
            />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="users"
              size={24}
              color={focused ? '#3b5998' : '#4c669f'}
              solid
            />
          ),
        }}
        initialParams={{ screen: 'Dashboard' }}
      />
      <Tabs.Screen
        name="neighborWorks"
        options={{
          title: 'NeighborWorks',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="tools"
              size={24}
              color={focused ? '#3b5998' : '#4c669f'}
              solid
            />
          ),
        }}
      />
      <Tabs.Screen
        name="neighborcommute"
        options={{
          title: 'NeighborCommute',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="car"
              size={24}
              color={focused ? '#3b5998' : '#4c669f'}
              solid
            />
          ),
        }}
        initialParams={{ screen: 'Dashboard' }}
      />
      <Tabs.Screen
        name="vibetribe"
        options={{
          title: 'VibeTribe',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="people-alt"
              size={26}
              color={focused ? '#3b5998' : '#4c669f'}
            />
          ),
        }}
        initialParams={{ screen: 'Dashboard' }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="user-circle"
              size={24}
              color={focused ? '#3b5998' : '#4c669f'}
              solid={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
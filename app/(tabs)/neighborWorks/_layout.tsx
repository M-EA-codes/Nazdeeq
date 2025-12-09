import React from 'react';
import { Stack } from 'expo-router';

export default function NeighborWorksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="ServiceList" />
      <Stack.Screen name="ServiceProviderDashboard" />
      <Stack.Screen name="AddService" />
      <Stack.Screen name="BookingList" />
      <Stack.Screen name="MyBookings" />
      <Stack.Screen name="ProviderProfile" />
    </Stack>
  );
}
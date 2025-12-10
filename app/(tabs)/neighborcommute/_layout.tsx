import React from 'react';
import { Stack } from 'expo-router';

export default function NeighborCommuteLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="RideDiscovery" />
      <Stack.Screen name="RideOffer" />
      <Stack.Screen name="MyRides" />
    </Stack>
  );
}

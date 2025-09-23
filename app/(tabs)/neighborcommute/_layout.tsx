import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NeighborCommuteDashboard from './Dashboard';
import RideDiscovery from './RideDiscovery';
import RideOffer from './RideOffer';
import MyRides from './MyRides';

const Stack = createNativeStackNavigator();

export default function NeighborCommuteLayout() {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={NeighborCommuteDashboard} 
        options={{ title: 'Neighbor Commute' }} 
      />
      <Stack.Screen 
        name="RideDiscovery" 
        component={RideDiscovery} 
        options={{ title: 'Find Rides' }} 
      />
      <Stack.Screen 
        name="RideOffer" 
        component={RideOffer} 
        options={{ title: 'Offer Ride' }} 
      />
      <Stack.Screen 
        name="MyRides" 
        component={MyRides} 
        options={{ title: 'My Rides' }} 
      />
    </Stack.Navigator>
  );
}

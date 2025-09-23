import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NeighborWorksDashboard from './Dashboard';
import ServiceList from './ServiceList';
import ServiceProviderDashboard from './ServiceProviderDashboard';
import AddService from './AddService';
import BookingList from './BookingList';
import MyBookings from './MyBookings'; // Add this import
import ProviderProfile from './ProviderProfile';

const Stack = createNativeStackNavigator();

export default function NeighborWorksLayout() {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={NeighborWorksDashboard} 
      />
      <Stack.Screen 
        name="ServiceList" 
        component={ServiceList} 
      />
      <Stack.Screen 
        name="ServiceProviderDashboard" 
        component={ServiceProviderDashboard} 
      />
      <Stack.Screen 
        name="AddService" 
        component={AddService} 
      />
      <Stack.Screen 
        name="BookingList" 
        component={BookingList} 
      />
      <Stack.Screen 
        name="MyBookings" 
        component={MyBookings} 
      />
      <Stack.Screen 
        name="ProviderProfile" 
        component={ProviderProfile} 
      />
    </Stack.Navigator>
  );
}
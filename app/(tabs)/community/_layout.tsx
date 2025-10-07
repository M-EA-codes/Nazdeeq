import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './Dashboard';
import InterestSelection from './InterestSelection';
import MatchedUsers from './MatchedUsers';
import UserProfile from './UserProfile';
import ConnectionsList from './ConnectionsList';
import ConnectionRequests from './ConnectionRequests';
import ConversationsList from './ConversationsList';
import ChatScreen from './ChatScreen';

const Stack = createNativeStackNavigator();

function StackNavigator() {
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
        component={Dashboard} 
        options={{ title: 'VibeTribe' }} 
      />
      
      <Stack.Screen 
        name="InterestSelection" 
        component={InterestSelection} 
        options={{ title: 'Choose Interests' }} 
      />
      
      <Stack.Screen 
        name="MatchedUsers" 
        component={MatchedUsers} 
        options={{ title: 'Your Matches' }} 
      />
      
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfile} 
        options={{ title: 'User Profile' }} 
      />

      <Stack.Screen 
        name="ConnectionsList" 
        component={ConnectionsList} 
        options={{ title: 'My Connections' }} 
      />

      <Stack.Screen 
        name="ConnectionRequests" 
        component={ConnectionRequests} 
        options={{ title: 'Connection Requests' }} 
      />

      <Stack.Screen 
        name="ConversationsList" 
        component={ConversationsList} 
        options={{ title: 'Messages' }} 
      />

      <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen} 
        options={{ title: 'Chat' }} 
      />
    </Stack.Navigator>
  );
}

export default function CommunityLayout() {
  return <StackNavigator />;
}

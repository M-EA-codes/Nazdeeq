import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityDashboard from './Dashboard';
import EventsList from './EventsList';
import CreateEvent from './CreateEvent';
import EventDetails from './EventDetails';
import GroupsList from './GroupsList';
import CreateGroup from './CreateGroup';
import GroupDetails from './GroupDetails';
import DiscussionsList from './DiscussionsList';
import CreateDiscussion from './CreateDiscussion';
import DiscussionDetails from './DiscussionDetails';
import PollDetails from './PollDetails';
import CreatePoll from './CreatePoll';

const Stack = createNativeStackNavigator();

export default function CommunityLayout() {
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
        component={CommunityDashboard} 
        options={{ title: 'VibeTribe' }} 
      />
      
      {/* Events Screens */}
      <Stack.Screen 
        name="EventsList" 
        component={EventsList} 
        options={{ title: 'Community Events' }} 
      />
      <Stack.Screen 
        name="CreateEvent" 
        component={CreateEvent} 
        options={{ title: 'Create Event' }} 
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetails} 
        options={{ title: 'Event Details' }} 
      />
      
      {/* Groups Screens */}
      <Stack.Screen 
        name="GroupsList" 
        component={GroupsList} 
        options={{ title: 'Community Groups' }} 
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroup} 
        options={{ title: 'Create Group' }} 
      />
      <Stack.Screen 
        name="GroupDetails" 
        component={GroupDetails} 
        options={{ title: 'Group Details' }} 
      />
      
      {/* Discussions Screens */}
      <Stack.Screen 
        name="DiscussionsList" 
        component={DiscussionsList} 
        options={{ title: 'Discussions' }} 
      />
      <Stack.Screen 
        name="CreateDiscussion" 
        component={CreateDiscussion} 
        options={{ title: 'Start Discussion' }} 
      />
      <Stack.Screen 
        name="DiscussionDetails" 
        component={DiscussionDetails} 
        options={{ title: 'Discussion' }} 
      />
      
      {/* Polls Screens */}
      <Stack.Screen 
        name="PollDetails" 
        component={PollDetails} 
        options={{ title: 'Poll Details' }} 
      />
      <Stack.Screen 
        name="CreatePoll" 
        component={CreatePoll} 
        options={{ title: 'Create Poll' }} 
      />
    </Stack.Navigator>
  );
}

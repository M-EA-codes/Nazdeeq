import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityPulseDashboard from './Dashboard';
import DiscussionForum from './DiscussionForum';
import CreateDiscussion from './CreateDiscussion';
import DiscussionDetail from './DiscussionDetail';
import PollsSection from './PollsSection';
import CreatePoll from './CreatePoll';
import PollDetail from './PollDetail';

const Stack = createNativeStackNavigator();

export default function CommunityLayout() {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="CommunityDashboard"
    >
      <Stack.Screen 
        name="CommunityDashboard" 
        component={CommunityPulseDashboard} 
      />
      <Stack.Screen 
        name="DiscussionForum" 
        component={DiscussionForum} 
      />
      <Stack.Screen 
        name="CreateDiscussion" 
        component={CreateDiscussion} 
      />
      <Stack.Screen 
        name="DiscussionDetail" 
        component={DiscussionDetail} 
      />
      <Stack.Screen 
        name="PollsSection" 
        component={PollsSection} 
      />
      <Stack.Screen 
        name="CreatePoll" 
        component={CreatePoll} 
      />
      <Stack.Screen 
        name="PollDetail" 
        component={PollDetail} 
      />
    </Stack.Navigator>
  );
}
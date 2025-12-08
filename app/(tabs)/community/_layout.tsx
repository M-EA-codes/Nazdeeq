import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityDashboard from './Dashboard';
import DiscussionForum from './DiscussionForum';
import PollsSection from './PollsSection';
import PollDetail from './PollDetail';
import CreatePoll from './CreatePoll';
import CreateDiscussion from './CreateDiscussion';
import DiscussionDetail from './DiscussionDetail';

const Stack = createNativeStackNavigator();

export default function CommunityLayout() {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        animationTypeForReplace: 'push',
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={CommunityDashboard}
        options={{
          title: 'Community',
        }}
      />
      <Stack.Screen 
        name="DiscussionForum" 
        component={DiscussionForum}
        options={{
          title: 'Discussions',
        }}
      />
      <Stack.Screen 
        name="PollsSection" 
        component={PollsSection}
        options={{
          title: 'Polls',
        }}
      />
      <Stack.Screen 
        name="PollDetail" 
        component={PollDetail}
        options={{
          title: 'Poll Detail',
        }}
      />
      <Stack.Screen 
        name="CreatePoll" 
        component={CreatePoll}
        options={{
          title: 'Create Poll',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="CreateDiscussion" 
        component={CreateDiscussion}
        options={{
          title: 'Create Discussion',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="DiscussionDetail" 
        component={DiscussionDetail}
        options={{
          title: 'Discussion',
        }}
      />
   </Stack.Navigator>
  );
}
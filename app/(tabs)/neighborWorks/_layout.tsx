import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './Dashboard';
import ProviderProfile from './ProviderProfile';
import ServiceList from './ServiceList';
import ReviewSection from './ReviewSection';
import BookingList from './BookingList';

const Stack = createNativeStackNavigator();

export default function NeighborWorksLayout() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Profile" component={ProviderProfile} />
      <Stack.Screen name="Services" component={ServiceList} />
      <Stack.Screen name="Bookings" component={BookingList} />
      <Stack.Screen name="Reviews" component={ReviewSection} />
    </Stack.Navigator>
  );
}
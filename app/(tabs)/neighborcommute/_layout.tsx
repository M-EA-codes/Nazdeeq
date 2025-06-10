import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NeighborCommuteDashboard from './Dashboard';
import RideDiscovery from './RideDiscovery';
import RideOffer from './RideOffer';
import MyRides from './MyRides';

const Stack = createNativeStackNavigator();

export default function NeighborCommuteLayout() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={NeighborCommuteDashboard} options={{ title: 'Commute Options' }} />
      <Stack.Screen name="RideDiscovery" component={RideDiscovery} options={{ title: 'Ride Discovery' }} />
      <Stack.Screen name="RideOffer" component={RideOffer} options={{ title: 'Ride Offer' }} />
      <Stack.Screen name="MyRides" component={MyRides} options={{ title: 'My Rides' }} />
    </Stack.Navigator>
  );
}

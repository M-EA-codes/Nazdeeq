import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

export default function NeighborCommuteDashboard({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RideDiscovery')}>
        <Text style={styles.title}>Ride Discovery</Text>
        <Text>Find available rides</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RideOffer')}>
        <Text style={styles.title}>Ride Offer</Text>
        <Text>Offer a ride (coming soon)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MyRides')}>
        <Text style={styles.title}>My Rides</Text>
        <Text>View rides you've offered or joined</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f7f9fa', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 18, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#3b5998' },
});
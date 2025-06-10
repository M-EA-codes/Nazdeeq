import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

// Dummy data for demonstration
const myRides = [
  {
    _id: '1',
    type: 'offered',
    origin: 'F-11 Markaz',
    destination: 'H-9 GIKI Bus Stop',
    dateTime: '2025-06-07T08:00:00Z',
    seatsAvailable: 2,
    status: 'upcoming',
  },
  {
    _id: '2',
    type: 'joined',
    origin: 'G-10',
    destination: 'F-8',
    dateTime: '2025-06-08T09:30:00Z',
    seatsAvailable: 1,
    status: 'completed',
  },
];

export default function MyRides() {
  const [rides, setRides] = useState(myRides);

  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.type}>{item.type === 'offered' ? 'Offered Ride' : 'Joined Ride'}</Text>
      <Text style={styles.route}>{item.origin} → {item.destination}</Text>
      <Text style={styles.datetime}>{new Date(item.dateTime).toLocaleString()}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
      <Text style={styles.seats}>Seats: {item.seatsAvailable}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Rides</Text>
      <FlatList
        data={rides}
        keyExtractor={item => item._id}
        renderItem={renderRide}
        ListEmptyComponent={<Text>No rides found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f2f2f2', padding: 16, borderRadius: 8, marginBottom: 12 },
  type: { fontWeight: 'bold', color: '#007AFF' },
  route: { fontSize: 16, marginVertical: 4 },
  datetime: { color: '#555' },
  status: { color: '#888', marginTop: 4 },
  seats: { color: '#333' },
});
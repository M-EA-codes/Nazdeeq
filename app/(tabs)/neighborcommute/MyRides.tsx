import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

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
    <LinearGradient
      colors={["#fff", "#f3f3ff"]}
      style={styles.rideCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.rideCardRow}>
        <FontAwesome5 name={item.type === 'offered' ? 'car' : 'user-friends'} size={28} color={item.type === 'offered' ? '#4b32c3' : '#3a8fd2'} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rideType}>{item.type === 'offered' ? 'Offered Ride' : 'Joined Ride'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <MaterialIcons name="location-on" size={16} color="#3ad29f" />
            <Text style={styles.rideRoute}>{item.origin} → {item.destination}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <MaterialIcons name="event" size={15} color="#7f53ac" />
            <Text style={styles.rideDate}>{new Date(item.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>
      </View>
      <View style={styles.rideDetailsRow}>
        <View style={styles.rideDetailItem}>
          <FontAwesome5 name="users" size={14} color="#3a8fd2" />
          <Text style={styles.rideDetailText}>{item.seatsAvailable} seats</Text>
        </View>
        <View style={styles.rideDetailItem}>
          <MaterialIcons name="info" size={14} color={item.status === 'completed' ? '#3ad29f' : '#7f53ac'} />
          <Text style={[styles.rideDetailText, { color: item.status === 'completed' ? '#3ad29f' : '#7f53ac' }]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={["#e0c3fc", "#8ec5fc"]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.header}>My Rides</Text>
        <FlatList
          data={rides}
          keyExtractor={item => item._id}
          renderItem={renderRide}
          ListEmptyComponent={<Text style={{ color: '#23235b', textAlign: 'center', marginTop: 30 }}>No rides found.</Text>}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, padding: 18, paddingTop: 36 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 18, color: '#23235b', alignSelf: 'center', letterSpacing: 1 },
  rideCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: '#fff',
  },
  rideCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rideType: { fontWeight: 'bold', fontSize: 17, color: '#4b32c3', marginBottom: 2 },
  rideRoute: { fontSize: 15, color: '#23235b', marginLeft: 4 },
  rideDate: { fontSize: 13, color: '#7f53ac', marginLeft: 4 },
  rideDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 4 },
  rideDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rideDetailText: { fontSize: 13, color: '#23235b', marginLeft: 4 },
});
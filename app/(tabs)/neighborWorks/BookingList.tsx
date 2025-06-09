import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BookingList({ route }: { route: any }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'provider' | 'seeker'>('seeker');

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      // Determine user type (provider or seeker) from AsyncStorage or route params
      let type = 'seeker';
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          if (parsed.roles && parsed.roles.serviceProvider) type = 'provider';
        }
      } catch {}
      setUserType(type as 'provider' | 'seeker');
      // Fetch bookings from backend
      const userId = route?.params?.userId || '';
      const url = type === 'provider'
        ? `http://localhost:5000/api/service-requests?providerId=${userId}`
        : `http://localhost:5000/api/service-requests?seekerId=${userId}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setBookings(data);
      } catch {}
      setLoading(false);
    };
    fetchBookings();
  }, [route]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b5998" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>{userType === 'provider' ? 'Service Requests Received' : 'My Service Bookings'}</ThemedText>
      <FlatList
        data={bookings}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText type="subtitle">{item.service?.category || 'Service'}</ThemedText>
            <ThemedText>Status: {item.status}</ThemedText>
            <ThemedText>Date: {item.date}</ThemedText>
            <ThemedText>
              {userType === 'provider' ? `Seeker: ${item.seeker?.fullName}` : `Provider: ${item.provider?.fullName}`}
            </ThemedText>
          </View>
        )}
        ListEmptyComponent={<Text>No bookings found.</Text>}
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fa',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3b5998',
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
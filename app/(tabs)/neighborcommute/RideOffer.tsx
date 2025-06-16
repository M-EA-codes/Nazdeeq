import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function RideOffer() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [seats, setSeats] = useState('');
  const [notes, setNotes] = useState('');

  const handleOfferRide = async () => {
    if (!origin || !destination || !dateTime || !seats) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    try {
      // Optionally get userId from AsyncStorage if you want to associate the ride with a user
      let driverId = null;
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          driverId = parsed.userId;
        }
      } catch {}
      if (!driverId) {
        Alert.alert('Not Logged In', 'You must be logged in to offer a ride.');
        return;
      }
      const rideData = {
        driverId, // can be null if not logged in
        origin: { name: origin },
        destination: { name: destination },
        dateTime: new Date(dateTime),
        seatsAvailable: Number(seats),
        fare: 0, // or add a fare input if needed
        status: 'open',
        notes,
      };
      await api.post('/rides', rideData);
      Alert.alert('Ride Offered', 'Your ride offer has been submitted!');
      setOrigin('');
      setDestination('');
      setDateTime('');
      setSeats('');
      setNotes('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit ride offer.');
    }
  };

  return (
    <LinearGradient colors={["#e0c3fc", "#8ec5fc"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <FontAwesome5 name="car" size={28} color="#4b32c3" style={{ marginRight: 10 }} />
          <Text style={styles.header}>Offer a Ride</Text>
        </View>
        <View style={styles.formCard}>
          <View style={styles.inputRow}>
            <MaterialIcons name="location-on" size={22} color="#3ad29f" />
            <TextInput
              style={styles.input}
              placeholder="Origin"
              placeholderTextColor="#bbb"
              value={origin}
              onChangeText={setOrigin}
            />
          </View>
          <View style={styles.inputRow}>
            <MaterialIcons name="location-on" size={22} color="#3a8fd2" />
            <TextInput
              style={styles.input}
              placeholder="Destination"
              placeholderTextColor="#bbb"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
          <View style={styles.inputRow}>
            <MaterialIcons name="event" size={22} color="#7f53ac" />
            <TextInput
              style={styles.input}
              placeholder="Date & Time (e.g. 2025-06-07 08:00)"
              placeholderTextColor="#bbb"
              value={dateTime}
              onChangeText={setDateTime}
            />
          </View>
          <View style={styles.inputRow}>
            <FontAwesome5 name="users" size={20} color="#4b32c3" />
            <TextInput
              style={styles.input}
              placeholder="Seats Available"
              placeholderTextColor="#bbb"
              value={seats}
              onChangeText={setSeats}
              keyboardType="numeric"
            />
          </View>
          <TextInput
            style={[styles.input, { marginLeft: 0 }]}
            placeholder="Notes (optional)"
            placeholderTextColor="#bbb"
            value={notes}
            onChangeText={setNotes}
          />
          <TouchableOpacity style={styles.button} onPress={handleOfferRide}>
            <Text style={styles.buttonText}>Submit Offer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, alignSelf: 'center' },
  header: { fontSize: 26, fontWeight: 'bold', color: '#23235b', letterSpacing: 1 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 18, elevation: 4, shadowColor: '#b39ddb', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 50, marginBottom: 14, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  input: { fontSize: 16, color: '#23235b', marginLeft: 10, flex: 1, fontWeight: '500', backgroundColor: 'transparent' },
  button: { backgroundColor: '#4b32c3', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
});
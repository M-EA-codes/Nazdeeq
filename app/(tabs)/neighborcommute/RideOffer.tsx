import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function RideOffer() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [seats, setSeats] = useState('');
  const [notes, setNotes] = useState('');

  const handleOfferRide = () => {
    // TODO: Add backend integration
    Alert.alert('Ride Offered', 'Your ride offer has been submitted!');
    setOrigin('');
    setDestination('');
    setDateTime('');
    setSeats('');
    setNotes('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Offer a Ride</Text>
      <TextInput
        style={styles.input}
        placeholder="Origin"
        value={origin}
        onChangeText={setOrigin}
      />
      <TextInput
        style={styles.input}
        placeholder="Destination"
        value={destination}
        onChangeText={setDestination}
      />
      <TextInput
        style={styles.input}
        placeholder="Date & Time (e.g. 2025-06-07 08:00)"
        value={dateTime}
        onChangeText={setDateTime}
      />
      <TextInput
        style={styles.input}
        placeholder="Seats Available"
        value={seats}
        onChangeText={setSeats}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
      />
      <TouchableOpacity style={styles.button} onPress={handleOfferRide}>
        <Text style={styles.buttonText}>Submit Offer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f7f9fa' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#3b5998', alignSelf: 'center' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 16 },
  button: { backgroundColor: '#3b5998', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
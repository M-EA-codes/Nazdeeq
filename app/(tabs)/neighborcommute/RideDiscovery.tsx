import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import api from '../../api';

interface Ride {
  _id: string;
  driverId?: { fullName?: string } | string;
  origin?: { name?: string };
  destination?: { name?: string };
  dateTime?: string;
  seatsAvailable?: number;
  fare?: number;
  notes?: string;
}

export default function RideDiscovery() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rides');
      setRides(res.data);
    } catch (err) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rides');
      let filtered: Ride[] = res.data;
      if (pickup) filtered = filtered.filter(r => r.origin?.name?.toLowerCase().includes(pickup.toLowerCase()));
      if (dropoff) filtered = filtered.filter(r => r.destination?.name?.toLowerCase().includes(dropoff.toLowerCase()));
      if (date) filtered = filtered.filter(r => r.dateTime?.startsWith(date));
      setRides(filtered);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const renderRide = ({ item }: { item: Ride }) => (
    <View style={styles.rideCardWhite}>
      <View style={styles.rideCardRow}>
        <Image source={require('../../assets/images/profile-placeholder.png')} style={styles.profilePic} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="location-on" size={18} color="#3ad29f" />
            <Text style={styles.rideTitleBlack}>{item.origin?.name || 'FAST NUCES'}</Text>
            <View style={styles.trustBadge}><Text style={styles.trustBadgeText}>90</Text></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <MaterialIcons name="location-on" size={16} color="#3a8fd2" />
            <Text style={styles.rideSubtitleBlack}>{item.destination?.name || 'Media Town'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <MaterialIcons name="calendar-today" size={15} color="#7f53ac" />
            <Text style={styles.rideDateBlack}>
              {item.dateTime ? new Date(item.dateTime).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              }) : 'Jun 7, 2025 - 11:00 AM'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.rideDetailsRow}>
        <View style={styles.rideDetailItem}>
          <FontAwesome5 name="user-friends" size={16} color="#3a8fd2" />
          <Text style={styles.rideDetailTextBlack}>1 seat</Text>
        </View>
        <View style={styles.rideDetailItem}>
          <MaterialIcons name="access-time" size={16} color="#7f53ac" />
          <Text style={styles.rideDetailTextBlack}>15 min</Text>
        </View>
        <View style={styles.rideDetailItem}>
          <MaterialIcons name="attach-money" size={16} color="#3ad29f" />
          <Text style={styles.rideDetailTextFree}>FREE</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.joinBtnCard}>
        <Text style={styles.joinText}>JOIN RIDE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={["#23235b", "#6d3fd4"]} style={styles.gradient}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Ride Discovery</Text>
          </View>

          {/* Search */}
          <LinearGradient colors={["#6d3fd4", "#8f5cff"]} style={styles.formCard}>
            <View style={styles.inputRow}>
              <MaterialIcons name="location-pin" size={22} color="#3ad29f" />
              <TextInput style={styles.input} placeholder="Pickup location" placeholderTextColor="#bbb" value={pickup} onChangeText={setPickup} />
            </View>
            <View style={styles.inputRow}>
              <MaterialIcons name="location-pin" size={22} color="#3a8fd2" />
              <TextInput style={styles.input} placeholder="Dropoff location" placeholderTextColor="#bbb" value={dropoff} onChangeText={setDropoff} />
            </View>
            <View style={styles.inputRow}>
              <Feather name="calendar" size={20} color="#fff" />
              <TextInput style={styles.input} placeholder="Departure (YYYY-MM-DD)" placeholderTextColor="#bbb" value={date} onChangeText={setDate} />
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>SEARCH</Text>
            </TouchableOpacity>
          </LinearGradient>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={rides}
              keyExtractor={item => item._id}
              renderItem={renderRide}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#fff', fontWeight: 'bold' }}>No rides found.</Text>}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 18, paddingHorizontal: 10 },
  backBtn: { marginRight: 10 },
  title: { flex: 1, fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 },
  formCard: { borderRadius: 24, padding: 18, marginHorizontal: 6, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 50, marginBottom: 14, paddingHorizontal: 16, paddingVertical: 10 },
  input: { fontSize: 16, color: '#23235b', marginLeft: 10, flex: 1, fontWeight: '500' },
  searchBtn: { backgroundColor: '#6d3fd4', borderRadius: 50, padding: 16, alignItems: 'center', marginTop: 8 },
  searchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 2 },
  rideCardWhite: { borderRadius: 20, padding: 16, marginBottom: 18, backgroundColor: '#fff', elevation: 6, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  rideCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  profilePic: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', borderWidth: 2, borderColor: '#fff' },
  rideTitleBlack: { fontWeight: 'bold', fontSize: 17, color: '#232323', marginLeft: 4 },
  trustBadge: { marginLeft: 'auto', backgroundColor: '#7f53ac', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 2, alignItems: 'center' },
  trustBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  rideSubtitleBlack: { fontSize: 14, color: '#232323', marginLeft: 4 },
  rideDateBlack: { fontSize: 13, color: '#232323', marginLeft: 4 },
  rideDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rideDetailItem: { flexDirection: 'row', alignItems: 'center' },
  rideDetailTextBlack: { fontSize: 13, color: '#232323', marginLeft: 4 },
  rideDetailTextFree: { fontSize: 13, color: '#3ad29f', fontWeight: 'bold', marginLeft: 4 },
  joinBtnCard: { backgroundColor: '#4b32c3', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  joinText: { color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 },
});

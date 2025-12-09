import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView 
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function RideOffer() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [seats, setSeats] = useState('');
  const [fare, setFare] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Popular location suggestions
  const popularLocations = [
    'Blue Area, Islamabad',
    'F-8 Markaz',
    'Centaurus Mall',
    'Saidpur Village',
    'Pakistan Institute of Medical Sciences',
    'Quaid-e-Azam University',
    'Islamabad Airport',
    'Saddar, Rawalpindi',
    'Committee Chowk',
    'Benazir Bhutto Hospital'
  ];

  useEffect(() => {
    fetchUserData();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    
    // Set default time to 8 AM
    const defaultTime = new Date();
    defaultTime.setHours(8, 0, 0, 0);
    setSelectedTime(defaultTime);
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const prefs = await AsyncStorage.getItem('userPreferences');
      if (storedUserId) {
        setUserId(storedUserId);
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        setUserId(parsed.userId);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const combineDateTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined;
  };

  const validateInputs = (): boolean => {
    if (!origin.trim()) {
      Alert.alert('Missing Origin', 'Please enter where you\'ll be starting from.');
      return false;
    }
    
    if (!destination.trim()) {
      Alert.alert('Missing Destination', 'Please enter where you\'re going.');
      return false;
    }
    
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Date/Time', 'Please select both date and time for your ride.');
      return false;
    }
    
    const rideDateTime = combineDateTime(selectedDate, selectedTime);
    if (rideDateTime <= new Date()) {
      Alert.alert('Invalid Date/Time', 'Please select a future date and time.');
      return false;
    }
    
    const seatsNum = parseInt(seats);
    if (!seats || isNaN(seatsNum) || seatsNum < 1 || seatsNum > 8) {
      Alert.alert('Invalid Seats', 'Please enter a valid number of seats (1-8).');
      return false;
    }
    
    const fareNum = fare ? parseFloat(fare) : 0;
    if (fare && (isNaN(fareNum) || fareNum < 0)) {
      Alert.alert('Invalid Fare', 'Please enter a valid fare amount.');
      return false;
    }
    
    return true;
  };

  const handleOfferRide = async () => {
    if (!validateInputs()) return;
    
    if (!userId) {
      Alert.alert('Authentication Error', 'Please log in to offer a ride.');
      return;
    }

    setLoading(true);
    try {
      const rideData = {
        driverId: userId,
        origin: { 
          name: origin.trim(),
          address: origin.trim()
        },
        destination: { 
          name: destination.trim(),
          address: destination.trim()
        },
        dateTime: combineDateTime(selectedDate!, selectedTime!).toISOString(),
        seatsAvailable: parseInt(seats),
        totalSeats: parseInt(seats),
        fare: fare ? parseFloat(fare) : 0,
        notes: notes.trim(),
        status: 'open'
      };

      console.log('Offering ride:', rideData);
      
      const response = await api.post('/rides', rideData);
      
      Alert.alert(
        'Success!', 
        'Your ride has been offered successfully! Passengers can now find and join your ride.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setOrigin('');
              setDestination('');
              setSeats('');
              setFare('');
              setNotes('');
              
              // Reset to default date/time
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setSelectedDate(tomorrow);
              
              const defaultTime = new Date();
              defaultTime.setHours(8, 0, 0, 0);
              setSelectedTime(defaultTime);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Offer ride error:', error);
      let message = 'Failed to offer ride. Please try again.';
      
      if (error.message.includes('Unable to connect to server')) {
        message = 'Unable to connect to server. Please check your internet connection and ensure the server is running.';
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message) {
        message = error.message;
      }
      
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const LocationSuggestion = ({ location, onPress }: { location: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={onPress}>
      <MaterialIcons name="location-on" size={16} color="#666" />
      <Text style={styles.suggestionText}>{location}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.gradient}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <FontAwesome5 name="car" size={40} color="#fff" />
            <Text style={styles.title}>Offer a Ride</Text>
            <Text style={styles.subtitle}>Share your journey and help neighbors</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>From</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="radio-button-checked" size={20} color="#3ad29f" />
                <TextInput
                  style={styles.input}
                  placeholder="Where are you starting from?"
                  placeholderTextColor="#999"
                  value={origin}
                  onChangeText={setOrigin}
                  returnKeyType="next"
                />
              </View>
              
              {origin.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {popularLocations
                    .filter(loc => loc.toLowerCase().includes(origin.toLowerCase()))
                    .slice(0, 3)
                    .map((location, index) => (
                      <LocationSuggestion
                        key={index}
                        location={location}
                        onPress={() => setOrigin(location)}
                      />
                    ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>To</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-on" size={20} color="#3a8fd2" />
                <TextInput
                  style={styles.input}
                  placeholder="Where are you going?"
                  placeholderTextColor="#999"
                  value={destination}
                  onChangeText={setDestination}
                  returnKeyType="next"
                />
              </View>
              
              {destination.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {popularLocations
                    .filter(loc => loc.toLowerCase().includes(destination.toLowerCase()))
                    .slice(0, 3)
                    .map((location, index) => (
                      <LocationSuggestion
                        key={index}
                        location={location}
                        onPress={() => setDestination(location)}
                      />
                    ))}
                </View>
              )}
            </View>

            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="date-range" size={20} color="#7f53ac" />
                  <Text style={styles.dateTimeText}>
                    {selectedDate ? formatDate(selectedDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeGroup}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <MaterialIcons name="access-time" size={20} color="#7f53ac" />
                  <Text style={styles.dateTimeText}>
                    {selectedTime ? formatTime(selectedTime) : 'Select time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Available Seats</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome5 name="users" size={18} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="1-8"
                    placeholderTextColor="#999"
                    value={seats}
                    onChangeText={setSeats}
                    keyboardType="numeric"
                    maxLength={1}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Fare per Person (Optional)</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="attach-money" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#999"
                    value={fare}
                    onChangeText={setFare}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <View style={[styles.inputContainer, styles.notesContainer]}>
                <MaterialIcons name="notes" size={20} color="#666" />
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Any special instructions, landmarks, or preferences..."
                  placeholderTextColor="#999"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.offerButton, loading && styles.offerButtonDisabled]}
              onPress={handleOfferRide}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="car" size={20} color="#fff" />
                  <Text style={styles.offerButtonText}>Offer Ride</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Tips for a Great Ride</Text>
              <Text style={styles.tipItem}>• Be clear about pickup and drop-off locations</Text>
              <Text style={styles.tipItem}>• Arrive on time and communicate any delays</Text>
              <Text style={styles.tipItem}>• Keep your car clean and comfortable</Text>
              <Text style={styles.tipItem}>• Respect passenger preferences and safety</Text>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime || new Date()}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { 
    flexGrow: 1, 
    padding: 20,
    paddingTop: 50,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  form: { 
    flex: 1 
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#23235b',
    marginLeft: 12,
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateTimeGroup: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#23235b',
    marginLeft: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  notesContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  offerButton: {
    backgroundColor: '#4b32c3',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  offerButtonDisabled: {
    opacity: 0.7,
  },
  offerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    marginTop: 30,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    lineHeight: 20,
  },
});
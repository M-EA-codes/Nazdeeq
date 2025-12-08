import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  Platform, 
  KeyboardAvoidingView, 
  Alert,
  RefreshControl,
  Dimensions,
  Linking 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileImage from '@/components/ProfileImage';

const { width } = Dimensions.get('window');

interface Driver {
  _id: string;
  fullName?: string;
  rating?: number;
  profilePhoto?: string;
  phoneNumber?: string;
}

interface Ride {
  _id: string;
  driverId: Driver;
  origin: { 
    name: string;
    coordinates?: { latitude: number; longitude: number };
  };
  destination: { 
    name: string;
    coordinates?: { latitude: number; longitude: number };
  };
  dateTime: string;
  seatsAvailable: number;
  totalSeats?: number;
  fare: number;
  notes?: string;
  status: string;
  passengerIds?: string[];
}

export default function RideDiscovery() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetchUserData();
    fetchRides();
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

  const fetchRides = async (searchParams?: any) => {
    const isSearch = !!searchParams;
    isSearch ? setIsSearching(true) : setLoading(true);
    
    try {
      let params: any = {
        status: 'open'
      };
      
      // Exclude current user's rides
      if (userId) {
        params.driverId = userId;
      }
      
      // Add search parameters
      if (searchParams) {
        if (searchParams.pickup) params.pickup = searchParams.pickup;
        if (searchParams.dropoff) params.dropoff = searchParams.dropoff;
        if (searchParams.date) params.date = searchParams.date;
      }

      console.log('Fetching rides with params:', params);
      const response = await api.get('/rides', { params });
      
      // Filter out current user's rides on frontend as well
      const availableRides = response.data.filter((ride: Ride) => 
        ride.driverId._id !== userId && ride.seatsAvailable > 0
      );
      
      setRides(availableRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      Alert.alert(
        'Error', 
        'Failed to fetch rides. Please check your connection and try again.'
      );
      setRides([]);
    } finally {
      isSearch ? setIsSearching(false) : setLoading(false);
    }
  };

  const handleSearch = async () => {
    const searchParams: any = {};
    
    if (pickup.trim()) searchParams.pickup = pickup.trim();
    if (dropoff.trim()) searchParams.dropoff = dropoff.trim();
    if (selectedDate) {
      searchParams.date = selectedDate.toISOString().split('T')[0];
    }
    
    await fetchRides(searchParams);
  };

  const clearSearch = () => {
    setPickup('');
    setDropoff('');
    setSelectedDate(null);
    fetchRides();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  const handleJoinRide = async (rideId: string) => {
    if (!userId) {
      Alert.alert('Login Required', 'Please log in to join a ride.');
      return;
    }

    const ride = rides.find(r => r._id === rideId);
    if (!ride) return;

    Alert.alert(
      'Join Ride',
      `Join ride from ${ride.origin.name} to ${ride.destination.name}?\n\nDriver: ${ride.driverId.fullName}\nFare: ${ride.fare ? `$${ride.fare}` : 'FREE'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              await api.put(`/rides/${rideId}`, {
                $push: { passengerIds: userId }
              });
              
              Alert.alert(
                'Success!', 
                'You have joined the ride! The driver will be notified.',
                [
                  {
                    text: 'OK',
                    onPress: () => fetchRides()
                  }
                ]
              );
            } catch (error: any) {
              console.error('Join ride error:', error);
              const message = error.response?.data?.error || 'Failed to join ride. Please try again.';
              Alert.alert('Error', message);
            }
          }
        }
      ]
    );
  };

  const openInMaps = (origin: string, destination: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${destination}&saddr=${origin}&daddr=${destination}`,
      android: `geo:0,0?q=${destination}&saddr=${origin}&daddr=${destination}`,
      default: `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`
    });
    
    Linking.canOpenURL(url!).then(supported => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        // Fallback to web Google Maps
        const webUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDefaultProfileImage = () => {
    return 'https://via.placeholder.com/48x48/7f53ac/ffffff?text=U';
  };

  const generateUniqueProfileImages = (driverId: string) => {
    const colors = ['#7f53ac', '#4b32c3', '#3ad29f', '#3a8fd2', '#ff6b6b'];
    const colorIndex = driverId.length % colors.length;
    const initial = driverId.charAt(0).toUpperCase();
    return `https://via.placeholder.com/48x48/${colors[colorIndex].substring(1)}/ffffff?text=${initial}`;
  };

  const renderRide = ({ item }: { item: Ride }) => {
    const seatsTaken = (item.totalSeats || item.seatsAvailable + 1) - item.seatsAvailable;
    
    return (
      <LinearGradient
        colors={["#fff", "#f8f9ff"]}
        style={styles.rideCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.rideHeader}>
          <View style={styles.driverInfo}>
            <ProfileImage
              source={item.driverId.profilePhoto}
              userId={item.driverId._id}
              userName={item.driverId.fullName}
              size={48}
              style={styles.profilePic}
            />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>
                {item.driverId.fullName || 'Anonymous Driver'}
              </Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#ffd93d" />
                <Text style={styles.rating}>
                  {(item.driverId.rating || 4.5).toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={[styles.fareAmount, { color: item.fare > 0 ? '#4b32c3' : '#3ad29f' }]}>
              {item.fare > 0 ? `$${item.fare}` : 'FREE'}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <MaterialIcons name="radio-button-checked" size={18} color="#3ad29f" />
            <Text style={styles.locationText}>{item.origin.name}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={18} color="#3a8fd2" />
            <Text style={styles.locationText}>{item.destination.name}</Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color="#7f53ac" />
            <Text style={styles.detailText}>
              {new Date(item.dateTime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome5 name="users" size={14} color="#3a8fd2" />
            <Text style={styles.detailText}>
              {item.seatsAvailable} seats available
            </Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <MaterialIcons name="info-outline" size={16} color="#666" />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => openInMaps(item.origin.name, item.destination.name)}
          >
            <MaterialIcons name="directions" size={18} color="#4b32c3" />
            <Text style={styles.mapButtonText}>Route</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.joinButton,
              item.seatsAvailable <= 0 && styles.joinButtonDisabled
            ]} 
            onPress={() => handleJoinRide(item._id)}
            disabled={item.seatsAvailable <= 0}
          >
            <Text style={styles.joinButtonText}>
              {item.seatsAvailable <= 0 ? 'RIDE FULL' : 'JOIN RIDE'}
            </Text>
            {item.seatsAvailable > 0 && (
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  const renderMapPlaceholder = () => (
    <View style={styles.mapPlaceholder}>
      <MaterialIcons name="map" size={64} color="rgba(255,255,255,0.3)" />
      <Text style={styles.mapPlaceholderText}>Map View</Text>
      <Text style={styles.mapPlaceholderSubtext}>
        Tap "Route" on any ride card to view directions
      </Text>
      
      <View style={styles.ridesMapContainer}>
        {rides.slice(0, 3).map((ride, index) => (
          <TouchableOpacity 
            key={ride._id}
            style={styles.mapRideItem}
            onPress={() => openInMaps(ride.origin.name, ride.destination.name)}
          >
            <View style={styles.mapRideHeader}>
              <MaterialIcons name="place" size={20} color="#4b32c3" />
              <Text style={styles.mapRideTitle} numberOfLines={1}>
                {ride.origin.name} → {ride.destination.name}
              </Text>
            </View>
            <Text style={styles.mapRideDriver}>{ride.driverId.fullName}</Text>
            <Text style={styles.mapRideFare}>
              {ride.fare > 0 ? `$${ride.fare}` : 'FREE'}
            </Text>
          </TouchableOpacity>
        ))}
        
        {rides.length > 3 && (
          <Text style={styles.moreRidesText}>
            +{rides.length - 3} more rides
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.gradient}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Find Your Ride</Text>
            <Text style={styles.subtitle}>
              {rides.length} ride{rides.length !== 1 ? 's' : ''} available
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="radio-button-checked" size={20} color="#3ad29f" />
              <TextInput 
                style={styles.input} 
                placeholder="From where?" 
                placeholderTextColor="#999" 
                value={pickup} 
                onChangeText={setPickup}
                returnKeyType="next"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={20} color="#3a8fd2" />
              <TextInput 
                style={styles.input} 
                placeholder="Where to?" 
                placeholderTextColor="#999" 
                value={dropoff} 
                onChangeText={setDropoff}
                returnKeyType="next"
              />
            </View>

            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="date-range" size={20} color="#7f53ac" />
              <Text style={[styles.input, { color: selectedDate ? '#23235b' : '#999' }]}>
                {selectedDate ? formatDate(selectedDate) : 'Any date'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#999" />
            </TouchableOpacity>

            <View style={styles.searchActions}>
              <TouchableOpacity 
                style={[styles.searchButton, isSearching && styles.searchButtonDisabled]} 
                onPress={handleSearch}
                disabled={isSearching}
              >
                <MaterialIcons name="search" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.viewToggle}>
              <TouchableOpacity 
                style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <MaterialIcons name="list" size={20} color={viewMode === 'list' ? '#fff' : '#666'} />
                <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
                  List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
                onPress={() => setViewMode('map')}
              >
                <MaterialIcons name="map" size={20} color={viewMode === 'map' ? '#fff' : '#666'} />
                <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
                  Map
                </Text>
              </TouchableOpacity>
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

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Finding rides...</Text>
            </View>
          ) : viewMode === 'map' ? (
            renderMapPlaceholder()
          ) : (
            <FlatList
              data={rides}
              keyExtractor={item => item._id}
              renderItem={renderRide}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#fff"
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="directions-car" size={64} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>No rides found</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search criteria or check back later
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingTop: 50 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    marginBottom: 12,
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
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  searchButton: {
    backgroundColor: '#4b32c3',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    marginTop: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4b32c3',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  driverDetails: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#23235b',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  routeContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#23235b',
    fontWeight: '500',
    marginLeft: 12,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#ddd',
    marginLeft: 8,
    marginVertical: 4,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    backgroundColor: 'rgba(75, 50, 195, 0.1)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#4b32c3',
  },
  mapButtonText: {
    color: '#4b32c3',
    fontWeight: '600',
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: '#4b32c3',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  mapPlaceholder: {
    flex: 1,
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  ridesMapContainer: {
    width: '100%',
    gap: 12,
  },
  mapRideItem: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
  },
  mapRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapRideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#23235b',
    marginLeft: 8,
    flex: 1,
  },
  mapRideDriver: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mapRideFare: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b32c3',
  },
  moreRidesText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
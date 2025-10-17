import React, { useState, useEffect, useRef } from 'react';
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
  Linking,
  Modal,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface LocationSuggestion {
  place_id: string;
  description: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
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
  
  // Geocoding and location states
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showRideDetails, setShowRideDetails] = useState(false);
  
  const pickupInputRef = useRef<TextInput>(null);
  const dropoffInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchUserData();
    fetchRides();
    requestLocationPermission();
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

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const searchPlaces = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) {
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
      return;
    }

    try {
      // Using Google Places API for autocomplete
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=YOUR_GOOGLE_PLACES_API_KEY&types=geocode`
      );
      const data = await response.json();
      
      if (data.predictions) {
        const suggestions = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          formatted_address: prediction.description,
          geometry: {
            location: {
              lat: 0, // Will be fetched separately
              lng: 0
            }
          }
        }));

        if (type === 'pickup') {
          setPickupSuggestions(suggestions);
          setShowPickupSuggestions(true);
        } else {
          setDropoffSuggestions(suggestions);
          setShowDropoffSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Error searching places:', error);
      // Fallback to mock suggestions for demo
      const mockSuggestions = [
        {
          place_id: '1',
          description: `${query} - San Francisco, CA`,
          formatted_address: `${query} - San Francisco, CA`,
          geometry: {
            location: { lat: 37.7749, lng: -122.4194 }
          }
        }
      ];
      
      if (type === 'pickup') {
        setPickupSuggestions(mockSuggestions);
        setShowPickupSuggestions(true);
      } else {
        setDropoffSuggestions(mockSuggestions);
        setShowDropoffSuggestions(true);
      }
    }
  };

  const selectLocation = (suggestion: LocationSuggestion, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setPickup(suggestion.description);
      setShowPickupSuggestions(false);
      setPickupSuggestions([]);
    } else {
      setDropoff(suggestion.description);
      setShowDropoffSuggestions(false);
      setDropoffSuggestions([]);
    }
  };

  const getCurrentLocation = async (type: 'pickup' | 'dropoff') => {
    try {
      const { status} = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const formattedAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
          
          if (type === 'pickup') {
            setPickup(formattedAddress);
            setShowPickupSuggestions(false);
          } else {
            setDropoff(formattedAddress);
            setShowDropoffSuggestions(false);
          }
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get your current location');
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
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/rides?${queryString}`);
      console.log('Raw API response:', response);
      console.log('Response length:', response?.length);
      
      // Ensure response is an array
      if (!Array.isArray(response)) {
        console.error('API response is not an array:', response);
        setRides([]);
        return;
      }
      
      // Filter out current user's rides and ensure uniqueness
      const filteredRides = response.filter((ride: Ride) => {
        const driverId = ride.driverId._id || ride.driverId;
        const isNotUserRide = driverId !== userId;
        const hasAvailableSeats = ride.seatsAvailable > 0;
        console.log('Ride filter check:', {
          rideId: ride._id,
          driverId,
          userId,
          isNotUserRide,
          hasAvailableSeats,
          seatsAvailable: ride.seatsAvailable
        });
        return isNotUserRide && hasAvailableSeats;
      });
      
      // Remove duplicates by creating a Map with unique IDs
      const uniqueRidesMap = new Map();
      filteredRides.forEach((ride: Ride) => {
        uniqueRidesMap.set(ride._id, ride);
      });
      
      const availableRides = Array.from(uniqueRidesMap.values());
      console.log('Filtered and deduplicated rides:', availableRides.length);
      console.log('Ride IDs:', availableRides.map(ride => ride._id));
      
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

  const onRidePress = (ride: Ride) => {
    setSelectedRide(ride);
    setShowRideDetails(true);
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
    const profileImage = item.driverId.profilePhoto || generateUniqueProfileImages(item.driverId._id);
    
    return (
      <TouchableOpacity onPress={() => onRidePress(item)} activeOpacity={0.9}>
        <LinearGradient
          colors={["#fff", "#f8f9ff"]}
          style={styles.rideCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
        <View style={styles.rideHeader}>
          <View style={styles.driverInfo}>
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profilePic}
              defaultSource={{ uri: getDefaultProfileImage() }}
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
      </TouchableOpacity>
    );
  };


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
                ref={pickupInputRef}
                style={styles.input} 
                placeholder="From where?" 
                placeholderTextColor="#999" 
                value={pickup} 
                onChangeText={(text) => {
                  setPickup(text);
                  searchPlaces(text, 'pickup');
                }}
                onFocus={() => {
                  if (pickupSuggestions.length > 0) {
                    setShowPickupSuggestions(true);
                  }
                }}
                returnKeyType="next"
              />
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={() => getCurrentLocation('pickup')}
              >
                <MaterialIcons name="my-location" size={20} color="#3ad29f" />
              </TouchableOpacity>
            </View>
            
            {showPickupSuggestions && pickupSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView style={styles.suggestionsList} nestedScrollEnabled>
                  {pickupSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.place_id}
                      style={styles.suggestionItem}
                      onPress={() => selectLocation(suggestion, 'pickup')}
                    >
                      <MaterialIcons name="place" size={16} color="#666" />
                      <Text style={styles.suggestionText}>{suggestion.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={20} color="#3a8fd2" />
              <TextInput 
                ref={dropoffInputRef}
                style={styles.input} 
                placeholder="Where to?" 
                placeholderTextColor="#999" 
                value={dropoff} 
                onChangeText={(text) => {
                  setDropoff(text);
                  searchPlaces(text, 'dropoff');
                }}
                onFocus={() => {
                  if (dropoffSuggestions.length > 0) {
                    setShowDropoffSuggestions(true);
                  }
                }}
                returnKeyType="next"
              />
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={() => getCurrentLocation('dropoff')}
              >
                <MaterialIcons name="my-location" size={20} color="#3a8fd2" />
              </TouchableOpacity>
            </View>
            
            {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView style={styles.suggestionsList} nestedScrollEnabled>
                  {dropoffSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.place_id}
                      style={styles.suggestionItem}
                      onPress={() => selectLocation(suggestion, 'dropoff')}
                    >
                      <MaterialIcons name="place" size={16} color="#666" />
                      <Text style={styles.suggestionText}>{suggestion.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

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
      
      {/* Ride Details Modal */}
      <Modal
        visible={showRideDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRideDetails(false)}
      >
        {selectedRide && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowRideDetails(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalRideCard}>
                <View style={styles.modalRideHeader}>
                  <View style={styles.modalDriverInfo}>
                    <Image 
                      source={{ uri: selectedRide.driverId.profilePhoto || 'https://via.placeholder.com/48x48/7f53ac/ffffff?text=U' }} 
                      style={styles.modalProfilePic}
                    />
                    <View style={styles.modalDriverDetails}>
                      <Text style={styles.modalDriverName}>
                        {selectedRide.driverId.fullName || 'Anonymous Driver'}
                      </Text>
                      <View style={styles.modalRatingContainer}>
                        <MaterialIcons name="star" size={16} color="#ffd93d" />
                        <Text style={styles.modalRating}>
                          {(selectedRide.driverId.rating || 4.5).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.modalFareContainer}>
                    <Text style={styles.modalFareLabel}>Fare</Text>
                    <Text style={[styles.modalFareAmount, { color: selectedRide.fare > 0 ? '#4b32c3' : '#3ad29f' }]}>
                      {selectedRide.fare > 0 ? `$${selectedRide.fare}` : 'FREE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalRouteContainer}>
                  <View style={styles.modalLocationRow}>
                    <MaterialIcons name="radio-button-checked" size={18} color="#3ad29f" />
                    <Text style={styles.modalLocationText}>{selectedRide.origin.name}</Text>
                  </View>
                  <View style={styles.modalRouteLine} />
                  <View style={styles.modalLocationRow}>
                    <MaterialIcons name="location-on" size={18} color="#3a8fd2" />
                    <Text style={styles.modalLocationText}>{selectedRide.destination.name}</Text>
                  </View>
                </View>

                <View style={styles.modalRideDetails}>
                  <View style={styles.modalDetailItem}>
                    <MaterialIcons name="schedule" size={16} color="#7f53ac" />
                    <Text style={styles.modalDetailText}>
                      {new Date(selectedRide.dateTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <FontAwesome5 name="users" size={14} color="#3a8fd2" />
                    <Text style={styles.modalDetailText}>
                      {selectedRide.seatsAvailable} seats available
                    </Text>
                  </View>
                </View>

                {selectedRide.notes && (
                  <View style={styles.modalNotesContainer}>
                    <MaterialIcons name="info-outline" size={16} color="#666" />
                    <Text style={styles.modalNotesText}>{selectedRide.notes}</Text>
                  </View>
                )}

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity 
                    style={styles.modalMapButton}
                    onPress={() => openInMaps(selectedRide.origin.name, selectedRide.destination.name)}
                  >
                    <MaterialIcons name="directions" size={18} color="#4b32c3" />
                    <Text style={styles.modalMapButtonText}>Get Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.modalJoinButton,
                      selectedRide.seatsAvailable <= 0 && styles.modalJoinButtonDisabled
                    ]} 
                    onPress={() => {
                      setShowRideDetails(false);
                      handleJoinRide(selectedRide._id);
                    }}
                    disabled={selectedRide.seatsAvailable <= 0}
                  >
                    <Text style={styles.modalJoinButtonText}>
                      {selectedRide.seatsAvailable <= 0 ? 'RIDE FULL' : 'JOIN RIDE'}
                    </Text>
                    {selectedRide.seatsAvailable > 0 && (
                      <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
  
  // Geocoding and suggestions styles
  locationButton: {
    padding: 8,
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235b',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalRideCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalDriverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalProfilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  modalDriverDetails: {
    marginLeft: 16,
    flex: 1,
  },
  modalDriverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23235b',
    marginBottom: 4,
  },
  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalRating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalFareContainer: {
    alignItems: 'flex-end',
  },
  modalFareLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  modalFareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalRouteContainer: {
    marginBottom: 20,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalLocationText: {
    fontSize: 16,
    color: '#23235b',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  modalRouteLine: {
    width: 2,
    height: 24,
    backgroundColor: '#ddd',
    marginLeft: 8,
    marginVertical: 4,
  },
  modalRideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalNotesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalNotesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalMapButton: {
    backgroundColor: 'rgba(75, 50, 195, 0.1)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#4b32c3',
    flex: 1,
  },
  modalMapButtonText: {
    color: '#4b32c3',
    fontWeight: '600',
    fontSize: 14,
  },
  modalJoinButton: {
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
  modalJoinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalJoinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
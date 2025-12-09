import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  RefreshControl,
  TouchableOpacity,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Passenger {
  _id: string;
  fullName?: string;
  profilePhoto?: string;
}

interface Driver {
  _id: string;
  fullName?: string;
  rating?: number;
  profilePhoto?: string;
}

interface MyRide {
  _id: string;
  type: 'offered' | 'joined';
  driverId: Driver;
  passengerIds?: Passenger[];
  origin: { name: string };
  destination: { name: string };
  dateTime: string;
  seatsAvailable: number;
  totalSeats?: number;
  status: string;
  fare?: number;
  notes?: string;
}

export default function MyRides() {
  const [rides, setRides] = useState<MyRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'offered' | 'joined'>('all');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMyRides();
    }
  }, [userId]);

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

  const fetchMyRides = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/rides/my-rides?userId=${userId}`);
      
      const { offered, joined } = response;
      
      // Combine and mark ride types, ensuring uniqueness
      const rideMap = new Map();
      
      // Add offered rides
      offered.forEach((ride: any) => {
        rideMap.set(ride._id, { ...ride, type: 'offered' as const });
      });
      
      // Add joined rides (only if not already in map)
      joined.forEach((ride: any) => {
        if (!rideMap.has(ride._id)) {
          rideMap.set(ride._id, { ...ride, type: 'joined' as const });
        }
      });
      
      const allRides: MyRide[] = Array.from(rideMap.values());
      
      // Sort by date (most recent first)
      allRides.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      
      setRides(allRides);
    } catch (error) {
      console.error('Error fetching my rides:', error);
      Alert.alert('Error', 'Could not load your rides. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRides();
    setRefreshing(false);
  };

  const cancelRide = async (rideId: string) => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/rides/${rideId}`, {
                status: 'cancelled'
              });
              Alert.alert('Success', 'Ride cancelled successfully');
              fetchMyRides();
            } catch (error) {
              console.error('Cancel ride error:', error);
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
            }
          }
        }
      ]
    );
  };

  const leaveRide = async (rideId: string) => {
    Alert.alert(
      'Leave Ride',
      'Are you sure you want to leave this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove user from passengers and increment available seats
              await api.put(`/rides/${rideId}`, {
                $pull: { passengerIds: userId },
                $inc: { seatsAvailable: 1 }
              });
              Alert.alert('Success', 'You have left the ride successfully');
              fetchMyRides();
            } catch (error) {
              console.error('Leave ride error:', error);
              Alert.alert('Error', 'Failed to leave ride. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getFilteredRides = () => {
    switch (activeTab) {
      case 'offered':
        return rides.filter(ride => ride.type === 'offered');
      case 'joined':
        return rides.filter(ride => ride.type === 'joined');
      default:
        return rides;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#3ad29f';
      case 'cancelled': return '#ff6b6b';
      case 'in_progress': return '#ffd93d';
      default: return '#4b32c3';
    }
  };

  const generateUniqueProfileImages = (userId: string) => {
    const colors = ['#7f53ac', '#4b32c3', '#3ad29f', '#3a8fd2', '#ff6b6b'];
    const colorIndex = userId.length % colors.length;
    const initial = userId.charAt(0).toUpperCase();
    return `https://via.placeholder.com/40x40/${colors[colorIndex].substring(1)}/ffffff?text=${initial}`;
  };

  const renderRide = ({ item }: { item: MyRide }) => {
    const isUpcoming = new Date(item.dateTime) > new Date();
    const canCancel = item.type === 'offered' && item.status === 'open' && isUpcoming;
    const canLeave = item.type === 'joined' && item.status === 'open' && isUpcoming;
    
    return (
      <LinearGradient
        colors={["#fff", "#f8f9ff"]}
        style={styles.rideCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.rideHeader}>
          <View style={styles.typeIndicator}>
            <FontAwesome5
              name={item.type === 'offered' ? 'car' : 'user-friends'}
              size={20}
              color={item.type === 'offered' ? '#4b32c3' : '#3a8fd2'}
            />
            <Text style={[styles.rideType, { 
              color: item.type === 'offered' ? '#4b32c3' : '#3a8fd2' 
            }]}>
              {item.type === 'offered' ? 'Offered' : 'Joined'}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <MaterialIcons name="radio-button-checked" size={18} color="#3ad29f" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.origin.name}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={18} color="#3a8fd2" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.destination.name}
            </Text>
          </View>
        </View>

        <View style={styles.rideInfo}>
          <View style={styles.dateTimeContainer}>
            <MaterialIcons name="schedule" size={16} color="#7f53ac" />
            <Text style={styles.dateTimeText}>
              {new Date(item.dateTime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          <View style={styles.rideDetails}>
            <View style={styles.detailItem}>
              <FontAwesome5 name="users" size={14} color="#666" />
              <Text style={styles.detailText}>
                {item.seatsAvailable} seats left
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={16} color="#666" />
              <Text style={styles.detailText}>
                {item.fare ? `$${item.fare}` : 'FREE'}
              </Text>
            </View>
          </View>
        </View>

        {item.type === 'offered' && item.passengerIds && item.passengerIds.length > 0 && (
          <View style={styles.passengersContainer}>
            <Text style={styles.passengersLabel}>Passengers:</Text>
            <View style={styles.passengersList}>
              {item.passengerIds.slice(0, 3).map((passenger, index) => (
                <Image
                  key={passenger._id}
                  source={{ 
                    uri: passenger.profilePhoto || generateUniqueProfileImages(passenger._id)
                  }}
                  style={[styles.passengerAvatar, { marginLeft: index > 0 ? -8 : 0 }]}
                />
              ))}
              {item.passengerIds.length > 3 && (
                <View style={[styles.passengerAvatar, styles.morePassengers, { marginLeft: -8 }]}>
                  <Text style={styles.morePassengersText}>+{item.passengerIds.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesContainer}>
            <MaterialIcons name="info-outline" size={16} color="#666" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        {(canCancel || canLeave) && (
          <View style={styles.actionContainer}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => cancelRide(item._id)}
              >
                <MaterialIcons name="cancel" size={16} color="#ff6b6b" />
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            )}
            
            {canLeave && (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => leaveRide(item._id)}
              >
                <MaterialIcons name="exit-to-app" size={16} color="#ff6b6b" />
                <Text style={styles.leaveButtonText}>Leave Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    );
  };

  const renderTabButton = (tab: 'all' | 'offered' | 'joined', label: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.tabButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const filteredRides = getFilteredRides();

  if (loading) {
    return (
      <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your rides...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Rides</Text>
          <Text style={styles.subtitle}>
            {filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          {renderTabButton('all', 'All')}
          {renderTabButton('offered', 'Offered')}
          {renderTabButton('joined', 'Joined')}
        </View>

        <FlatList
          data={filteredRides}
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
              <FontAwesome5 name="car-side" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>
                {activeTab === 'all' ? 'No rides yet' : 
                 activeTab === 'offered' ? 'No rides offered' : 'No rides joined'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'offered' 
                  ? 'Start by offering a ride to help your neighbors'
                  : 'Browse available rides to join your neighbors'
                }
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  tabButtonTextActive: {
    color: '#4b32c3',
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
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 8,
    marginVertical: 4,
  },
  rideInfo: {
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  passengersContainer: {
    marginBottom: 12,
  },
  passengersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#23235b',
    marginBottom: 8,
  },
  passengersList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
  },
  morePassengers: {
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePassengersText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  cancelButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 14,
  },
  leaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  leaveButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 14,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Booking {
  _id: string;
  serviceId: {
    _id: string;
    title: string;
    category: string;
    description: string;
  };
  providerId?: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    phoneNumber?: string;
  };
  requesterId?: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    phoneNumber?: string;
  };
  scheduledDate: string;
  timeSlot: string;
  status: string;
  urgency: string;
  estimatedBudget?: number;
  description: string;
  createdAt: string;
}

export default function MyBookings() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'provider' | 'customer'>('customer');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId, userType]);

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

  const fetchBookings = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params: any = {};
      if (userType === 'provider') {
        params.providerId = userId;
      } else {
        params.requesterId = userId;
      }

      const response = await api.get('/service-requests', { params });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await api.put(`/service-requests/${bookingId}`, { status: newStatus });
      await fetchBookings();
      Alert.alert('Success', `Booking ${newStatus} successfully.`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update booking status.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffd93d';
      case 'accepted': return '#4b32c3';
      case 'in_progress': return '#3a8fd2';
      case 'completed': return '#3ad29f';
      case 'cancelled': return '#ff6b6b';
      case 'rejected': return '#ff6b6b';
      default: return '#666';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return '#3ad29f';
      case 'medium': return '#ffd93d';
      case 'high': return '#ff6b6b';
      default: return '#666';
    }
  };

  const generateProfileImage = (userId: string, name: string) => {
    const colors = ['#7f53ac', '#4b32c3', '#3ad29f', '#3a8fd2', '#ff6b6b'];
    const colorIndex = userId.length % colors.length;
    const initial = name.charAt(0).toUpperCase();
    return `https://via.placeholder.com/50x50/${colors[colorIndex].substring(1)}/ffffff?text=${initial}`;
  };

  const getFilteredBookings = () => {
    let filtered = bookings;
    
    if (activeTab === 'pending') {
      filtered = bookings.filter(booking => booking.status === 'pending');
    } else if (activeTab === 'completed') {
      filtered = bookings.filter(booking => booking.status === 'completed');
    }
    
    return filtered;
  };

  const renderBookingCard = (booking: Booking) => {
    const otherUser = userType === 'provider' ? booking.requesterId : booking.providerId;
    const profileImage = otherUser?.profilePhoto || 
                        generateProfileImage(otherUser?._id || '', otherUser?.fullName || '');

    return (
      <View key={booking._id} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: profileImage }}
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {userType === 'provider' ? 'Customer' : 'Provider'}: {otherUser?.fullName || 'Unknown'}
              </Text>
              <Text style={styles.serviceTitle}>{booking.serviceId.title}</Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
            <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(booking.urgency) }]}>
              <Text style={styles.urgencyText}>{booking.urgency}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.serviceDescription} numberOfLines={2}>
          {booking.description}
        </Text>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={18} color="#666" />
            <Text style={styles.detailText}>
              {new Date(booking.scheduledDate).toLocaleDateString()} • {booking.timeSlot}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialIcons name="category" size={18} color="#666" />
            <Text style={styles.detailText}>{booking.serviceId.category}</Text>
          </View>
          
          {booking.estimatedBudget && (
            <View style={styles.detailItem}>
              <MaterialIcons name="attach_money" size={18} color="#666" />
              <Text style={styles.detailText}>${booking.estimatedBudget}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons for Provider */}
        {userType === 'provider' && booking.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleStatusUpdate(booking._id, 'accepted')}
            >
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusUpdate(booking._id, 'rejected')}
            >
              <MaterialIcons name="close" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons for Accepted Bookings */}
        {userType === 'provider' && booking.status === 'accepted' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStatusUpdate(booking._id, 'in_progress')}
            >
              <MaterialIcons name="play_arrow" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Complete Button */}
        {userType === 'provider' && booking.status === 'in_progress' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusUpdate(booking._id, 'completed')}
            >
              <MaterialIcons name="done" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Button */}
        <TouchableOpacity style={styles.contactButton}>
          <MaterialIcons name="phone" size={18} color="#4b32c3" />
          <Text style={styles.contactButtonText}>
            Contact {userType === 'provider' ? 'Customer' : 'Provider'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* User Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            userType === 'customer' && styles.toggleButtonActive
          ]}
          onPress={() => setUserType('customer')}
        >
          <Text style={[
            styles.toggleButtonText,
            userType === 'customer' && styles.toggleButtonTextActive
          ]}>
            As Customer
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            userType === 'provider' && styles.toggleButtonActive
          ]}
          onPress={() => setUserType('provider')}
        >
          <Text style={[
            styles.toggleButtonText,
            userType === 'provider' && styles.toggleButtonTextActive
          ]}>
            As Provider
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'pending', 'completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {getFilteredBookings().length > 0 ? (
            getFilteredBookings().map(renderBookingCard)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event_busy" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubtext}>
                {userType === 'customer' 
                  ? 'Book a service to see it here'
                  : 'Add services to receive bookings'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 23,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  toggleButtonTextActive: {
    color: '#4b32c3',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: '#fff',
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
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  urgencyBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#3ad29f',
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
  },
  startButton: {
    backgroundColor: '#3a8fd2',
  },
  completeButton: {
    backgroundColor: '#4b32c3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(75, 50, 195, 0.1)',
    borderWidth: 1,
    borderColor: '#4b32c3',
  },
  contactButtonText: {
    color: '#4b32c3',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 16,
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
  },
});
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
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface ServiceStats {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
}

interface RecentBooking {
  _id: string;
  serviceId: {
    title: string;
    category: string;
  };
  requesterId: {
    fullName: string;
    profilePhoto?: string;
  };
  scheduledDate: string;
  timeSlot: string;
  status: string;
  estimatedBudget?: number;
}

interface MyService {
  _id: string;
  title: string;
  category: string;
  description: string;
  isActive: boolean;
  priceRange?: { min: number; max: number };
  fixedPrice?: number;
  reviewCount: number;
  rating: number;
}

export default function ServiceProviderDashboard({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ServiceStats>({
    totalServices: 0,
    activeServices: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    averageRating: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [myServices, setMyServices] = useState<MyService[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const prefs = await AsyncStorage.getItem('userPreferences');
      
      if (storedUserId) {
        setUserId(storedUserId);
        // Get user name from preferences or API
        if (prefs) {
          const parsed = JSON.parse(prefs);
          setUserName(parsed.fullName || 'Service Provider');
        }
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        setUserId(parsed.userId);
        setUserName(parsed.fullName || 'Service Provider');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch stats with proper error handling
      const [servicesRes, bookingsRes] = await Promise.all([
        api.get(`/services/provider/${userId}`).catch(() => ({ data: [] })),
        api.get(`/service-requests`, { params: { providerId: userId } }).catch(() => ({ data: [] }))
      ]);

      const services = servicesRes.data || [];
      const bookings = bookingsRes.data || [];

      // Calculate stats with null checks
      const activeServices = services.filter((s: MyService) => s?.isActive).length;
      const pendingBookings = bookings.filter((b: RecentBooking) => b?.status === 'pending').length;
      const completedBookings = bookings.filter((b: RecentBooking) => b?.status === 'completed').length;
      const totalEarnings = bookings
        .filter((b: RecentBooking) => b?.status === 'completed' && b?.estimatedBudget)
        .reduce((sum: number, b: RecentBooking) => sum + (b?.estimatedBudget || 0), 0);
      
      const totalRatings = services.reduce((sum: number, s: MyService) => sum + (s?.rating || 0), 0);
      const averageRating = services.length > 0 ? totalRatings / services.length : 0;

      setStats({
        totalServices: services.length,
        activeServices,
        totalBookings: bookings.length,
        pendingBookings,
        completedBookings,
        totalEarnings,
        averageRating
      });

      // Set recent bookings (last 5)
      setRecentBookings(bookings.slice(0, 5));
      
      // Set services
      setMyServices(services);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleServiceToggle = async (serviceId: string, currentStatus: boolean) => {
    try {
      await api.put(`/services/${serviceId}`, { isActive: !currentStatus });
      await fetchDashboardData();
      Alert.alert(
        'Success', 
        `Service ${!currentStatus ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (error) {
      console.error('Error toggling service:', error);
      Alert.alert('Error', 'Failed to update service status.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffd93d';
      case 'accepted': return '#4b32c3';
      case 'in_progress': return '#3a8fd2';
      case 'completed': return '#3ad29f';
      case 'cancelled': return '#ff6b6b';
      default: return '#666';
    }
  };

  const generateProfileImage = (userId: string, name: string) => {
    const colors = ['#7f53ac', '#4b32c3', '#3ad29f', '#3a8fd2', '#ff6b6b'];
    const colorIndex = userId.length % colors.length;
    const initial = name.charAt(0).toUpperCase();
    return `https://via.placeholder.com/40x40/${colors[colorIndex].substring(1)}/ffffff?text=${initial}`;
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => navigation.navigate('ServiceList')}
            >
              <MaterialIcons name="person" size={20} color="#4b32c3" />
              <Text style={styles.switchButtonText}>Switch to Customer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#4b32c3' }]}>
              <MaterialIcons name="build" size={24} color="#fff" />
              <Text style={styles.statNumber}>{stats.activeServices}</Text>
              <Text style={styles.statLabel}>Active Services</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#3ad29f' }]}>
              <MaterialIcons name="event" size={24} color="#fff" />
              <Text style={styles.statNumber}>{stats.pendingBookings}</Text>
              <Text style={styles.statLabel}>Pending Bookings</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#3a8fd2' }]}>
              <MaterialIcons name="star" size={24} color="#fff" />
              <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ffd93d' }]}>
              <MaterialIcons name="attach_money" size={24} color="#fff" />
              <Text style={styles.statNumber}>${stats.totalEarnings}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddService')}
            >
              <LinearGradient
                colors={["#4b32c3", "#7f53ac"]}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="add" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Add New Service</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MyBookings')}
            >
              <LinearGradient
                colors={["#3ad29f", "#2ecc71"]}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="calendar_today" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>View All Bookings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <View key={booking._id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.customerInfo}>
                    <Image
                      source={{ 
                        uri: booking.requesterId.profilePhoto || 
                             generateProfileImage(booking.requesterId.fullName, booking.requesterId.fullName)
                      }}
                      style={styles.customerAvatar}
                    />
                    <View style={styles.customerDetails}>
                      <Text style={styles.customerName}>{booking.requesterId.fullName}</Text>
                      <Text style={styles.serviceName}>{booking.serviceId.title}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <Text style={styles.statusText}>{booking.status}</Text>
                  </View>
                </View>
                
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailItem}>
                    <MaterialIcons name="schedule" size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>
                      {new Date(booking.scheduledDate).toLocaleDateString()} • {booking.timeSlot}
                    </Text>
                  </View>
                  {booking.estimatedBudget && (
                    <View style={styles.bookingDetailItem}>
                      <MaterialIcons name="attach_money" size={16} color="#666" />
                      <Text style={styles.bookingDetailText}>${booking.estimatedBudget}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="event_note" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyStateText}>No recent bookings</Text>
            </View>
          )}
        </View>

        {/* My Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ManageServices')}>
              <Text style={styles.seeAllText}>Manage All</Text>
            </TouchableOpacity>
          </View>
          
          {myServices.length > 0 ? (
            myServices.slice(0, 3).map((service) => (
              <View key={service._id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceCategory}>{service.category}</Text>
                    <View style={styles.serviceRating}>
                      <MaterialIcons name="star" size={14} color="#ffd93d" />
                      <Text style={styles.ratingText}>
                        {service.rating.toFixed(1)} ({service.reviewCount} reviews)
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      { backgroundColor: service.isActive ? '#3ad29f' : '#ff6b6b' }
                    ]}
                    onPress={() => handleServiceToggle(service._id, service.isActive)}
                  >
                    <Text style={styles.toggleButtonText}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
                
                <View style={styles.servicePrice}>
                  {service.fixedPrice ? (
                    <Text style={styles.priceText}>${service.fixedPrice}</Text>
                  ) : service.priceRange ? (
                    <Text style={styles.priceText}>
                      ${service.priceRange.min} - ${service.priceRange.max}
                    </Text>
                  ) : (
                    <Text style={styles.priceText}>Price Negotiable</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="build" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyStateText}>No services yet</Text>
              <TouchableOpacity 
                style={styles.addFirstServiceButton}
                onPress={() => navigation.navigate('AddService')}
              >
                <Text style={styles.addFirstServiceText}>Add Your First Service</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  switchButtonText: {
    color: '#4b32c3',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  customerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    gap: 8,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingDetailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  serviceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 8,
  },
  servicePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  addFirstServiceButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  addFirstServiceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
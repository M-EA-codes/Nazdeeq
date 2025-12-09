import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  RefreshControl,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Provider {
  _id: string;
  fullName: string;
  rating: number;
  profilePhoto?: string;
  completedServices?: number;
  responseTime?: string;
  phoneNumber?: string;
  address?: string;
}

interface Service {
  _id: string;
  providerId: Provider;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  fixedPrice?: number;
  availability: string[];
  location: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

interface BookingData {
  serviceId: string;
  providerId: string;
  requesterId: string;
  selectedDate: Date;
  selectedTimeSlot: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  estimatedBudget?: number;
}

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Booking form states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [bookingDescription, setBookingDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const categories = [
    { id: 'all', name: 'All Services', icon: 'apps' },
    { id: 'plumbing', name: 'Plumbing', icon: 'plumbing' },
    { id: 'electrical', name: 'Electrical', icon: 'electrical-services' },
    { id: 'cleaning', name: 'Cleaning', icon: 'cleaning-services' },
    { id: 'gardening', name: 'Gardening', icon: 'grass' },
    { id: 'carpentry', name: 'Carpentry', icon: 'handyman' },
    { id: 'painting', name: 'Painting', icon: 'format-paint' },
    { id: 'tutoring', name: 'Tutoring', icon: 'school' },
    { id: 'delivery', name: 'Delivery', icon: 'delivery-dining' }
  ];

  const timeSlots = [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
    '6:00 PM - 8:00 PM'
  ];

  useEffect(() => {
    fetchUserData();
    fetchServices();
  }, []);

  // Refresh services when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 ServiceList focused, refreshing ALL services...');
      fetchServices(selectedCategory, searchQuery);
    }, [selectedCategory, searchQuery])
  );

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

  const fetchServices = async (category?: string, search?: string) => {
    setLoading(true);
    try {
      const params: any = { isActive: true };
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;

      console.log('🔍 Fetching ALL services from main collection with params:', params);
      const response = await api.get('/services', { params });
      console.log('🔍 API Response:', response);
      console.log('🔍 Found services:', response?.length || 0);
      setServices(response || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices(selectedCategory, searchQuery);
    setRefreshing(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchServices(categoryId, searchQuery);
  };

  const handleSearch = () => {
    fetchServices(selectedCategory, searchQuery);
  };

  const openBookingModal = (service: Service) => {
    setSelectedService(service);
    setBookingModalVisible(true);
    
    // Set tomorrow as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  };

  const closeBookingModal = () => {
    setBookingModalVisible(false);
    setSelectedService(null);
    setBookingDescription('');
    setSelectedTimeSlot('');
    setUrgency('medium');
    setEstimatedBudget('');
    
    // Reset date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  };

  const handleBookService = async () => {
    if (!selectedService || !userId) {
      Alert.alert('Error', 'Please log in to book a service.');
      return;
    }

    if (!selectedTimeSlot) {
      Alert.alert('Missing Information', 'Please select a time slot.');
      return;
    }

    if (!bookingDescription.trim()) {
      Alert.alert('Missing Information', 'Please describe your service requirements.');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        serviceId: selectedService._id,
        providerId: selectedService.providerId._id,
        requesterId: userId,
        scheduledDate: selectedDate.toISOString(),
        timeSlot: selectedTimeSlot,
        description: bookingDescription.trim(),
        urgency,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
        status: 'pending'
      };

      await api.post('/service-requests', bookingData);
      
      // Clear booking form after successful submission
      setBookingDescription('');
      setSelectedTimeSlot('');
      setUrgency('medium');
      setEstimatedBudget('');
      setSelectedDate(new Date());
      
      Alert.alert(
        'Booking Confirmed!',
        `Your service request has been sent to ${selectedService.providerId.fullName}. They will contact you soon to confirm the appointment.`,
        [
          {
            text: 'OK',
            onPress: closeBookingModal
          }
        ]
      );
    } catch (error: any) {
      console.error('Booking error:', error);
      const message = error.response?.data?.error || 'Failed to book service. Please try again.';
      Alert.alert('Booking Failed', message);
    } finally {
      setBookingLoading(false);
    }
  };

  const generateProfileImage = (userId: string, name: string) => {
    const colors = ['#7f53ac', '#4b32c3', '#3ad29f', '#3a8fd2', '#ff6b6b'];
    const colorIndex = userId.length % colors.length;
    const initial = name.charAt(0).toUpperCase();
    return `https://via.placeholder.com/80x80/${colors[colorIndex].substring(1)}/ffffff?text=${initial}`;
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <MaterialIcons 
        name={item.icon} 
        size={24} 
        color={selectedCategory === item.id ? '#fff' : '#666'} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderService = ({ item }: { item: Service }) => {
    const profileImage = item.providerId.profilePhoto || 
                        generateProfileImage(item.providerId._id, item.providerId.fullName);
    
    return (
      <LinearGradient
        colors={["#fff", "#f8f9ff"]}
        style={styles.serviceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.providerInfo}>
            <Image 
              source={{ uri: profileImage }}
              style={styles.providerAvatar}
            />
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>{item.providerId.fullName}</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#ffd93d" />
                <Text style={styles.rating}>
                  {item.providerId.rating?.toFixed(1) || '4.5'}
                </Text>
                <Text style={styles.reviewCount}>
                  ({item.reviewCount || 0} reviews)
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.serviceCategory}>
            <Text style={styles.categoryBadge}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.serviceTitle}>{item.title}</Text>
        <Text style={styles.serviceDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.serviceDetails}>
          <View style={styles.priceContainer}>
            {item.fixedPrice ? (
              <Text style={styles.fixedPrice}>${item.fixedPrice}</Text>
            ) : item.priceRange ? (
              <Text style={styles.priceRange}>
                ${item.priceRange.min} - ${item.priceRange.max}
              </Text>
            ) : (
              <Text style={styles.priceNegotiable}>Price Negotiable</Text>
            )}
          </View>

          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>

        {item.images && item.images.length > 0 && (
          <ScrollView 
            horizontal 
            style={styles.imagesContainer}
            showsHorizontalScrollIndicator={false}
          >
            {item.images.map((image, index) => (
              <Image 
                key={index}
                source={{ uri: image }}
                style={styles.serviceImage}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.serviceActions}>
          <TouchableOpacity style={styles.contactButton}>
            <MaterialIcons name="phone" size={18} color="#4b32c3" />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => openBookingModal(item)}
          >
            <MaterialIcons name="event" size={18} color="#fff" />
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NeighborWorks</Text>
        <Text style={styles.subtitle}>Find trusted local service providers</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Categories */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
        contentContainerStyle={styles.categoriesContainer}
      />

      {/* Services List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderService}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.servicesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="tools" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No services found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search or category filter
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Booking Modal */}
      <Modal visible={bookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book Service</Text>
                <TouchableOpacity 
                  onPress={closeBookingModal}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              {selectedService && (
                <View style={styles.selectedServiceInfo}>
                  <Text style={styles.selectedServiceCategory}>
                    {selectedService.category}
                  </Text>
                  <Text style={styles.selectedServiceTitle}>
                    {selectedService.title}
                  </Text>
                  <Text style={styles.selectedServiceProvider}>
                    Provider: {selectedService.providerId.fullName}
                  </Text>
                  {selectedService.priceRange ? (
                    <Text style={styles.selectedServicePrice}>
                      Price: ${selectedService.priceRange.min} - ${selectedService.priceRange.max}
                    </Text>
                  ) : selectedService.fixedPrice ? (
                    <Text style={styles.selectedServicePrice}>
                      Price: ${selectedService.fixedPrice}
                    </Text>
                  ) : (
                    <Text style={styles.selectedServicePrice}>
                      Price: Negotiable
                    </Text>
                  )}
                </View>
              )}

              {/* Date Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="date-range" size={20} color="#4b32c3" />
                  <Text style={styles.dateButtonText}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Time Slot Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Time Slot</Text>
                <View style={styles.timeSlotsContainer}>
                  {timeSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        selectedTimeSlot === slot && styles.timeSlotActive
                      ]}
                      onPress={() => setSelectedTimeSlot(slot)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTimeSlot === slot && styles.timeSlotTextActive
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Service Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Describe Your Requirements</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Please describe what you need help with..."
                  multiline
                  numberOfLines={4}
                  value={bookingDescription}
                  onChangeText={setBookingDescription}
                  textAlignVertical="top"
                />
              </View>

              {/* Urgency Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Urgency Level</Text>
                <View style={styles.urgencyContainer}>
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.urgencyOption,
                        urgency === level && styles.urgencyOptionActive,
                        level === 'low' && { borderColor: '#3ad29f' },
                        level === 'medium' && { borderColor: '#ffd93d' },
                        level === 'high' && { borderColor: '#ff6b6b' }
                      ]}
                      onPress={() => setUrgency(level)}
                    >
                      <Text style={[
                        styles.urgencyText,
                        urgency === level && styles.urgencyTextActive
                      ]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Budget (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Budget (Optional)</Text>
                <View style={styles.budgetInputContainer}>
                  <MaterialIcons name="attach-money" size={20} color="#666" />
                  <TextInput
                    style={styles.budgetInput}
                    placeholder="Enter your budget"
                    value={estimatedBudget}
                    onChangeText={setEstimatedBudget}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Book Button */}
              <TouchableOpacity
                style={[
                  styles.finalBookButton,
                  bookingLoading && styles.finalBookButtonDisabled
                ]}
                onPress={handleBookService}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="event" size={20} color="#fff" />
                    <Text style={styles.finalBookButtonText}>Confirm Booking</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
            minimumDate={new Date()}
          />
        )}
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  categoriesList: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    minWidth: 80,
  },
  categoryItemActive: {
    backgroundColor: '#4b32c3',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  categoryTextActive: {
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
  servicesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  providerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  reviewCount: {
    fontSize: 12,
    color: '#999',
  },
  serviceCategory: {
    marginLeft: 12,
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flex: 1,
  },
  fixedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b32c3',
  },
  priceRange: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b32c3',
  },
  priceNegotiable: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  serviceImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(75, 50, 195, 0.1)',
    borderWidth: 1,
    borderColor: '#4b32c3',
  },
  contactButtonText: {
    color: '#4b32c3',
    fontWeight: '600',
    fontSize: 14,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4b32c3',
  },
  bookButtonText: {
    color: '#fff',
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
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  selectedServiceInfo: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  selectedServiceCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b32c3',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  selectedServiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  selectedServiceProvider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedServicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b32c3',
  },
  inputGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  timeSlotActive: {
    backgroundColor: '#4b32c3',
    borderColor: '#4b32c3',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: '#fff',
  },
  descriptionInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  urgencyOptionActive: {
    backgroundColor: 'rgba(75, 50, 195, 0.1)',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  urgencyTextActive: {
    color: '#4b32c3',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  finalBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4b32c3',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  finalBookButtonDisabled: {
    opacity: 0.7,
  },
  finalBookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
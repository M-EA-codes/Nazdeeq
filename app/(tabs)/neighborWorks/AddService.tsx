import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ServiceData {
  title: string;
  description: string;
  category: string;
  priceType: 'fixed' | 'range' | 'negotiable';
  fixedPrice?: string;
  minPrice?: string;
  maxPrice?: string;
  location: string;
  requirements?: string;
}

export default function AddService() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData>({
    title: '',
    description: '',
    category: '',
    priceType: 'negotiable',
    location: '',
  });

  const categories = [
    { id: 'plumbing', name: 'Plumbing', icon: 'plumbing' },
    { id: 'electrical', name: 'Electrical', icon: 'electrical-services' },
    { id: 'cleaning', name: 'Cleaning', icon: 'cleaning-services' },
    { id: 'gardening', name: 'Gardening', icon: 'grass' },
    { id: 'carpentry', name: 'Carpentry', icon: 'handyman' },
    { id: 'painting', name: 'Painting', icon: 'format-paint' },
    { id: 'tutoring', name: 'Tutoring', icon: 'school' },
    { id: 'delivery', name: 'Delivery', icon: 'delivery-dining' }
  ];

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

  const validateForm = (): boolean => {
    if (!serviceData.title.trim()) {
      Alert.alert('Missing Information', 'Please enter a service title.');
      return false;
    }
    if (!serviceData.description.trim()) {
      Alert.alert('Missing Information', 'Please enter a service description.');
      return false;
    }
    if (!serviceData.category) {
      Alert.alert('Missing Information', 'Please select a service category.');
      return false;
    }
    if (!serviceData.location.trim()) {
      Alert.alert('Missing Information', 'Please enter your service location.');
      return false;
    }
    if (serviceData.priceType === 'fixed' && !serviceData.fixedPrice) {
      Alert.alert('Missing Information', 'Please enter a fixed price.');
      return false;
    }
    if (serviceData.priceType === 'range' && (!serviceData.minPrice || !serviceData.maxPrice)) {
      Alert.alert('Missing Information', 'Please enter both minimum and maximum prices.');
      return false;
    }
    if (serviceData.priceType === 'range' && 
        parseFloat(serviceData.minPrice!) >= parseFloat(serviceData.maxPrice!)) {
      Alert.alert('Invalid Price Range', 'Maximum price must be greater than minimum price.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !userId) return;

    setLoading(true);
    try {
      const servicePayload: any = {
        providerId: userId,
        title: serviceData.title.trim(),
        description: serviceData.description.trim(),
        category: serviceData.category,
        location: serviceData.location.trim(),
        requirements: serviceData.requirements?.trim(),
        isActive: true
      };

      if (serviceData.priceType === 'fixed') {
        servicePayload.fixedPrice = parseFloat(serviceData.fixedPrice!);
      } else if (serviceData.priceType === 'range') {
        servicePayload.priceRange = {
          min: parseFloat(serviceData.minPrice!),
          max: parseFloat(serviceData.maxPrice!)
        };
      }

      await api.post('/services', servicePayload);
      
      // Clear form fields after successful submission
      setServiceData({
        title: '',
        description: '',
        category: '',
        priceType: 'negotiable',
        location: '',
      });
      
      Alert.alert(
        'Success!',
        'Your service has been added successfully. It is now available for customers to book.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Add service error:', error);
      const message = error.response?.data?.error || 'Failed to add service. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const LocationSuggestion = ({ location, onPress }: { location: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={onPress}>
      <MaterialIcons name="location-on" size={16} color="#666" />
      <Text style={styles.suggestionText}>{location}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New Service</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.form}>
            {/* Service Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Title *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="work" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="What service do you offer?"
                  value={serviceData.title}
                  onChangeText={(text) => setServiceData({...serviceData, title: text})}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      serviceData.category === category.id && styles.categoryChipActive
                    ]}
                    onPress={() => setServiceData({...serviceData, category: category.id})}
                  >
                    <MaterialIcons 
                      name={category.icon} 
                      size={20} 
                      color={serviceData.category === category.id ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      serviceData.category === category.id && styles.categoryChipTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <MaterialIcons name="description" size={20} color="#666" />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your service in detail..."
                  value={serviceData.description}
                  onChangeText={(text) => setServiceData({...serviceData, description: text})}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
              <Text style={styles.charCount}>
                {serviceData.description.length}/500
              </Text>
            </View>

            {/* Pricing */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pricing *</Text>
              
              {/* Price Type Selection */}
              <View style={styles.priceTypeContainer}>
                {[
                  { type: 'fixed', label: 'Fixed Price', icon: 'attach-money' },
                  { type: 'range', label: 'Price Range', icon: 'trending-up' },
                  { type: 'negotiable', label: 'Negotiable', icon: 'handshake' }
                ].map(({type, label, icon}) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.priceTypeOption,
                      serviceData.priceType === type && styles.priceTypeOptionActive
                    ]}
                    onPress={() => setServiceData({...serviceData, priceType: type as any})}
                  >
                    <MaterialIcons 
                      name={icon} 
                      size={20} 
                      color={serviceData.priceType === type ? '#4b32c3' : '#666'} 
                    />
                    <Text style={[
                      styles.priceTypeText,
                      serviceData.priceType === type && styles.priceTypeTextActive
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Inputs */}
              {serviceData.priceType === 'fixed' && (
                <View style={styles.inputContainer}>
                  <MaterialIcons name="attach-money" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter fixed price"
                    value={serviceData.fixedPrice}
                    onChangeText={(text) => setServiceData({...serviceData, fixedPrice: text})}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {serviceData.priceType === 'range' && (
                <View style={styles.priceRangeContainer}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <MaterialIcons name="attach-money" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Min price"
                      value={serviceData.minPrice}
                      onChangeText={(text) => setServiceData({...serviceData, minPrice: text})}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.priceRangeSeparator}>to</Text>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <MaterialIcons name="attach-money" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Max price"
                      value={serviceData.maxPrice}
                      onChangeText={(text) => setServiceData({...serviceData, maxPrice: text})}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Area *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-on" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Where do you provide this service?"
                  value={serviceData.location}
                  onChangeText={(text) => setServiceData({...serviceData, location: text})}
                />
              </View>
              
              {serviceData.location.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {popularLocations
                    .filter(loc => loc.toLowerCase().includes(serviceData.location.toLowerCase()))
                    .slice(0, 3)
                    .map((location, index) => (
                      <LocationSuggestion
                        key={index}
                        location={location}
                        onPress={() => setServiceData({...serviceData, location})}
                      />
                    ))}
                </View>
              )}
            </View>

            {/* Requirements */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Requirements (Optional)</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <MaterialIcons name="info-outline" size={20} color="#666" />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any special requirements, tools needed, or conditions..."
                  value={serviceData.requirements}
                  onChangeText={(text) => setServiceData({...serviceData, requirements: text})}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Add Service</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1,
    paddingBottom: 30,
  },
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
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  categoryChipActive: {
    backgroundColor: '#4b32c3',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  priceTypeContainer: {
    marginBottom: 12,
  },
  priceTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  priceTypeOptionActive: {
    backgroundColor: 'rgba(75, 50, 195, 0.1)',
    borderWidth: 1,
    borderColor: '#4b32c3',
  },
  priceTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceTypeTextActive: {
    color: '#4b32c3',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceRangeSeparator: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4b32c3',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
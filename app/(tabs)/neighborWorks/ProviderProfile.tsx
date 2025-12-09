import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../api';

const { width } = Dimensions.get('window');

export default function ProviderProfileScreen({ route, navigation }: { route: any; navigation: any }) {
  const { providerId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
    }
  }, [providerId]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const [providerRes, servicesRes] = await Promise.all([
        api.get(`/users/${providerId}`),
        api.get(`/services/provider/${providerId}`)
      ]);
      
      setProvider(providerRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching provider data:', error);
      Alert.alert('Error', 'Failed to load provider information.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading provider...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!provider) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color="#fff" />
          <Text style={styles.errorText}>Provider not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Provider Profile</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Provider Info */}
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            <Image 
              source={{ 
                uri: provider.profilePhoto || `https://via.placeholder.com/80x80/4b32c3/ffffff?text=${provider.fullName?.charAt(0) || 'P'}`
              }}
              style={styles.providerAvatar}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.fullName || 'Unknown Provider'}</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={20} color="#ffd93d" />
                <Text style={styles.rating}>{(provider.rating || 4.5).toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({provider.reviewCount || 0} reviews)</Text>
              </View>
              <Text style={styles.joinDate}>
                Joined {new Date(provider.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton}>
              <MaterialIcons name="phone" size={18} color="#4b32c3" />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <MaterialIcons name="message" size={18} color="#fff" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          {services.map((service) => (
            <View key={service._id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceCategory}>{service.category}</Text>
              </View>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <View style={styles.serviceFooter}>
                <View style={styles.priceContainer}>
                  {service.fixedPrice ? (
                    <Text style={styles.price}>${service.fixedPrice}</Text>
                  ) : service.priceRange ? (
                    <Text style={styles.price}>${service.priceRange.min} - ${service.priceRange.max}</Text>
                  ) : (
                    <Text style={styles.price}>Negotiable</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.bookServiceButton}>
                  <Text style={styles.bookServiceButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  providerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  providerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  providerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  providerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  contactButtons: {
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b32c3',
    backgroundColor: 'rgba(75, 50, 195, 0.1)',
  },
  contactButtonText: {
    color: '#4b32c3',
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4b32c3',
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#4b32c3',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  serviceCategory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize',
  },
  serviceDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {},
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bookServiceButton: {
    backgroundColor: '#4b32c3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bookServiceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
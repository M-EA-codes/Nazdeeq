import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Button, ActivityIndicator, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import config from '@/config';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProviderProfileScreen({ navigation, route }: { navigation: any, route: any }) {
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [allServices] = useState(['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Gardener']);

  // For adding a new service
  const [showAddService, setShowAddService] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [availability, setAvailability] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorAdd, setErrorAdd] = useState('');

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      let userId = route?.params?.providerId;
      let onboarding = route?.params?.onboarding;

      if (!userId) {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          userId = parsed.userId;
        }
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${config.API_URL}/neighbor-works/provider/${userId}`);
        const data = await res.json();

        if (!data || !data._id) {
          if (onboarding) {
            const prefs = await AsyncStorage.getItem('userPreferences');
            let fullName = '', address = '', description = '';
            if (prefs) {
              const parsed = JSON.parse(prefs);
              fullName = parsed.fullName || '';
              address = parsed.address || '';
            }
            const serviceCategories = allServices;
            const registerRes = await fetch(`${config.API_URL}/neighbor-works/register-provider`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, serviceCategories, description, address })
            });
            const registerData = await registerRes.json();
            setProvider(registerData.user);
            setServices(registerData.user.serviceCategories || []);
            await AsyncStorage.setItem('providerOnboarded', 'true');
            setLoading(false);
            return;
          }
        } else {
          setProvider(data);
          setServices(data.services || data.serviceCategories || []);
        }
      } catch {
        // silent fail
      }

      setLoading(false);
    };
    fetchProvider();
  }, [route]);

  const handleServiceToggle = (service: string) => {
    setServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
  };

  const handleSave = async () => {
    if (!provider) return;
    setLoading(true);
    try {
      await fetch(`${config.API_URL}/neighbor-works/provider/${provider._id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services }),
      });
      Alert.alert('Success', 'Services updated successfully');
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update services');
    }
    setLoading(false);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorAdd('Permission to access gallery is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      setGallery([...gallery, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const handleAddService = async () => {
    if (!selectedService) {
      setErrorAdd('Please select a service category.');
      return;
    }

    setLoadingAdd(true);
    setErrorAdd('');
    try {
      const prefs = await AsyncStorage.getItem('userPreferences');
      let providerId = provider?._id;
      if (!providerId && prefs) {
        const parsed = JSON.parse(prefs);
        providerId = parsed.userId;
      }

      const response = await fetch(`${config.API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedService,
          provider: providerId,
          description,
          address,
          priceRange,
          availability: availability.split(',').map(day => ({ day: day.trim(), timeSlots: [] })),
          gallery,
        }),
      });

      if (!response.ok) throw new Error('Failed to add service');

      setShowAddService(false);
      setSelectedService('');
      setDescription('');
      setAddress('');
      setPriceRange('');
      setAvailability('');
      setGallery([]);
      setErrorAdd('');
      Alert.alert('Success', 'Service added successfully!');
    } catch (err: any) {
      setErrorAdd(err.message || 'An error occurred');
    } finally {
      setLoadingAdd(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b5998" />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f9fa' }} contentContainerStyle={styles.container}>
      {/* Provider Info */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: provider?.profilePhoto || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
        <View style={styles.info}>
          <ThemedText type="title" style={styles.name}>{provider?.fullName}</ThemedText>
          <ThemedText>Rating: {provider?.rating || 'N/A'} ⭐</ThemedText>
          <ThemedText>Verified: {provider?.isVerified ? 'Yes' : 'No'}</ThemedText>
        </View>
      </View>

      {/* Services Offered */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>Offered Services</ThemedText>
      {editing ? (
        <View style={styles.servicesEdit}>
          {allServices.map((service: string) => (
            <Button
              key={service}
              title={services.includes(service) ? `✓ ${service}` : service}
              onPress={() => handleServiceToggle(service)}
              color={services.includes(service) ? '#3b5998' : '#aaa'}
            />
          ))}
          <Button title="Save" onPress={handleSave} color="#3b5998" />
          <Button title="Cancel" onPress={() => setEditing(false)} color="#aaa" />
        </View>
      ) : (
        <View style={styles.servicesEdit}>
          {services.length === 0
            ? <ThemedText>No services selected.</ThemedText>
            : services.map(s => <ThemedText key={s}>• {s}</ThemedText>)}
          <Button title="Edit Services" onPress={() => setEditing(true)} color="#3b5998" />
        </View>
      )}

      {/* Add New Service Section */}
      {showAddService && (
        <View style={styles.addServiceContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Add New Service</ThemedText>
          {errorAdd ? <ThemedText style={{ color: 'red', marginBottom: 8 }}>{errorAdd}</ThemedText> : null}
          <View style={styles.formRow}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <View style={styles.pickerRow}>
              {allServices.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[styles.pickerOption, selectedService === service && styles.pickerOptionSelected]}
                  onPress={() => setSelectedService(service)}>
                  <ThemedText style={selectedService === service ? styles.pickerOptionTextSelected : styles.pickerOptionText}>{service}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Price Range (e.g. 1000-2000)"
            value={priceRange}
            onChangeText={setPriceRange}
          />
          <TextInput
            style={styles.input}
            placeholder="Availability (comma separated days)"
            value={availability}
            onChangeText={setAvailability}
          />
          <TouchableOpacity style={styles.photoButton} onPress={pickImages}>
            <IconSymbol name="photo.on.rectangle" size={24} color="#4c669f" />
            <ThemedText style={styles.photoButtonText}>Add Photos</ThemedText>
          </TouchableOpacity>
          <ScrollView horizontal style={{ marginVertical: 8 }}>
            {gallery.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 8 }} />
            ))}
          </ScrollView>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.submitButton} onPress={handleAddService} disabled={loadingAdd}>
              <ThemedText style={styles.submitButtonText}>{loadingAdd ? 'Adding...' : 'Add Service'}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddService(false)}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Button title="Add New Service" onPress={() => setShowAddService(true)} color="#4CAF50" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f9fa',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#3b5998',
  },
  servicesEdit: {
    marginVertical: 10,
    backgroundColor: 'rgba(200, 200, 200, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  addServiceContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(200, 200, 200, 0.05)',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  pickerOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#4c669f',
  },
  pickerOptionText: {
    color: '#333',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  formRow: {
    marginBottom: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 8,
  },
  photoButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4c669f',
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});


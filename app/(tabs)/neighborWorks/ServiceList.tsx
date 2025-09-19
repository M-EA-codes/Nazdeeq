import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image, TextInput, Alert, Modal as RNModal, Text, ScrollView } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config';
import { IconSymbol } from '@/components/ui/IconSymbol';

const SERVICE_CATEGORIES = [
  'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Gardener'
];

export default function ServiceListScreen({ navigation }: { navigation: { navigate: (screen: string, params?: any) => void } }) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'provider' | 'seeker'>('seeker');
  const [userId, setUserId] = useState<string | null>(null);

  
  // Add/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [availability, setAvailability] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Rating Modal State
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingProviderId, setRatingProviderId] = useState<string | null>(null);
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    const fetchUserTypeAndServices = async () => {
      setLoading(true);
      let type: 'provider' | 'seeker' = 'seeker';
      let uid: string | null = null;
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          if (parsed.roles && parsed.roles.serviceProvider) type = 'provider';
          uid = parsed.userId || parsed._id;
        }
        if (!uid) {
          uid = await AsyncStorage.getItem('userId');
        }
      } catch {}
      setUserType(type);
      setUserId(uid);

      let url = '';
      if (type === 'provider' && uid) {
        url = `${config.API_URL}/services?providerId=${uid}`;
      } else {
        url = `${config.API_URL}/services`;
      }
      try {
        const res = await fetch(url);
        const data = await res.json();
        setServices(data);
      } catch {}
      setLoading(false);
    };
    fetchUserTypeAndServices();
  }, []);

  // Add/Edit Service Modal Handlers
  const openAddModal = () => {
    setEditingService(null);
    setCategory('');
    setDescription('');
    setAddress('');
    setPriceRange('');
    setAvailability('');
    setGallery([]);
    setModalVisible(true);
  };

  const openEditModal = (service: any) => {
    setEditingService(service);
    setCategory(service.category || '');
    setDescription(service.description || '');
    setAddress(service.location || '');
    setPriceRange(service.priceRange || '');
    setAvailability(
      Array.isArray(service.availability)
        ? service.availability.map((a: any) => a.day).join(', ')
        : ''
    );
    setGallery(service.gallery || []);
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!category) {
      Alert.alert('Validation', 'Please select a category.');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        category,
        provider: userId,
        description,
        location: address,
        priceRange,
        availability: availability
          ? availability.split(',').map(day => ({ day: day.trim(), timeSlots: [] }))
          : [],
        gallery,
      };
      let url = `${config.API_URL}/services`;
      let method = 'POST';
      if (editingService && editingService._id) {
        url = `${config.API_URL}/services/${editingService._id}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save service');
      setModalVisible(false);
      // Refresh list
      const refreshed = await fetch(`${config.API_URL}/services?providerId=${userId}`);
      setServices(await refreshed.json());
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save service');
    }
    setSaving(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert('Delete Service', 'Are you sure you want to delete this service?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${config.API_URL}/services/${serviceId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            });
            if (!res.ok) throw new Error('Failed to delete service');
            // Refresh list
            const refreshed = await fetch(`${config.API_URL}/services?providerId=${userId}`);
            setServices(await refreshed.json());
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete service');
          }
        }
      }
    ]);
  };

  const openRateModal = (providerId: string) => {
    setRatingProviderId(providerId);
    setRatingValue(5);
    setRatingComment('');
    setRateModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingProviderId) return;
    setSavingRating(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      await fetch(`${config.API_URL}/neighbor-works/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reviewerId: userId,
          revieweeId: ratingProviderId,
          rating: ratingValue,
          comment: ratingComment
        })
      });
      setRateModalVisible(false);
      // Refresh list to update ratings
      let url = userType === 'provider' && userId
        ? `${config.API_URL}/services?providerId=${userId}`
        : `${config.API_URL}/services`;
      const refreshed = await fetch(url);
      setServices(await refreshed.json());
      Alert.alert('Thank you!', 'Your feedback has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit rating');
    }
    setSavingRating(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b5998" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        {userType === 'provider' ? 'My Services' : 'Neighbor Works Services'}
      </ThemedText>
      {userType === 'provider' && (
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <IconSymbol name="plus.circle.fill" size={22} color="#4c669f" />
          <ThemedText style={styles.addButtonText}>Add New Service</ThemedText>
        </TouchableOpacity>
      )}
      <FlatList
        data={services}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText type="subtitle">{item.category}</ThemedText>
            <ThemedText>Provider: {item.provider?.fullName || 'N/A'}</ThemedText>
            <ThemedText>Rating: {item.provider?.rating ?? 'N/A'} ⭐</ThemedText>
            <ThemedText>Verified: {item.provider?.isVerified ? 'Yes' : 'No'}</ThemedText>
            {item.priceRange && <ThemedText>Price: {item.priceRange}</ThemedText>}
            {item.location && <ThemedText>Location: {item.location}</ThemedText>}
            {item.gallery && item.gallery.length > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                {item.gallery.slice(0, 3).map((img: string, idx: number) => (
                  <Image key={idx} source={{ uri: img }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 4 }} />
                ))}
              </View>
            )}
            {/* Show Provider Profile button for every service */}
            {item.provider && (
              <TouchableOpacity
                style={[styles.viewProfileBtn, { marginTop: 10, backgroundColor: '#3b5998' }]}
                onPress={() => navigation.navigate('ProviderProfile', { provider: item.provider })}
              >
                <ThemedText style={styles.viewProfileBtnText}>Show Provider Profile</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.list}
      />

      {/* Add/Edit Service Modal */}
      <RNModal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <ThemedText type="title" style={{ marginBottom: 12 }}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </ThemedText>
              <ThemedText style={{ marginBottom: 6 }}>Category</ThemedText>
              <View style={styles.categoryRow}>
                {SERVICE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      category === cat && styles.categoryOptionSelected
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <ThemedText style={category === cat ? styles.categoryOptionTextSelected : styles.categoryOptionText}>
                      {cat}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
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
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Availability (comma separated days)"
                value={availability}
                onChangeText={setAvailability}
              />
              {/* Gallery picker can be added here if needed */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveService} disabled={saving}>
                  <ThemedText style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </RNModal>

      {/* Rate Provider Modal */}
      <RNModal visible={rateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={{ marginBottom: 12 }}>Rate Provider</ThemedText>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity key={val} onPress={() => setRatingValue(val)}>
                  <IconSymbol name="star.fill" size={32} color={val <= ratingValue ? "#FFD700" : "#ccc"} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Leave a comment (optional)"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmitRating} disabled={savingRating}>
                <ThemedText style={styles.saveBtnText}>{savingRating ? 'Submitting...' : 'Submit'}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRateModalVisible(false)}>
                <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3b5998',
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  actionBtnText: {
    marginLeft: 6,
    color: '#4c669f',
    fontWeight: 'bold',
  },
  viewProfileBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#4c669f',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  viewProfileBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  addButtonText: {
    color: '#4c669f',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#4c669f',
  },
  categoryOptionText: {
    color: '#333',
    fontSize: 14,
  },
  categoryOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  providerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 6,
  },
  providerName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#3b5998',
  },
  trustScore: {
    fontSize: 13,
    color: '#4c669f',
    marginTop: 2,
  },
  rateBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 4,
  },
  rateBtnText: {
    color: '#3b5998',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
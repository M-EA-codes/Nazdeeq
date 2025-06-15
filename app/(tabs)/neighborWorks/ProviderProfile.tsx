import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Button, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import config from '@/config';

export default function ProviderProfileScreen({ navigation, route }: { navigation: any, route: any }) {
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [allServices] = useState(['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Gardener']);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      let userId = route?.params?.providerId;
      let onboarding = route?.params?.onboarding;
      if (!userId) {
        try {
          const prefs = await AsyncStorage.getItem('userPreferences');
          if (prefs) {
            const parsed = JSON.parse(prefs);
            userId = parsed.userId;
          }
        } catch {}
      }
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${config.API_URL}/neighbor-works/provider/${userId}`);
        const data = await res.json();
        if (!data || !data._id) {
          // If onboarding, create provider profile
          if (onboarding) {
            // Fetch user preferences for registration
            const prefs = await AsyncStorage.getItem('userPreferences');
            let fullName = '', address = '', description = '';
            if (prefs) {
              const parsed = JSON.parse(prefs);
              fullName = parsed.fullName || '';
              address = parsed.address || '';
            }
            // Default to all services selected for onboarding
            const serviceCategories = allServices;
            const registerRes = await fetch(`${config.API_URL}/neighbor-works/register-provider`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, serviceCategories, description, address })
            });
            const registerData = await registerRes.json();
            setProvider(registerData.user);
            setServices(registerData.user.serviceCategories || []);
            // Mark onboarding as complete
            await AsyncStorage.setItem('providerOnboarded', 'true');
            setLoading(false);
            return;
          }
        } else {
          setProvider(data);
          setServices(data.services || data.serviceCategories || []);
        }
      } catch {}
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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b5998" />
      </ThemedView>
    );
  }
  if (!provider) {
    return (
      <ThemedView style={styles.container}>
        {!provider && (
          <>
            <ThemedText>No provider data found.</ThemedText>
            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: '#4c669f', padding: 12, borderRadius: 8 }}
              onPress={() => router.push({ pathname: '/(tabs)/profile', params: { onboarding: 'true' } })}
            >
              <ThemedText style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Offer My Services</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    );
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f9fa' }} contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: provider.profilePhoto || provider.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
        <View style={styles.info}>
          <ThemedText type="title" style={styles.name}>{provider.fullName}</ThemedText>
          <ThemedText>Rating: {provider.rating || 'N/A'} ⭐</ThemedText>
          <ThemedText>Completed Orders: {provider.completedOrders || 0}</ThemedText>
          <ThemedText>Verified: {provider.isVerified ? 'Yes' : 'No'}</ThemedText>
          <ThemedText>City: {provider.city || 'N/A'}</ThemedText>
          <ThemedText>State: {provider.state || 'N/A'}</ThemedText>
        </View>
      </View>
      {provider.gallery && provider.gallery.length > 0 && (
        <ScrollView horizontal style={{ marginBottom: 12 }}>
          {provider.gallery.map((img: string, idx: number) => (
            <Image key={idx} source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 10, marginRight: 8 }} />
          ))}
        </ScrollView>
      )}
      {provider.isVerified === false && (
        <ThemedText style={{ color: 'red', marginBottom: 8 }}>Verification Pending</ThemedText>
      )}
      <ThemedText>{provider.bio || 'No bio provided.'}</ThemedText>
      <ThemedText style={styles.address}>Address: {provider.address || 'Not set'}</ThemedText>
      <ThemedText type="subtitle" style={styles.sectionTitle}>Offered Services</ThemedText>
      {editing ? (
        <View style={styles.servicesEdit}>
          {allServices.map(service => (
            <View key={service} style={styles.serviceRow}>
              <Button
                title={services.includes(service) ? `✓ ${service}` : service}
                onPress={() => handleServiceToggle(service)}
                color={services.includes(service) ? '#3b5998' : '#aaa'}
              />
            </View>
          ))}
          <Button title="Save" onPress={handleSave} color="#3b5998" />
          <Button title="Cancel" onPress={() => setEditing(false)} color="#aaa" />
        </View>
      ) : (
        <View style={styles.servicesEdit}>
          {services.length === 0 ? <ThemedText>No services selected.</ThemedText> : services.map(s => (
            <ThemedText key={s}>• {s}</ThemedText>
          ))}
          <Button title="Edit Services" onPress={() => setEditing(true)} color="#3b5998" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fa',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b5998',
    marginBottom: 4,
  },
  address: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 18,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3b5998',
  },
  servicesEdit: {
    marginVertical: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
});
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROVIDER_ONBOARD_KEY = 'providerOnboarded';

export default function Dashboard({ navigation }: { navigation: { navigate: (screen: string, params?: any) => void } }) {
  const [userType, setUserType] = useState<'provider' | 'seeker'>('seeker');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [providerOnboarded, setProviderOnboarded] = useState(false);

  useEffect(() => {
    const fetchUserType = async () => {
      setLoading(true);
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          setUserName(parsed?.fullName || '');
          if (parsed.roles && parsed.roles.serviceProvider) setUserType('provider');
          else setUserType('seeker');
        }
        const onboarded = await AsyncStorage.getItem(PROVIDER_ONBOARD_KEY);
        setProviderOnboarded(onboarded === 'true');
      } catch {}
      setLoading(false);
    };
    fetchUserType();
  }, []);

  const handleToggleRole = async () => {
    if (userType === 'seeker') {
      // Switching to provider
      if (!providerOnboarded) {
        Alert.alert(
          'Become a Service Provider',
          'To offer services, please fill out your profile and select the services you want to offer.',
          [
            {
              text: 'Proceed',
              onPress: () => {
                navigation.navigate('Profile', { onboarding: true });
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
      // Mark as provider in preferences
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          parsed.roles = parsed.roles || {};
          parsed.roles.serviceProvider = true;
          await AsyncStorage.setItem('userPreferences', JSON.stringify(parsed));
        }
      } catch {}
      setUserType('provider');
    } else {
      // Switching to seeker
      try {
        const prefs = await AsyncStorage.getItem('userPreferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          parsed.roles = parsed.roles || {};
          parsed.roles.serviceProvider = false;
          await AsyncStorage.setItem('userPreferences', JSON.stringify(parsed));
        }
      } catch {}
      setUserType('seeker');
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
    <ThemedView style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={handleToggleRole}>
        <ThemedText style={styles.toggleButtonText}>
          Switch to {userType === 'provider' ? 'Service Seeker' : 'Service Provider'}
        </ThemedText>
      </TouchableOpacity>
      <ThemedText type="title" style={styles.header}>{userType === 'provider' ? 'Provider Dashboard' : 'Service Seeker Dashboard'}</ThemedText>
      <ThemedText style={styles.welcome}>Welcome{userName ? `, ${userName}` : ''}!</ThemedText>
      {userType === 'provider' ? (
        <>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Bookings', { userType })}>
            <ThemedText type="subtitle">View Service Requests</ThemedText>
            <ThemedText>See all requests from seekers</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Services')}>
            <ThemedText type="subtitle">My Services</ThemedText>
            <ThemedText>Manage your offered services</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Reviews')}>
            <ThemedText type="subtitle">My Reviews</ThemedText>
            <ThemedText>See feedback from seekers</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Profile')}>
            <ThemedText type="subtitle">My Profile</ThemedText>
            <ThemedText>View and edit your profile</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Bookings', { userType })}>
            <ThemedText type="subtitle">My Bookings</ThemedText>
            <ThemedText>View your service requests</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Services')}>
            <ThemedText type="subtitle">Browse Services</ThemedText>
            <ThemedText>Find and book providers</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Reviews')}>
            <ThemedText type="subtitle">My Reviews</ThemedText>
            <ThemedText>See your submitted reviews</ThemedText>
          </TouchableOpacity>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f7f9fa',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3b5998',
    alignSelf: 'center',
  },
  welcome: {
    fontSize: 16,
    marginBottom: 18,
    color: '#444',
    alignSelf: 'center',
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
  toggleButton: {
    backgroundColor: '#3b5998',
    padding: 10,
    borderRadius: 8,
    marginBottom: 18,
    alignSelf: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
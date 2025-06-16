import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LogBox } from 'react-native';

export default function ProviderProfileScreen({ route }: { route: any }) {
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [availability, setAvailability] = useState('');
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      let userId = route?.params?.provider?._id || route?.params?.providerId;

      // Try AsyncStorage userId first
      if (!userId) {
        userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          const prefs = await AsyncStorage.getItem('userPreferences');
          if (prefs) {
            try {
              const parsed = JSON.parse(prefs);
              userId = parsed.userId || parsed._id;
            } catch (e) {
              // ignore parse error
            }
          }
        }
      }

      console.log('Fetching provider with ID:', userId);

      if (!userId) {
        setLoading(false);
        Alert.alert('Error', 'Unable to determine user ID. Please log in again.');
        return;
      }
      try {
        const res = await fetch(`${config.API_URL}/users/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch provider');
        const data = await res.json();
        setProvider(data);
        setProfilePhoto(data.profilePhoto || '');
        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phoneNumber || '');
        setAddress(data.address || '');
        setAvailability(data.availability || '');
        // Update AsyncStorage with latest provider info
        await AsyncStorage.setItem('userPreferences', JSON.stringify({
          ...data,
          userId: data._id
        }));
      } catch (err) {
        console.error('Provider fetch error:', err);
        Alert.alert('Error', 'Failed to load provider information');
      }
      setLoading(false);
    };
    fetchProvider();
  }, [route]);

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access gallery is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!provider) return;
    setLoadingSave(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${config.API_URL}/users/${provider._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          address,
          profilePhoto,
          availability
        }),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      const updated = await response.json();
      setProvider(updated);
      setEditing(false);
      // Update AsyncStorage with latest provider info
      await AsyncStorage.setItem('userPreferences', JSON.stringify({
        ...updated,
        userId: updated._id
      }));
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    }
    setLoadingSave(false);
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <IconSymbol name="person.crop.circle.fill" size={80} color="#4c669f" />
            )}
            {editing && (
              <TouchableOpacity style={styles.photoButton} onPress={pickProfilePhoto}>
                <ThemedText style={styles.photoButtonText}>
                  {profilePhoto ? 'Change Photo' : 'Add Photo'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          {editing ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="Availability (e.g. Mon-Fri 9am-5pm)"
                value={availability}
                onChangeText={setAvailability}
              />
            </>
          ) : (
            <>
              <ThemedText style={styles.name}>{provider?.fullName || 'User Name'}</ThemedText>
              <ThemedText style={styles.email}>{provider?.email || 'user@example.com'}</ThemedText>
              <ThemedText style={styles.email}>{provider?.phoneNumber || 'Not Provided'}</ThemedText>
              <ThemedText style={styles.email}>{provider?.address || 'Not Provided'}</ThemedText>
              <ThemedText style={styles.email}>Availability: {provider?.availability || 'Not Provided'}</ThemedText>
              <ThemedText style={styles.email}>Rating: {provider?.rating || 'N/A'} ⭐</ThemedText>
              <ThemedText style={styles.email}>Verified: {provider?.isVerified ? 'Yes' : 'No'}</ThemedText>
            </>
          )}
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Settings</ThemedText>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setEditing(!editing)}>
              <IconSymbol name="pencil" size={20} color="#4c669f" />
              <ThemedText style={styles.menuText}>{editing ? 'Cancel Edit' : 'Edit Profile'}</ThemedText>
            </TouchableOpacity>
            {editing && (
              <TouchableOpacity style={styles.menuItem} onPress={handleSave} disabled={loadingSave}>
                <IconSymbol name="square.and.arrow.down" size={20} color="#4c669f" />
                <ThemedText style={styles.menuText}>{loadingSave ? 'Saving...' : 'Save Changes'}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Other Settings</ThemedText>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Change Password', 'Password change not implemented yet.')}>
              <IconSymbol name="key.fill" size={20} color="#4c669f" />
              <ThemedText style={styles.menuText}>Change Password</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 16 },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 16, opacity: 0.7 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    width: '80%',
    marginBottom: 8,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  card: {
    borderRadius: 8,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.2)',
  },
  menuText: { fontSize: 16, marginLeft: 12 },
  photoButton: {
    backgroundColor: '#4c669f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
    alignSelf: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
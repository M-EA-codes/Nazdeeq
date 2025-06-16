import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get userId and token from AsyncStorage
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('userToken');

        if (!userId || !token) {
          router.replace('/(auth)/welcome');
          return;
        }

        // Fetch user profile using userId (if your backend expects userId in the URL, adjust accordingly)
        const response = await fetch(`${config.API_URL}/users/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();

        // Update all states with actual user data
        setUser(data);
        setName(data.fullName || '');
        setEmail(data.email || '');
        setPhone(data.phoneNumber || '');
        setAddress(data.address || '');
        setProfilePhoto(data.profilePhoto || '');
      } catch (err) {
        console.error('Failed to load user info:', err);
        Alert.alert('Error', 'Failed to load user information');
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userPreferences');
    router.replace('/(auth)/welcome');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) throw new Error('No auth token or userId');

      // Use the correct endpoint with userId
      const response = await fetch(`${config.API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: name,
          phoneNumber: phone,
          address,
          email,
          profilePhoto
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Update failed:', errText);
        throw new Error('Failed to update');
      }

      const updated = await response.json();
      setUser(updated);
      setEditable(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Could not update profile:', err);
      Alert.alert('Error', 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  // Add image picker handler
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
          </View>
          {editable ? (
            <>
              <TouchableOpacity style={styles.photoButton} onPress={pickProfilePhoto}>
                <ThemedText style={styles.photoButtonText}>
                  {profilePhoto ? 'Change Profile Photo' : 'Add Profile Photo'}
                </ThemedText>
              </TouchableOpacity>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />
            </>
          ) : (
            <>
              <ThemedText style={styles.name}>{user?.fullName || 'User Name'}</ThemedText>
              <ThemedText style={styles.email}>{user?.email || 'user@example.com'}</ThemedText>
              <ThemedText style={styles.email}>{user?.phoneNumber || 'Not Provided'}</ThemedText>
              <ThemedText style={styles.email}>{user?.address || 'Not Provided'}</ThemedText>
            </>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Settings</ThemedText>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setEditable(!editable)}>
              <IconSymbol name="pencil" size={20} color="#4c669f" />
              <ThemedText style={styles.menuText}>{editable ? 'Cancel Edit' : 'Edit Profile'}</ThemedText>
            </TouchableOpacity>
            {editable && (
              <TouchableOpacity style={styles.menuItem} onPress={handleSave} disabled={loading}>
                <IconSymbol name="square.and.arrow.down" size={20} color="#4c669f" />
                <ThemedText style={styles.menuText}>{loading ? 'Saving...' : 'Save Changes'}</ThemedText>
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
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
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

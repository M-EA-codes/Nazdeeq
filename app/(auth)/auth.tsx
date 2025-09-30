import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';


// Use the config API_URL instead of hardcoding it
const API_URL = config.API_URL;

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    profilePhoto: ''
  });
  const [imagePreview, setImagePreview] = useState('');

  // Log configuration on component mount
  React.useEffect(() => {
    console.log('🔧 AUTH: Component mounted');
    console.log('🔧 AUTH: API_URL from config:', API_URL);
    console.log('🔧 AUTH: config object:', config);
  }, []);
// Remove this duplicate declaration since error state is already declared below

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
      setFormData({ ...formData, profilePhoto: result.assets[0].uri });
      setImagePreview(result.assets[0].uri);
    }
  };
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      console.log('🔐 AUTH: Starting authentication process');
      console.log('🔐 AUTH: Mode:', isLogin ? 'LOGIN' : 'REGISTER');
      console.log('🔐 AUTH: API_URL:', API_URL);
      
      setError('');
      
      // Validation
      if (!formData.email.trim()) {
        console.log('❌ AUTH: Email is required');
        setError('Email is required');
        return;
      }
      
      if (!formData.password.trim()) {
        console.log('❌ AUTH: Password is required');
        setError('Password is required');
        return;
      }
      
      if (!isLogin) {
        if (!formData.fullName.trim()) {
          console.log('❌ AUTH: Full name is required for registration');
          setError('Full name is required');
          return;
        }
        
        if (!formData.phoneNumber.trim()) {
          console.log('❌ AUTH: Phone number is required for registration');
          setError('Phone number is required');
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          console.log('❌ AUTH: Passwords do not match');
          setError('Passwords do not match');
          return;
        }
      }

      const endpoint = isLogin ? '/login' : '/register';
      const fullUrl = `${API_URL}${endpoint}`;
      
      console.log('🔐 AUTH: Making request to:', fullUrl);
      console.log('🔐 AUTH: Request data:', {
        ...formData,
        password: '[HIDDEN]',
        confirmPassword: '[HIDDEN]'
      });

      const response = await axios.post(fullUrl, formData);
      
      console.log('✅ AUTH: Server response received');
      console.log('✅ AUTH: Response status:', response.status);
      console.log('✅ AUTH: Response data:', {
        ...response.data,
        token: response.data.token ? '[TOKEN_RECEIVED]' : 'NO_TOKEN'
      });

      if (response.data.token) {
        console.log('✅ AUTH: Token received, storing in AsyncStorage');
        await AsyncStorage.setItem('userToken', response.data.token);
        
        if (response.data.userId) {
          console.log('✅ AUTH: UserId received, storing in AsyncStorage');
          await AsyncStorage.setItem('userId', response.data.userId);
        }
        
        // Check if this is a new user registration
        if (!isLogin) {
          console.log('🔀 AUTH: New user registration, redirecting to onboarding');
          router.replace('/(auth)/onboarding');
        } else {
          // For returning users, check if they've completed onboarding
          const userPreferences = await AsyncStorage.getItem('userPreferences');
          if (userPreferences) {
            console.log('🔀 AUTH: Returning user with preferences, redirecting to home');
            router.replace('/(tabs)/home');
          } else {
            console.log('🔀 AUTH: Returning user without preferences, redirecting to onboarding');
            router.replace('/(auth)/onboarding');
          }
        }
      } else {
        console.log('❌ AUTH: No token received in response');
        setError('Authentication failed: No token received');
      }
    } catch (err: any) {
      console.log('❌ AUTH: Error occurred during authentication');
      console.log('❌ AUTH: Error object:', err);
      console.log('❌ AUTH: Error message:', err.message);
      console.log('❌ AUTH: Error response:', err.response?.data);
      console.log('❌ AUTH: Error status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during authentication';
      console.log('❌ AUTH: Setting error message:', errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, isLogin && styles.activeTab]} 
            onPress={() => setIsLogin(true)}
          >
            <ThemedText style={[styles.tabText, isLogin && styles.activeTabText]}>Login</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <ThemedText style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
        {!isLogin && (
  <View style={styles.photoSection}>
    <TouchableOpacity onPress={pickProfilePhoto} style={styles.avatarCircle}>
  {imagePreview ? (
    <Image source={{ uri: imagePreview }} style={styles.image} />
  ) : (
    <IconSymbol name="camera.circle.fill" size={80} color="#ccc" />
  )}
</TouchableOpacity>

    <ThemedText style={styles.photoText}>
      {imagePreview ? 'Change Profile Photo' : 'Add Profile Photo'}
    </ThemedText>
  </View>
)}

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            />
          )}

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <ThemedText style={styles.submitButtonText}>
              {isLogin ? 'Login' : 'Create Account'}
            </ThemedText>
          </TouchableOpacity>
{/* 
          <View style={styles.socialContainer}>
            <ThemedText style={styles.socialText}>Or continue with</ThemedText>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <IconSymbol name="g.circle.fill" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <IconSymbol name="f.circle.fill" size={24} color="#4267B2" />
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.socialButton}>
                  <IconSymbol name="apple.logo" size={24} color="#000" />
                </TouchableOpacity>
              )}
            </View>
          </View> */}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: '#fff',
  },
  activeTabText: {
    color: '#4c669f',
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#192f6a',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  socialText: {
    color: '#fff',
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },
  
});
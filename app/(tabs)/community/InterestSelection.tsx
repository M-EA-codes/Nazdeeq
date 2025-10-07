import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const { width } = Dimensions.get('window');
const api = axios.create({ baseURL: config.API_URL });

const MAX_INTERESTS = 6;

export default function InterestSelection({ navigation }: { navigation: any }) {
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchAvailableInterests();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('👤 FETCHING USER DATA...');
      const storedUserId = await AsyncStorage.getItem('userId');
      const prefs = await AsyncStorage.getItem('userPreferences');
      console.log('👤 Stored userId:', storedUserId);
      console.log('👤 Stored prefs:', prefs);
      
      if (storedUserId) {
        setUserId(storedUserId);
        console.log('✅ USER ID SET:', storedUserId);
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        setUserId(parsed.userId);
        console.log('✅ USER ID SET from prefs:', parsed.userId);
      } else {
        console.log('❌ NO USER ID FOUND');
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    }
  };

  const fetchAvailableInterests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vibe-tribe/interests/available');
      if (response.data.success) {
        setAvailableInterests(response.data.interests);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
      Alert.alert('Error', 'Failed to load interests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      // Remove interest
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      // Add interest if under max
      if (selectedInterests.length >= MAX_INTERESTS) {
        Alert.alert(
          'Maximum Reached',
          `You can only select up to ${MAX_INTERESTS} interests.`
        );
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSaveInterests = async () => {
    console.log('🎯 SAVE INTERESTS: Button clicked');
    console.log('🎯 SAVE INTERESTS: Selected interests:', selectedInterests);
    
    if (selectedInterests.length === 0) {
      Alert.alert('No Interests', 'Please select at least one interest to continue.');
      return;
    }

    console.log('🎯 SAVE INTERESTS: User ID:', userId);
    if (!userId) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    setSaving(true);
    console.log('🎯 SAVE INTERESTS: Saving to API...');
    
    try {
      const response = await api.post('/vibe-tribe/interests/save', {
        userId,
        interests: selectedInterests,
      });

      console.log('✅ SAVE INTERESTS: API response:', response.data);

      if (response.data.success) {
        console.log('✅ SAVE INTERESTS: Success! Navigating to Dashboard');
        // Navigate immediately
        navigation.navigate('Dashboard');
        // Show success message after navigation
        setTimeout(() => {
          Alert.alert(
            'Success!',
            'Your interests have been saved. Finding your matches!'
          );
        }, 500);
      } else {
        console.log('❌ SAVE INTERESTS: API returned success:false');
        Alert.alert('Error', 'Failed to save interests. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ SAVE INTERESTS: Error:', error);
      console.error('❌ SAVE INTERESTS: Error response:', error.response?.data);
      console.error('❌ SAVE INTERESTS: Error message:', error.message);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to save interests. Please try again.'
      );
    } finally {
      setSaving(false);
      console.log('🎯 SAVE INTERESTS: Done (saving flag reset)');
    }
  };

  const getInterestIcon = (interest: string): string => {
    const iconMap: { [key: string]: string } = {
      sports: 'football-ball',
      music: 'music',
      movies: 'film',
      reading: 'book',
      gaming: 'gamepad',
      cooking: 'utensils',
      travel: 'plane',
      photography: 'camera',
      fitness: 'dumbbell',
      art: 'palette',
      technology: 'laptop',
      fashion: 'tshirt',
      gardening: 'leaf',
      hiking: 'hiking',
      yoga: 'spa',
      dancing: 'music',
      writing: 'pen',
      volunteering: 'hands-helping',
      pets: 'paw',
      cars: 'car',
      crafts: 'cut',
      meditation: 'brain',
      cycling: 'bicycle',
      running: 'running',
      swimming: 'swimmer',
      painting: 'paint-brush',
      singing: 'microphone',
      instruments: 'guitar',
      comedy: 'smile',
      theater: 'theater-masks',
    };
    return iconMap[interest] || 'star';
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome5 name="heart" size={50} color="#fff" />
          <ThemedText style={styles.headerTitle}>Choose Your Interests</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Select up to {MAX_INTERESTS} interests to find like-minded neighbors
          </ThemedText>
        </View>

        {/* Interest Counter */}
        <View style={styles.counterContainer}>
          <ThemedText style={styles.counterText}>
            {selectedInterests.length} / {MAX_INTERESTS} selected
          </ThemedText>
        </View>

        {/* Interests Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Loading interests...</ThemedText>
          </View>
        ) : (
          <View style={styles.interestsGrid}>
            {availableInterests.map((interest, index) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.interestCard, isSelected && styles.interestCardSelected]}
                  onPress={() => toggleInterest(interest)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? ['#ff6b6b', '#ee5a24']
                        : ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']
                    }
                    style={styles.interestGradient}
                  >
                    <FontAwesome5
                      name={getInterestIcon(interest)}
                      size={28}
                      color="#fff"
                    />
                    <ThemedText style={styles.interestText}>
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </ThemedText>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <MaterialIcons name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (saving || selectedInterests.length === 0) && styles.saveButtonDisabled,
          ]}
          onPress={() => {
            console.log('🔘 BUTTON PRESSED - Selected count:', selectedInterests.length);
            console.log('🔘 BUTTON PRESSED - Is saving:', saving);
            handleSaveInterests();
          }}
          disabled={saving || selectedInterests.length === 0}
        >
          <LinearGradient
            colors={['#2ecc71', '#27ae60']}
            style={styles.saveButtonGradient}
          >
            <MaterialIcons name="check-circle" size={24} color="#fff" />
            <ThemedText style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save & Find Matches'}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  counterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  interestCard: {
    width: (width - 50) / 3,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  interestCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  interestGradient: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    position: 'relative',
  },
  interestText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});


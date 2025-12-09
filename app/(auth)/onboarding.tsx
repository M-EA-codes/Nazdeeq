import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const API_URL = config.API_URL;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState({
    neighborCommute: false,
    neighborworks: false,
    vibeTribe: false,
    communityPulse: false,
    impactFund: false
  });
  
  const [contributions, setContributions] = useState({
    offerRide: false,
    volunteering: false,
    organizingMeetups: false,
    participating: false
  });
  
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState({
    latitude: 33.6844,
    longitude: 73.0479
  });
  const [address, setAddress] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [connectNearby, setConnectNearby] = useState(true);
  
  type InterestKey = keyof typeof interests;
  type ContributionKey = keyof typeof contributions;

  useEffect(() => {
    // Request location permission when component mounts
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          let location = await Location.getCurrentPositionAsync({});
          setCoords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          // Get address from coordinates
          let geo = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          if (geo[0]) {
            const addr = `${geo[0].street || ''}, ${geo[0].city || ''}, ${geo[0].region || ''}`.trim();
            setAddress(addr);
            setLocation(addr);
          }
        } catch (error) {
          console.log('Error getting location:', error);
        }
      }
    })();
  }, []);
  
  const handleInterestToggle = (interest: InterestKey) => {
    setInterests(prev => ({
      ...prev,
      [interest]: !prev[interest]
    }));
  };
  
  const handleContributionToggle = (contribution: ContributionKey) => {
    setContributions(prev => ({
      ...prev,
      [contribution]: !prev[contribution]
    }));
  };
  
  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      savePreferencesAndContinue();
    }
  };
  
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLoadingLocation(true);
    setCoords({ latitude, longitude });
    
    try {
      let geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo[0]) {
        const addr = `${geo[0].street || ''}, ${geo[0].city || ''}, ${geo[0].region || ''}`.trim();
        setAddress(addr);
        setLocation(addr);
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        setLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      let geo = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (geo[0]) {
        const addr = `${geo[0].street || ''}, ${geo[0].city || ''}, ${geo[0].region || ''}`.trim();
        setAddress(addr);
        setLocation(addr);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
      console.log('Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const savePreferencesAndContinue = async () => {
    try {
      // Get the user token and userId
      const userToken = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userToken || !userId) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      // Save user preferences to AsyncStorage
      const userPreferences = {
        interests,
        contributions,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: address || location
        },
        connectNearby,
        isFirstLogin: false // Mark that user has completed onboarding
      };
      
      await AsyncStorage.setItem('userPreferences', JSON.stringify(userPreferences));
      
      // Send preferences to server
      try {
        await axios.post(`${API_URL}/users/preferences`, {
          userId,
          interests,
          contributions,
          location: {
            type: 'Point',
            coordinates: [coords.longitude, coords.latitude],
            address: address || location
          },
          connectNearby
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
      } catch (serverError) {
        console.log('Error saving to server:', serverError);
        // Continue even if server save fails
      }
      
      // Navigate to the main dashboard
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
      console.error(error);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Which services interest you the most?</ThemedText>
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.optionItem, interests.neighborCommute && styles.optionSelected]}
                onPress={() => handleInterestToggle('neighborCommute')}
              >
                <IconSymbol name="house.fill" size={24} color={interests.neighborCommute ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, interests.neighborCommute && styles.optionTextSelected]}>NeighborCommute</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, interests.neighborworks && styles.optionSelected]}
                onPress={() => handleInterestToggle('neighborworks')}
              >
                <IconSymbol name="house.fill" size={24} color={interests.neighborworks ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, interests.neighborworks && styles.optionTextSelected]}>Neighborworks</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, interests.vibeTribe && styles.optionSelected]}
                onPress={() => handleInterestToggle('vibeTribe')}
              >
                <IconSymbol name="house.fill" size={24} color={interests.vibeTribe ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, interests.vibeTribe && styles.optionTextSelected]}>VibeTribe</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, interests.communityPulse && styles.optionSelected]}
                onPress={() => handleInterestToggle('communityPulse')}
              >
                <IconSymbol name="house.fill" size={24} color={interests.communityPulse ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, interests.communityPulse && styles.optionTextSelected]}>CommunityPulse</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, interests.impactFund && styles.optionSelected]}
                onPress={() => handleInterestToggle('impactFund')}
              >
                <IconSymbol name="house.fill" size={24} color={interests.impactFund ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, interests.impactFund && styles.optionTextSelected]}>ImpactFund</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>What would you like to contribute?</ThemedText>
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.optionItem, contributions.offerRide && styles.optionSelected]}
                onPress={() => handleContributionToggle('offerRide')}
              >
                <IconSymbol name="house.fill" size={24} color={contributions.offerRide ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, contributions.offerRide && styles.optionTextSelected]}>Offering a ride</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, contributions.volunteering && styles.optionSelected]}
                onPress={() => handleContributionToggle('volunteering')}
              >
                <IconSymbol name="house.fill" size={24} color={contributions.volunteering ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, contributions.volunteering && styles.optionTextSelected]}>Volunteering</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, contributions.organizingMeetups && styles.optionSelected]}
                onPress={() => handleContributionToggle('organizingMeetups')}
              >
                <IconSymbol name="house.fill" size={24} color={contributions.organizingMeetups ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, contributions.organizingMeetups && styles.optionTextSelected]}>Organizing meetups</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, contributions.participating && styles.optionSelected]}
                onPress={() => handleContributionToggle('participating')}
              >
                <IconSymbol name="house.fill" size={24} color={contributions.participating ? "#fff" : "#4c669f"} />
                <ThemedText style={[styles.optionText, contributions.participating && styles.optionTextSelected]}>Participating in discussions</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Pin your home location</ThemedText>
            <ThemedText style={styles.stepSubtitle}>
              Tap on the map or use current location to set your neighborhood
            </ThemedText>
            
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                }}
                onPress={handleMapPress}
              >
                <Marker coordinate={coords} title="Your Location" />
              </MapView>
              
              <TouchableOpacity 
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="location.fill" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.addressDisplay}>
              <IconSymbol name="mappin.circle.fill" size={20} color="#4c669f" />
              <ThemedText style={styles.addressText}>
                {address || location || "Tap on the map to set your location"}
              </ThemedText>
            </View>
            
            <View style={styles.switchContainer}>
              <ThemedText style={styles.switchLabel}>
                Connect with people from nearby areas?
              </ThemedText>
              <Switch
                value={connectNearby}
                onValueChange={setConnectNearby}
                trackColor={{ false: '#767577', true: '#4c669f' }}
                thumbColor={connectNearby ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepTitle}>Trust Score Introduction</ThemedText>
            <View style={styles.trustScoreContainer}>
              <View style={styles.trustScoreCircle}>
                <ThemedText style={styles.trustScoreText}>0</ThemedText>
              </View>
              <ThemedText style={styles.trustScoreDescription}>
                Nazdeeq uses a credibility score to ensure safety and trust in the community. 
                Build yours by engaging with verified users!
              </ThemedText>
            </View>
            
            <View style={styles.dashboardIntro}>
              <ThemedText style={styles.dashboardIntroTitle}>Ready to explore Nazdeeq!</ThemedText>
              <ThemedText style={styles.dashboardIntroText}>
                You've selected {Object.values(interests).filter(Boolean).length} modules to explore. 
                Your personalized dashboard awaits you!
              </ThemedText>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Welcome to Nazdeeq!</ThemedText>
          <ThemedText style={styles.subtitle}>Let's Get You Started</ThemedText>
        </View>
        
        <View style={styles.stepsIndicator}>
          {[1, 2, 3, 4].map((i) => (
            <View 
              key={i} 
              style={[styles.stepIndicator, step >= i && styles.activeStepIndicator]}
            />
          ))}
        </View>
        
        {renderStep()}
        
        <View style={styles.navigationButtons}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
              <ThemedText style={styles.backButtonText}>Back</ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNextStep}
          >
            <ThemedText style={styles.nextButtonText}>
              {step === 4 ? 'Continue to Dashboard' : 'Next'}
            </ThemedText>
          </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.8,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeStepIndicator: {
    backgroundColor: '#fff',
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 16,
  },
  mapContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 250,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#4c669f',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  optionsContainer: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#4c669f',
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  locationInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  locationButton: {
    backgroundColor: '#4c669f',
    borderRadius: 8,
    padding: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  trustScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trustScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  trustScoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  trustScoreDescription: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  dashboardIntro: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 15,
  },
  dashboardIntroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  dashboardIntroText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.45,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  nextButtonText: {
    color: '#4c669f',
    fontSize: 16,
    fontWeight: 'bold',
  },});
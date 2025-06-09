import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Activity {
  id: number;
  type: string;
  message: string;
  icon: string;
}

interface Suggestion {
  id: number;
  message: string;
  icon: string;
}

interface UserData {
  name: string;
  location: string;
  trustScore: number;
  profilePicture: string | null;
  recentActivities: Activity[];
  suggestions: Suggestion[];
}

interface UserPreferences {
  interests: {
    neighborCommute: boolean;
    neighborworks: boolean;
    vibeTribe: boolean;
    communityPulse: boolean;
    impactFund: boolean;
  };
  contributions: {
    offerRide: boolean;
    volunteering: boolean;
    organizingMeetups: boolean;
    participating: boolean;
  };
  location: string;
  connectNearby: boolean;
  isFirstLogin: boolean;
}


export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    // Set greeting based on time of day
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    
    // Load user data and preferences
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const prefsString = await AsyncStorage.getItem('userPreferences');
        
        if (!token) {
          // If no token, redirect to welcome screen
          router.replace('/(auth)/welcome');
          return;
        }
        
        // Mock user data (in a real app, this would come from an API)
        const mockUserData = {
          name: 'Ahmed',
          location: 'Islamabad',
          trustScore: 75,
          profilePicture: null, // placeholder for profile picture
          recentActivities: [
            { id: 1, type: 'ride', message: 'Ali is offering a ride tomorrow at 8 AM – Join now!', icon: 'car.fill' },
            { id: 2, type: 'service', message: 'Your booked technician for electrical repair is arriving today at 3 PM.', icon: 'wrench.fill' },
            { id: 3, type: 'event', message: 'New meetup: Chess Club gathering at Central Café on Saturday.', icon: 'person.2.fill' }
          ],
          suggestions: [
            { id: 1, message: 'Since you often book rides in the morning, pre-schedule your next commute now!', icon: 'clock' },
            { id: 2, message: 'You liked gardening discussions – Join a local gardening meetup this weekend!', icon: 'leaf' },
            { id: 3, message: 'A neighbor nearby needs plumbing help – Offer assistance?', icon: 'hand.raised' }
          ]
        };
        
        setUserData(mockUserData);
        
        if (prefsString) {
          const prefs = JSON.parse(prefsString);
          setUserPreferences(prefs);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4c669f" />
        <ThemedText style={styles.loadingText}>Loading your dashboard...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section with User Profile */}
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <View style={styles.profileImageContainer}>
              <IconSymbol name="person.crop.circle.fill" size={60} color="#4c669f" />
            </View>
            <View style={styles.userTextInfo}>
              <ThemedText style={styles.greeting}>{greeting}, {userData?.name}!</ThemedText>
              <ThemedText style={styles.locationText}>Here's what's happening in {userData?.location}</ThemedText>
            </View>
          </View>
          
          <View style={styles.trustScoreContainer}>
            <ThemedText style={styles.trustScoreLabel}>Trust Score</ThemedText>
            <View style={styles.trustScoreBar}>
              <View style={[styles.trustScoreFill, { width: `${userData?.trustScore || 0}%` }]} />
            </View>
            <ThemedText style={styles.trustScoreValue}>{userData?.trustScore}</ThemedText>
          </View>
        </View>
        
        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton}>
            <IconSymbol name="house.fill" size={24} color="#fff" />
            <ThemedText style={styles.quickActionText}>NeighborCommute</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <IconSymbol name="house.fill" size={24} color="#fff" />
            <ThemedText style={styles.quickActionText}>Neighborworks</ThemedText>
            router.replace('neighborWorks/Dashboard');
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <IconSymbol name="house.fill" size={24} color="#fff" />
            <ThemedText style={styles.quickActionText}>VibeTribe</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Ongoing Activity & Notifications Panel */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText style={styles.sectionTitle}>Ongoing Activity</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.viewMoreText}>View More</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.card}>
            {userData?.recentActivities?.map((activity) => (
              <View key={activity.id} style={styles.notificationItem}>
                <IconSymbol name={'house.fill' as const} size={24} color="#4c669f" />
                <ThemedText style={styles.notificationText}>{activity.message}</ThemedText>
              </View>
            ))}
          </View>
        </View>
        
        {/* Modules Quick Access */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Modules Quick Access</ThemedText>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modulesScrollView}>
            <TouchableOpacity style={styles.moduleCard}>
              <View style={styles.moduleIconContainer}>
                <IconSymbol name="house.fill" size={30} color="#4c669f" />
              </View>
              <ThemedText style={styles.moduleTitle}>NeighborCommute</ThemedText>
              <ThemedText style={styles.moduleDescription}>3 rides available near you</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moduleCard}>
              <View style={styles.moduleIconContainer}>
                <IconSymbol name="house.fill" size={30} color="#4c669f" />
              </View>
              <ThemedText style={styles.moduleTitle}>Neighborworks</ThemedText>
              <ThemedText style={styles.moduleDescription}>5 top-rated service providers</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moduleCard}>
              <View style={styles.moduleIconContainer}>
                <IconSymbol name="house.fill" size={30} color="#4c669f" />
              </View>
              <ThemedText style={styles.moduleTitle}>VibeTribe</ThemedText>
              <ThemedText style={styles.moduleDescription}>2 events happening soon</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* AI-Powered Suggestions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Suggested For You</ThemedText>
          
          <View style={styles.card}>
            {userData?.suggestions?.map((suggestion) => (
              <TouchableOpacity key={suggestion.id} style={styles.suggestionItem}>
                <IconSymbol name={'house.fill' as const} size={24} color="#4c669f" />
                <ThemedText style={styles.suggestionText}>{suggestion.message}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userTextInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    opacity: 0.7,
  },
  trustScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  trustScoreLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  trustScoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trustScoreFill: {
    height: '100%',
    backgroundColor: '#4c669f',
    borderRadius: 4,
  },
  trustScoreValue: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#4c669f',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionText: {
    color: '#fff',
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewMoreText: {
    color: '#4c669f',
    fontSize: 14,
  },
  card: {
    borderRadius: 8,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.2)',
  },
  notificationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  modulesScrollView: {
    marginBottom: 8,
  },
  moduleCard: {
    width: 160,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
  },
  moduleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  moduleDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.2)',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },});
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';
import FirebaseMessagingService from '@/services/FirebaseMessagingService';

const api = axios.create({ baseURL: config.API_URL });

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  profilePhoto?: string;
  rating: number;
  trustScore: number;
  vibeTribeInterests: string[];
  vibeTribeSetupCompleted: boolean;
  createdAt: string;
}

interface ConnectionStatus {
  status: string;
  connectionId?: string;
  isRequester?: boolean;
  canConnect: boolean;
}

export default function UserProfile({ route, navigation }: { route: any; navigation: any }) {
  const { userId, matchScore, sharedInterests } = route.params;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'none',
    canConnect: false
  });
  const [sendingRequest, setSendingRequest] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && userId) {
      fetchUserProfile();
      fetchConnectionStatus();
    }
  }, [userId, currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUserName = await AsyncStorage.getItem('userName');
      const prefs = await AsyncStorage.getItem('userPreferences');
      
      if (storedUserId) {
        setCurrentUserId(storedUserId);
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        setCurrentUserId(parsed.userId);
      }

      if (storedUserName) {
        setCurrentUserName(storedUserName);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vibe-tribe/profile/${userId}`);
      
      if (response.data.success) {
        setProfile(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await api.get(`/connections/status/${currentUserId}/${userId}`);
      if (response.data.success) {
        setConnectionStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  };

  const handleConnect = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please log in to connect');
      return;
    }

    setSendingRequest(true);
    try {
      const response = await api.post('/connections/request', {
        requesterId: currentUserId,
        recipientId: userId,
        sharedInterests: sharedInterests || [],
        matchScore: matchScore || 0,
        message: '' // Can add custom message later
      });

      if (response.data.success) {
        Alert.alert(
          'Request Sent!',
          `Your connection request has been sent to ${profile?.fullName}. You'll be notified when they respond.`
        );
        fetchConnectionStatus(); // Refresh status
      }
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to send connection request. Please try again.'
      );
    } finally {
      setSendingRequest(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!connectionStatus.connectionId) return;

    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this connection request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/connections/${connectionStatus.connectionId}/cancel`, {
                data: { userId: currentUserId }
              });
              Alert.alert('Success', 'Connection request cancelled');
              fetchConnectionStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request');
            }
          }
        }
      ]
    );
  };

  const handleDisconnect = async () => {
    if (!connectionStatus.connectionId) return;

    Alert.alert(
      'Remove Connection',
      `Are you sure you want to disconnect from ${profile?.fullName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/connections/${connectionStatus.connectionId}/remove`, {
                data: { userId: currentUserId }
              });
              Alert.alert('Success', 'Connection removed');
              fetchConnectionStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove connection');
            }
          }
        }
      ]
    );
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

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <FontAwesome5 name="spinner" size={50} color="#fff" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Profile not found</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>User Profile</ThemedText>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialIcons name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Photo */}
          <View style={styles.profilePhotoContainer}>
            {profile.profilePhoto ? (
              <Image
                source={{ uri: profile.profilePhoto }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <FontAwesome5 name="user" size={50} color="#fff" />
              </View>
            )}
          </View>

          {/* Name */}
          <ThemedText style={styles.profileName}>{profile.fullName}</ThemedText>

          {/* Location */}
          <View style={styles.locationContainer}>
            <MaterialIcons name="place" size={18} color="rgba(255, 255, 255, 0.7)" />
            <ThemedText style={styles.locationText}>
              {profile.address || 'Location not set'}
            </ThemedText>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <FontAwesome5 name="star" size={20} color="#f39c12" />
              <ThemedText style={styles.statValue}>
                {profile.rating.toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <FontAwesome5 name="shield-alt" size={20} color="#3498db" />
              <ThemedText style={styles.statValue}>{profile.trustScore}</ThemedText>
              <ThemedText style={styles.statLabel}>Trust Score</ThemedText>
            </View>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="heart" size={20} color="#e74c3c" />
            <ThemedText style={styles.sectionTitle}>Interests</ThemedText>
          </View>

          {profile.vibeTribeInterests && profile.vibeTribeInterests.length > 0 ? (
            <View style={styles.interestsGrid}>
              {profile.vibeTribeInterests.map((interest, index) => (
                <View key={index} style={styles.interestCard}>
                  <FontAwesome5
                    name={getInterestIcon(interest)}
                    size={24}
                    color="#fff"
                  />
                  <ThemedText style={styles.interestText}>
                    {interest.charAt(0).toUpperCase() + interest.slice(1)}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noInterests}>
              <ThemedText style={styles.noInterestsText}>
                No interests added yet
              </ThemedText>
            </View>
          )}
        </View>

        {/* Contact Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info" size={22} color="#fff" />
            <ThemedText style={styles.sectionTitle}>Contact Information</ThemedText>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color="rgba(255, 255, 255, 0.7)" />
              <ThemedText style={styles.infoText}>{profile.email}</ThemedText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="rgba(255, 255, 255, 0.7)" />
              <ThemedText style={styles.infoText}>{profile.phoneNumber}</ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Connection Status Based Actions */}
          {connectionStatus.status === 'none' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleConnect}
              disabled={sendingRequest}
            >
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="person-add" size={24} color="#fff" />
                <ThemedText style={styles.actionButtonText}>
                  {sendingRequest ? 'Sending...' : 'Connect'}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {connectionStatus.status === 'pending' && connectionStatus.isRequester && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCancelRequest}
            >
              <LinearGradient
                colors={['#95a5a6', '#7f8c8d']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="hourglass-empty" size={24} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Request Pending</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {connectionStatus.status === 'pending' && !connectionStatus.isRequester && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ConnectionRequests')}
              >
                <LinearGradient
                  colors={['#f39c12', '#e67e22']}
                  style={styles.actionButtonGradient}
                >
                  <MaterialIcons name="notifications-active" size={24} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>Respond to Request</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {connectionStatus.status === 'accepted' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                disabled={openingChat}
                onPress={async () => {
                  if (openingChat) {
                    console.log('⚠️ Already opening chat, ignoring click');
                    return;
                  }

                  try {
                    console.log('💬 Opening chat with user:', userId);
                    
                    if (!currentUserId || !profile) {
                      console.log('❌ Missing user data');
                      Alert.alert('Error', 'User information not available');
                      return;
                    }

                    setOpeningChat(true);

                    // Get or create conversation
                    console.log('🔍 Getting or creating conversation...');
                    const conversationId = await FirebaseMessagingService.getOrCreateConversation(
                      currentUserId,
                      userId,
                      { name: currentUserName, photo: '' },
                      { name: profile.fullName, photo: profile.profilePhoto }
                    );

                    console.log('✅ Got conversation ID:', conversationId);

                    // Navigate to chat
                    console.log('🚀 Navigating to ChatScreen...');
                    navigation.navigate('ChatScreen', {
                      conversationId,
                      otherUserId: userId,
                      otherUserName: profile.fullName,
                      otherUserPhoto: profile.profilePhoto,
                    });
                    
                    console.log('✅ Navigation completed');
                  } catch (error) {
                    console.error('❌ Error opening chat:', error);
                    Alert.alert('Error', 'Failed to open chat. Please try again.');
                  } finally {
                    setOpeningChat(false);
                  }
                }}
              >
                <LinearGradient
                  colors={openingChat ? ['#95a5a6', '#7f8c8d'] : ['#2ecc71', '#27ae60']}
                  style={styles.actionButtonGradient}
                >
                  {openingChat ? (
                    <FontAwesome5 name="circle-notch" size={24} color="#fff" />
                  ) : (
                    <MaterialIcons name="message" size={24} color="#fff" />
                  )}
                  <ThemedText style={styles.actionButtonText}>
                    {openingChat ? 'Opening Chat...' : 'Send Message'}
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDisconnect}
              >
                <LinearGradient
                  colors={['#e74c3c', '#c0392b']}
                  style={styles.actionButtonGradient}
                >
                  <MaterialIcons name="person-remove" size={24} color="#fff" />
                  <ThemedText style={styles.actionButtonText}>Disconnect</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {connectionStatus.status === 'declined' && (
            <View style={styles.declinedNotice}>
              <MaterialIcons name="info" size={20} color="rgba(255, 255, 255, 0.7)" />
              <ThemedText style={styles.declinedText}>
                Connection request was declined. You can try again in 30 days.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Member Since */}
        <View style={styles.memberSince}>
          <ThemedText style={styles.memberSinceText}>
            Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </ThemedText>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: { width: 40 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhotoContainer: {
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    minWidth: 100,
  },
  interestText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  noInterests: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
  },
  noInterestsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 15,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
  actionsContainer: {
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberSince: {
    alignItems: 'center',
    marginTop: 10,
  },
  memberSinceText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  declinedNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  declinedText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginLeft: 10,
    lineHeight: 20,
  },
});


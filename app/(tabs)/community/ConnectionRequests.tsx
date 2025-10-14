import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

interface ConnectionRequest {
  connectionId: string;
  from: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    interests: string[];
    rating: number;
    trustScore: number;
    address: string;
  };
  message?: string;
  sharedInterests: string[];
  matchScore: number;
  requestedAt: string;
}

export default function ConnectionRequests({ navigation }: { navigation: any }) {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchRequests();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const prefs = await AsyncStorage.getItem('userPreferences');
      if (storedUserId) {
        setUserId(storedUserId);
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        setUserId(parsed.userId);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchRequests = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await api.get(`/connections/pending/${userId}`);

      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleAccept = async (connectionId: string, userName: string) => {
    setProcessingId(connectionId);
    try {
      const response = await api.put(`/connections/${connectionId}/accept`, {
        userId
      });

      if (response.data.success) {
        Alert.alert(
          'Connection Accepted!',
          `You're now connected with ${userName}. Start a conversation!`
        );
        // Remove from list
        setRequests(requests.filter(r => r.connectionId !== connectionId));
      }
    } catch (error: any) {
      console.error('Error accepting request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to accept connection request'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (connectionId: string, userName: string) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the connection request from ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(connectionId);
            try {
              const response = await api.put(`/connections/${connectionId}/decline`, {
                userId
              });

              if (response.data.success) {
                Alert.alert('Request Declined', 'Connection request has been declined');
                // Remove from list
                setRequests(requests.filter(r => r.connectionId !== connectionId));
              }
            } catch (error: any) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline connection request');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const getMatchPercentage = (score: number) => {
    return Math.round(score * 100);
  };

  const formatRequestTime = (date: string) => {
    const now = new Date();
    const requested = new Date(date);
    const diffMs = now.getTime() - requested.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return requested.toLocaleDateString();
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialIcons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Connection Requests</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <FontAwesome5 name="spinner" size={40} color="#fff" />
            <ThemedText style={styles.loadingText}>Loading requests...</ThemedText>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5
              name="user-clock"
              size={64}
              color="rgba(255, 255, 255, 0.5)"
            />
            <ThemedText style={styles.emptyStateTitle}>No Pending Requests</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              You don't have any connection requests at the moment.
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.statsCard}>
              <MaterialIcons name="notifications-active" size={24} color="#fff" />
              <ThemedText style={styles.statsText}>
                {requests.length} Pending Request{requests.length !== 1 ? 's' : ''}
              </ThemedText>
            </View>

            {requests.map((request) => (
              <View key={request.connectionId} style={styles.requestCard}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('UserProfile', {
                      userId: request.from._id,
                      matchScore: request.matchScore,
                      sharedInterests: request.sharedInterests
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.requestHeader}>
                    {/* Profile Photo */}
                    {request.from.profilePhoto ? (
                      <Image
                        source={{ uri: request.from.profilePhoto }}
                        style={styles.profilePhoto}
                      />
                    ) : (
                      <View style={styles.profilePhotoPlaceholder}>
                        <FontAwesome5 name="user" size={30} color="#fff" />
                      </View>
                    )}

                    {/* User Info */}
                    <View style={styles.userInfo}>
                      <View style={styles.nameRow}>
                        <ThemedText style={styles.userName}>
                          {request.from.fullName}
                        </ThemedText>
                        <View style={styles.matchBadge}>
                          <ThemedText style={styles.matchBadgeText}>
                            {getMatchPercentage(request.matchScore)}% match
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.locationRow}>
                        <MaterialIcons
                          name="place"
                          size={14}
                          color="rgba(255, 255, 255, 0.7)"
                        />
                        <ThemedText style={styles.location} numberOfLines={1}>
                          {request.from.address || 'Location not set'}
                        </ThemedText>
                      </View>
                      <View style={styles.statsRow}>
                        <FontAwesome5 name="star" size={12} color="#f39c12" />
                        <ThemedText style={styles.statText}>
                          {request.from.rating.toFixed(1)}
                        </ThemedText>
                        <FontAwesome5
                          name="shield-alt"
                          size={12}
                          color="#3498db"
                          style={{ marginLeft: 12 }}
                        />
                        <ThemedText style={styles.statText}>
                          {request.from.trustScore}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Time */}
                <View style={styles.timeContainer}>
                  <MaterialIcons name="access-time" size={14} color="rgba(255, 255, 255, 0.6)" />
                  <ThemedText style={styles.timeText}>
                    {formatRequestTime(request.requestedAt)}
                  </ThemedText>
                </View>

                {/* Shared Interests */}
                <View style={styles.sharedInterests}>
                  <ThemedText style={styles.sharedLabel}>
                    ❤️ {request.sharedInterests.length} shared interest
                    {request.sharedInterests.length !== 1 ? 's' : ''}
                  </ThemedText>
                  <View style={styles.interestTags}>
                    {request.sharedInterests.slice(0, 4).map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <ThemedText style={styles.interestTagText}>
                          {interest}
                        </ThemedText>
                      </View>
                    ))}
                    {request.sharedInterests.length > 4 && (
                      <View style={styles.interestTag}>
                        <ThemedText style={styles.interestTagText}>
                          +{request.sharedInterests.length - 4}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Message if present */}
                {request.message && (
                  <View style={styles.messageContainer}>
                    <MaterialIcons name="chat-bubble" size={16} color="rgba(255, 255, 255, 0.7)" />
                    <ThemedText style={styles.messageText}>
                      "{request.message}"
                    </ThemedText>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.acceptButton,
                      processingId === request.connectionId && styles.disabledButton
                    ]}
                    onPress={() => handleAccept(request.connectionId, request.from.fullName)}
                    disabled={processingId === request.connectionId}
                  >
                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>
                      {processingId === request.connectionId ? 'Accepting...' : 'Accept'}
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.declineButton,
                      processingId === request.connectionId && styles.disabledButton
                    ]}
                    onPress={() => handleDecline(request.connectionId, request.from.fullName)}
                    disabled={processingId === request.connectionId}
                  >
                    <MaterialIcons name="cancel" size={20} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>Decline</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    gap: 10,
  },
  statsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  matchBadge: {
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  location: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 5,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 5,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sharedInterests: {
    marginBottom: 12,
  },
  sharedLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  interestTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  messageContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    gap: 10,
  },
  messageText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
  },
  declineButton: {
    backgroundColor: '#e74c3c',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});


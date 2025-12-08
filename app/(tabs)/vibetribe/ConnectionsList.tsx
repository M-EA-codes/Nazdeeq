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
import FirebaseMessagingService from '@/services/FirebaseMessagingService';

const api = axios.create({ baseURL: config.API_URL });

interface Connection {
  connectionId: string;
  user: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
    interests: string[];
    rating: number;
    trustScore: number;
    address: string;
  };
  status: string;
  sharedInterests: string[];
  matchScore: number;
  connectionStrength: number;
  lastInteractionAt: string;
}

export default function ConnectionsList({ navigation }: { navigation: any }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchConnections();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUserName = await AsyncStorage.getItem('userName');
      const prefs = await AsyncStorage.getItem('userPreferences');
      
      if (storedUserId) {
        setUserId(storedUserId);
      } else if (prefs) {
        const parsed = JSON.parse(prefs);
        setUserId(parsed.userId);
      }

      if (storedUserName) {
        setUserName(storedUserName);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchConnections = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await api.get(`/connections/user/${userId}`, {
        params: { status: 'accepted' }
      });

      if (response.data.success) {
        setConnections(response.data.connections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConnections();
    setRefreshing(false);
  };

  const getConnectionStrengthLabel = (strength: number) => {
    if (strength >= 70) return '🔥 Strong';
    if (strength >= 40) return '💪 Good';
    if (strength >= 20) return '👍 Growing';
    return '🌱 New';
  };

  const formatLastInteraction = (date: string) => {
    const now = new Date();
    const interaction = new Date(date);
    const diffMs = now.getTime() - interaction.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
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
        <ThemedText style={styles.headerTitle}>My Connections</ThemedText>
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
            <ThemedText style={styles.loadingText}>Loading connections...</ThemedText>
          </View>
        ) : connections.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5
              name="user-friends"
              size={64}
              color="rgba(255, 255, 255, 0.5)"
            />
            <ThemedText style={styles.emptyStateTitle}>No Connections Yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Start connecting with neighbors who share your interests!
            </ThemedText>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('MatchedUsers')}
            >
              <ThemedText style={styles.emptyStateButtonText}>
                Find Matches
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsCard}>
              <ThemedText style={styles.statsText}>
                {connections.length} Connection{connections.length !== 1 ? 's' : ''}
              </ThemedText>
            </View>

            {connections.map((connection) => (
              <TouchableOpacity
                key={connection.connectionId}
                style={styles.connectionCard}
                onPress={() =>
                  navigation.navigate('UserProfile', {
                    userId: connection.user._id,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.connectionHeader}>
                  {/* Profile Photo */}
                  {connection.user.profilePhoto ? (
                    <Image
                      source={{ uri: connection.user.profilePhoto }}
                      style={styles.profilePhoto}
                    />
                  ) : (
                    <View style={styles.profilePhotoPlaceholder}>
                      <FontAwesome5 name="user" size={24} color="#fff" />
                    </View>
                  )}

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName}>
                      {connection.user.fullName}
                    </ThemedText>
                    <View style={styles.locationRow}>
                      <MaterialIcons
                        name="place"
                        size={14}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                      <ThemedText style={styles.location} numberOfLines={1}>
                        {connection.user.address || 'Location not set'}
                      </ThemedText>
                    </View>
                    <View style={styles.statsRow}>
                      <FontAwesome5 name="star" size={12} color="#f39c12" />
                      <ThemedText style={styles.statText}>
                        {connection.user.rating.toFixed(1)}
                      </ThemedText>
                      <FontAwesome5
                        name="shield-alt"
                        size={12}
                        color="#3498db"
                        style={{ marginLeft: 12 }}
                      />
                      <ThemedText style={styles.statText}>
                        {connection.user.trustScore}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Connection Details */}
                <View style={styles.connectionDetails}>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>
                      Connection Strength:
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {getConnectionStrengthLabel(connection.connectionStrength)}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>
                      Last interaction:
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {formatLastInteraction(connection.lastInteractionAt)}
                    </ThemedText>
                  </View>
                </View>

                {/* Shared Interests */}
                <View style={styles.sharedInterests}>
                  <ThemedText style={styles.sharedLabel}>
                    ❤️ {connection.sharedInterests.length} shared interest
                    {connection.sharedInterests.length !== 1 ? 's' : ''}
                  </ThemedText>
                  <View style={styles.interestTags}>
                    {connection.sharedInterests.slice(0, 3).map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <ThemedText style={styles.interestTagText}>
                          {interest}
                        </ThemedText>
                      </View>
                    ))}
                    {connection.sharedInterests.length > 3 && (
                      <View style={styles.interestTag}>
                        <ThemedText style={styles.interestTagText}>
                          +{connection.sharedInterests.length - 3}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={[
                      styles.quickActionButton,
                      openingChatId === connection.user._id && styles.quickActionButtonDisabled
                    ]}
                    disabled={openingChatId === connection.user._id}
                    onPress={async () => {
                      if (openingChatId) {
                        console.log('⚠️ Already opening a chat, ignoring click');
                        return;
                      }

                      try {
                        console.log('💬 Opening chat with:', connection.user.fullName);
                        setOpeningChatId(connection.user._id);

                        // Get or create conversation
                        const conversationId = await FirebaseMessagingService.getOrCreateConversation(
                          userId!,
                          connection.user._id,
                          { name: userName, photo: '' },
                          { name: connection.user.fullName, photo: connection.user.profilePhoto }
                        );

                        console.log('✅ Got conversation, navigating...');

                        // Navigate to chat
                        navigation.navigate('ChatScreen', {
                          conversationId,
                          otherUserId: connection.user._id,
                          otherUserName: connection.user.fullName,
                          otherUserPhoto: connection.user.profilePhoto,
                        });
                        
                        console.log('✅ Navigation completed');
                      } catch (error) {
                        console.error('❌ Error opening chat:', error);
                        Alert.alert('Error', 'Failed to open chat. Please try again.');
                      } finally {
                        setOpeningChatId(null);
                      }
                    }}
                  >
                    <MaterialIcons 
                      name={openingChatId === connection.user._id ? "hourglass-empty" : "message"} 
                      size={20} 
                      color="#667eea" 
                    />
                    <ThemedText style={styles.quickActionText}>
                      {openingChatId === connection.user._id ? 'Opening...' : 'Message'}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() =>
                      navigation.navigate('UserProfile', {
                        userId: connection.user._id,
                      })
                    }
                  >
                    <MaterialIcons name="info" size={20} color="#667eea" />
                    <ThemedText style={styles.quickActionText}>Profile</ThemedText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  emptyStateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginTop: 30,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  connectionHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
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
  connectionDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  sharedInterests: {
    marginBottom: 15,
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
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
  },
  quickActionText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
});


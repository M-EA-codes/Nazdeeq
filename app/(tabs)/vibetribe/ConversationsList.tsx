import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirebaseMessagingService, { Conversation } from '@/services/FirebaseMessagingService';

export default function ConversationsList({ navigation }: { navigation: any }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      const unsubscribe = FirebaseMessagingService.subscribeToConversations(
        userId,
        (convs) => {
          console.log('📬 Conversations updated:', convs.length);
          setConversations(convs);
          setLoading(false);
        }
      );

      return () => unsubscribe();
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

  const onRefresh = () => {
    setRefreshing(true);
    // Firebase auto-refreshes, just reset the flag
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getOtherParticipant = (conv: Conversation) => {
    const otherUserId = conv.participants.find(id => id !== userId);
    return {
      userId: otherUserId,
      ...conv.participantDetails[otherUserId || '']
    };
  };

  const getUnreadCount = (conv: Conversation) => {
    return conv.unreadCount?.[userId || ''] || 0;
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
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
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
            <ThemedText style={styles.loadingText}>Loading messages...</ThemedText>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5
              name="comments"
              size={64}
              color="rgba(255, 255, 255, 0.5)"
            />
            <ThemedText style={styles.emptyStateTitle}>No Messages Yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Start a conversation with your connections!
            </ThemedText>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('ConnectionsList')}
            >
              <ThemedText style={styles.emptyStateButtonText}>
                View Connections
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            const unreadCount = getUnreadCount(conversation);

            return (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationCard}
                onPress={() =>
                  navigation.navigate('ChatScreen', {
                    conversationId: conversation.id,
                    otherUserId: otherUser.userId,
                    otherUserName: otherUser.name,
                    otherUserPhoto: otherUser.photo,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.conversationContent}>
                  {/* Profile Photo */}
                  {otherUser.photo ? (
                    <Image
                      source={{ uri: otherUser.photo }}
                      style={styles.profilePhoto}
                    />
                  ) : (
                    <View style={styles.profilePhotoPlaceholder}>
                      <FontAwesome5 name="user" size={24} color="#fff" />
                    </View>
                  )}

                  {/* Conversation Info */}
                  <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                      <ThemedText style={styles.userName} numberOfLines={1}>
                        {otherUser.name || 'Unknown User'}
                      </ThemedText>
                      {conversation.lastMessage && (
                        <ThemedText style={styles.timestamp}>
                          {formatTime(conversation.lastMessage.timestamp)}
                        </ThemedText>
                      )}
                    </View>

                    <View style={styles.lastMessageRow}>
                      <ThemedText
                        style={[
                          styles.lastMessage,
                          unreadCount > 0 && styles.unreadMessage
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage?.senderId === userId && 'You: '}
                        {conversation.lastMessage?.text || 'No messages yet'}
                      </ThemedText>

                      {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <ThemedText style={styles.unreadCount}>
                            {unreadCount}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
  conversationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  conversationInfo: {
    flex: 1,
    marginLeft: 15,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 10,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#fff',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});


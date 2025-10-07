import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirebaseMessagingService, { Message } from '@/services/FirebaseMessagingService';

export default function ChatScreen({ route, navigation }: { route: any; navigation: any }) {
  const {
    conversationId,
    otherUserId,
    otherUserName,
    otherUserPhoto,
  } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId && conversationId) {
      // Mark messages as read when entering chat
      FirebaseMessagingService.markAsRead(conversationId, userId);

      // Subscribe to messages
      const unsubscribe = FirebaseMessagingService.subscribeToMessages(
        conversationId,
        (msgs) => {
          console.log('💬 Messages updated:', msgs.length);
          setMessages(msgs);
          // Auto-scroll to bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      return () => unsubscribe();
    }
  }, [userId, conversationId]);

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

  const handleSend = async () => {
    if (!inputText.trim() || !userId) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UX
    setSending(true);

    try {
      await FirebaseMessagingService.sendMessage(
        conversationId,
        userId,
        messageText
      );

      // Increment unread count for recipient
      await FirebaseMessagingService.incrementUnreadCount(
        conversationId,
        otherUserId
      );

      console.log('✅ Message sent');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateHeader = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const shouldShowDateHeader = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;
    
    const currentDate = currentMsg.timestamp?.toDate ? currentMsg.timestamp.toDate() : new Date();
    const prevDate = prevMsg.timestamp?.toDate ? prevMsg.timestamp.toDate() : new Date();
    
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerCenter}
            onPress={() => navigation.navigate('UserProfile', { userId: otherUserId })}
          >
            {otherUserPhoto ? (
              <Image
                source={{ uri: otherUserPhoto }}
                style={styles.headerPhoto}
              />
            ) : (
              <View style={styles.headerPhotoPlaceholder}>
                <FontAwesome5 name="user" size={16} color="#fff" />
              </View>
            )}
            <ThemedText style={styles.headerTitle}>{otherUserName}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialIcons name="home" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="comments" size={48} color="rgba(255, 255, 255, 0.3)" />
              <ThemedText style={styles.emptyStateText}>
                No messages yet. Say hi! 👋
              </ThemedText>
            </View>
          ) : (
            messages.map((message, index) => {
              const isMyMessage = message.senderId === userId;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDateHeader = shouldShowDateHeader(message, prevMessage);

              return (
                <View key={message.id}>
                  {showDateHeader && (
                    <View style={styles.dateHeader}>
                      <ThemedText style={styles.dateHeaderText}>
                        {formatDateHeader(message.timestamp)}
                      </ThemedText>
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isMyMessage ? styles.myMessage : styles.theirMessage,
                    ]}
                  >
                    <ThemedText style={styles.messageText}>{message.text}</ThemedText>
                    <View style={styles.messageFooter}>
                      <ThemedText style={styles.messageTime}>
                        {formatMessageTime(message.timestamp)}
                      </ThemedText>
                      {isMyMessage && (
                        <View style={styles.messageStatus}>
                          {message.status === 'read' ? (
                            <MaterialIcons name="done-all" size={14} color="#4FC3F7" />
                          ) : message.status === 'delivered' ? (
                            <MaterialIcons name="done-all" size={14} color="rgba(255,255,255,0.7)" />
                          ) : (
                            <MaterialIcons name="done" size={14} color="rgba(255,255,255,0.7)" />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <FontAwesome5 name="circle-notch" size={20} color="#fff" />
              ) : (
                <MaterialIcons name="send" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  headerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerPhotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dateHeaderText: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
    gap: 4,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  messageStatus: {
    marginLeft: 2,
  },
  inputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
});


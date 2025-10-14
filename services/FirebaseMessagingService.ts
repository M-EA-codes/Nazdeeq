import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  limit,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../app/firebase/config';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: any;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt?: Date;
}

export interface Conversation {
  id: string;
  participants: string[]; // [userId1, userId2]
  participantDetails: {
    [userId: string]: {
      name: string;
      photo?: string;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
  };
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: any;
  updatedAt: any;
}

class FirebaseMessagingService {
  // Get or create conversation between two users
  async getOrCreateConversation(
    userId1: string,
    userId2: string,
    user1Details: { name: string; photo?: string },
    user2Details: { name: string; photo?: string }
  ): Promise<string> {
    try {
      console.log('🔍 Checking for existing conversation between:', userId1, 'and', userId2);
      
      // Sort user IDs to ensure consistent ordering
      const sortedIds = [userId1, userId2].sort();
      
      // Check if conversation already exists (check both possible orderings)
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId1)
      );

      const querySnapshot = await getDocs(q);
      console.log('📋 Found', querySnapshot.size, 'conversations for user');
      
      let existingConversation: any = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 Checking conversation:', doc.id, 'participants:', data.participants);
        
        // Check if both users are in the participants array
        if (data.participants.includes(userId1) && data.participants.includes(userId2)) {
          console.log('✅ Found existing conversation:', doc.id);
          existingConversation = { id: doc.id, ...data };
        }
      });

      if (existingConversation) {
        console.log('✅ Returning existing conversation:', existingConversation.id);
        return existingConversation.id;
      }

      console.log('➕ No existing conversation found, creating new one...');

      // Create new conversation with sorted IDs for consistency
      const newConversation = {
        participants: sortedIds, // Use sorted IDs for consistency
        participantDetails: {
          [userId1]: user1Details,
          [userId2]: user2Details,
        },
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(conversationsRef, newConversation);
      console.log('✅ New conversation created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
      
      const messageData = {
        conversationId,
        senderId,
        text: text.trim(),
        timestamp: serverTimestamp(),
        status: 'sent',
        createdAt: serverTimestamp(),
      };

      await addDoc(messagesRef, messageData);

      // Update conversation's last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          text: text.trim(),
          senderId,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Listen to messages in a conversation
  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp,
            status: data.status || 'sent',
            createdAt: data.createdAt?.toDate(),
          });
        });
        callback(messages);
      },
      (error) => {
        console.error('❌ Error listening to messages:', error);
      }
    );

    return unsubscribe;
  }

  // Listen to all conversations for a user
  subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const conversations: Conversation[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          conversations.push({
            id: doc.id,
            participants: data.participants,
            participantDetails: data.participantDetails || {},
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount || {},
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        callback(conversations);
      },
      (error) => {
        console.error('❌ Error listening to conversations:', error);
      }
    );

    return unsubscribe;
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0,
      });
      console.log('✅ Messages marked as read');
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  }

  // Increment unread count for recipient
  async incrementUnreadCount(
    conversationId: string,
    recipientId: string
  ): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDocs(
        query(collection(db, 'conversations'), where('__name__', '==', conversationId), limit(1))
      );

      if (!conversationSnap.empty) {
        const data = conversationSnap.docs[0].data();
        const currentCount = data.unreadCount?.[recipientId] || 0;
        
        await updateDoc(conversationRef, {
          [`unreadCount.${recipientId}`]: currentCount + 1,
        });
      }
    } catch (error) {
      console.error('❌ Error incrementing unread count:', error);
    }
  }

  // Delete a message (soft delete - hide from user)
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        deleted: true,
      });
      console.log('✅ Message deleted');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }

  // Get conversation details
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDocs(
        query(collection(db, 'conversations'), where('__name__', '==', conversationId), limit(1))
      );

      if (!conversationSnap.empty) {
        const data = conversationSnap.docs[0].data();
        return {
          id: conversationSnap.docs[0].id,
          participants: data.participants,
          participantDetails: data.participantDetails || {},
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount || {},
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      return null;
    }
  }
}

export default new FirebaseMessagingService();


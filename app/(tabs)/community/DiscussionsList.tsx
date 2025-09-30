import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

export default function DiscussionsList({ route, navigation }: { route: any; navigation: any }) {
  const { groupId } = route.params || {};
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDiscussions();
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

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/discussions');
      setDiscussions(response.data || []);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      Alert.alert('Error', 'Failed to load discussions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscussions();
    setRefreshing(false);
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Discussions</ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateDiscussion', { groupId })}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ThemedText style={styles.loadingText}>Loading discussions...</ThemedText>
        ) : discussions.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="comments" size={64} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>No discussions yet</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Be the first to start a discussion!
            </ThemedText>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateDiscussion', { groupId })}
            >
              <ThemedText style={styles.createButtonText}>Start Discussion</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          discussions.map((discussion: any, index) => (
            <TouchableOpacity
              key={discussion._id || index}
              style={styles.discussionCard}
              onPress={() => navigation.navigate('DiscussionDetails', { 
                discussionId: discussion._id 
              })}
            >
              <ThemedText style={styles.discussionTitle}>{discussion.title}</ThemedText>
              <ThemedText style={styles.discussionContent} numberOfLines={2}>
                {discussion.content}
              </ThemedText>
              <View style={styles.discussionFooter}>
                <ThemedText style={styles.discussionDate}>
                  {new Date(discussion.created_at).toLocaleDateString()}
                </ThemedText>
                <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableOpacity>
          ))
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 50, fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyStateText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  emptyStateSubtext: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, marginTop: 10, marginBottom: 30 },
  createButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 25, paddingHorizontal: 30, paddingVertical: 12 },
  createButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  discussionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15, padding: 20, marginBottom: 15,
  },
  discussionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  discussionContent: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginBottom: 15 },
  discussionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discussionDate: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 },
});

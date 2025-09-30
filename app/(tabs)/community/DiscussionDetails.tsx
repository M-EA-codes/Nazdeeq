import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

export default function DiscussionDetails({ route, navigation }: { route: any; navigation: any }) {
  const { discussionId } = route.params;
  const [discussion, setDiscussion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDiscussionDetails();
  }, [discussionId]);

  const fetchDiscussionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/discussions/${discussionId}`);
      setDiscussion(response.data);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      Alert.alert('Error', 'Failed to load discussion details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscussionDetails();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading discussion...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!discussion) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Discussion not found</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Discussion</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.discussionCard}>
          <ThemedText style={styles.discussionTitle}>{discussion.title}</ThemedText>
          <ThemedText style={styles.discussionContent}>{discussion.content}</ThemedText>
          <ThemedText style={styles.discussionDate}>
            {new Date(discussion.created_at).toLocaleString()}
          </ThemedText>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreatePoll', { discussionId })}
          >
            <MaterialIcons name="poll" size={20} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Create Poll</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  discussionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 15, padding: 20, marginBottom: 20,
  },
  discussionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  discussionContent: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 16, lineHeight: 24, marginBottom: 15 },
  discussionDate: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 },
  actionsContainer: { gap: 10 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15, padding: 15,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});

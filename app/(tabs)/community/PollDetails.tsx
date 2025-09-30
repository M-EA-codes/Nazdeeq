import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

export default function PollDetails({ route, navigation }: { route: any; navigation: any }) {
  const { pollId } = route.params;
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPollDetails();
    }
  }, [userId, pollId]);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) setUserId(storedUserId);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchPollDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/polls/${pollId}`);
      setPoll(response.data);
    } catch (error) {
      console.error('Error fetching poll:', error);
      Alert.alert('Error', 'Failed to load poll details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: number) => {
    if (!poll || !userId) return;

    try {
      // Update poll options with new vote
      const updatedOptions = poll.options.map((option: any) =>
        option.optionId === optionId
          ? { ...option, votes: option.votes + 1 }
          : option
      );

      const updatedPoll = { ...poll, options: updatedOptions };
      await api.put(`/polls/${pollId}`, updatedPoll);
      setPoll(updatedPoll);
      
      Alert.alert('Success', 'Your vote has been recorded!');
    } catch (error) {
      Alert.alert('Error', 'Failed to record vote. Please try again.');
    }
  };

  if (loading || !poll) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>
            {loading ? 'Loading poll...' : 'Poll not found'}
          </ThemedText>
        </View>
      </LinearGradient>
    );
  }

  const totalVotes = poll.options.reduce((sum: number, option: any) => sum + option.votes, 0);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Poll Results</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pollCard}>
          <ThemedText style={styles.pollQuestion}>{poll.question}</ThemedText>
          <ThemedText style={styles.totalVotes}>Total votes: {totalVotes}</ThemedText>

          <View style={styles.optionsContainer}>
            {poll.options.map((option: any, index: number) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.optionCard}
                  onPress={() => handleVote(option.optionId)}
                >
                  <View style={styles.optionHeader}>
                    <ThemedText style={styles.optionText}>{option.text}</ThemedText>
                    <ThemedText style={styles.optionPercentage}>{percentage}%</ThemedText>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${percentage}%` }]} 
                    />
                  </View>
                  <ThemedText style={styles.optionVotes}>{option.votes} votes</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },
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
  pollCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 15, padding: 20,
  },
  pollQuestion: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  totalVotes: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginBottom: 20 },
  optionsContainer: { gap: 15 },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 15,
  },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  optionText: { color: '#fff', fontSize: 16, flex: 1 },
  optionPercentage: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  progressBar: {
    height: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 3, marginBottom: 5,
  },
  progressFill: { height: '100%', backgroundColor: '#2ecc71', borderRadius: 3 },
  optionVotes: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 },
});

import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Text, 
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CommunityStats {
  totalDiscussions: number;
  activePolls: number;
  userParticipation: number;
  recentActivity: number;
}

interface RecentItem {
  _id: string;
  title: string;
  type: 'discussion' | 'poll';
  author: string;
  timeAgo: string;
  category: string;
}

export default function CommunityPulseDashboard() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<CommunityStats>({
    totalDiscussions: 0,
    activePolls: 0,
    userParticipation: 0,
    recentActivity: 0
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
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

  const getTimeAgo = (dateString: string | undefined) => {
    try {
      if (!dateString) return 'Unknown';
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Unknown';
      }
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch discussions with better error handling
      let discussionsData = [];
      try {
        const discussionsResponse = await api.get('/discussions?limit=100');
        console.log('Discussions response:', discussionsResponse.data);
        
        if (Array.isArray(discussionsResponse.data)) {
          discussionsData = discussionsResponse.data;
        } else {
          discussionsData = [];
        }
      } catch (error) {
        console.error('Error fetching discussions:', error);
        discussionsData = [];
      }

      // Fetch polls with better error handling
      let pollsData = [];
      try {
        const pollsResponse = await api.get('/polls?limit=100');
        console.log('Polls response:', pollsResponse.data);
        
        if (Array.isArray(pollsResponse.data)) {
          pollsData = pollsResponse.data;
        } else {
          pollsData = [];
        }
      } catch (error) {
        console.error('Error fetching polls:', error);
        pollsData = [];
      }

      const activePolls = pollsData.filter((poll: any) => poll.isActive === true).length;

      // Calculate user participation (discussions + poll votes)
      const userDiscussions = discussionsData.filter((d: any) => {
        const authorId = d.authorId?._id || d.authorId;
        return authorId === userId;
      }).length;
      
      const userPolls = pollsData.filter((p: any) => {
        const createdBy = p.createdBy?._id || p.createdBy;
        return createdBy === userId;
      }).length;

      setStats({
        totalDiscussions: discussionsData.length,
        activePolls,
        userParticipation: userDiscussions + userPolls,
        recentActivity: discussionsData.filter((d: any) => {
          try {
            const dateStr = d.createdAt || d.created_at;
            if (!dateStr) return false;
            
            const createdAt = new Date(dateStr);
            if (isNaN(createdAt.getTime())) return false;
            
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            return createdAt > dayAgo;
          } catch {
            return false;
          }
        }).length
      });

      // Combine recent discussions and polls with safe access
      const recentDiscussions = discussionsData.slice(0, 3).map((d: any) => ({
        _id: d._id || '',
        title: d.title || 'Untitled Discussion',
        type: 'discussion' as const,
        author: d.authorId?.fullName || d.authorId?.name || 'Anonymous',
        timeAgo: getTimeAgo(d.createdAt || d.created_at),
        category: d.category || 'other'
      }));

      const recentPolls = pollsData.slice(0, 2).map((p: any) => ({
        _id: p._id || '',
        title: p.title || 'Untitled Poll',
        type: 'poll' as const,
        author: p.createdBy?.fullName || p.createdBy?.name || 'Anonymous',
        timeAgo: getTimeAgo(p.createdAt || p.created_at),
        category: p.category || 'other'
      }));

      setRecentItems([...recentDiscussions, ...recentPolls]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setStats({
        totalDiscussions: 0,
        activePolls: 0,
        userParticipation: 0,
        recentActivity: 0
      });
      setRecentItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigateToScreen = (screenName: string, params?: any) => {
    console.log('Navigating to:', screenName, 'with params:', params);
    
    try {
      if (screenName === 'DiscussionDetail' && params?.discussionId) {
        console.log('Navigating to DiscussionDetail with ID:', params.discussionId);
        navigation.navigate('DiscussionDetail', { id: params.discussionId });
      } else if (screenName === 'PollDetail' && params?.pollId) {
        console.log('Navigating to PollDetail with ID:', params.pollId);
        navigation.navigate('PollDetail', { id: params.pollId });
      } else if (screenName === 'DiscussionForum') {
        navigation.navigate('DiscussionForum');
      } else if (screenName === 'PollsSection') {
        navigation.navigate('PollsSection');
      } else {
        console.warn('Unknown screen or missing params:', screenName, params);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4c669f" />
        <ThemedText style={styles.loadingText}>Loading Community Pulse...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Community Pulse</ThemedText>
          <ThemedText style={styles.subtitle}>Connect • Discuss • Decide</ThemedText>
        </View>

        {/* Stats Cards - Reverted to small boxes layout */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="forum" size={24} color="#4c669f" />
            <ThemedText style={styles.statNumber}>{stats.totalDiscussions}</ThemedText>
            <ThemedText style={styles.statLabel}>Discussions</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="poll" size={24} color="#4c669f" />
            <ThemedText style={styles.statNumber}>{stats.activePolls}</ThemedText>
            <ThemedText style={styles.statLabel}>Active Polls</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="person" size={24} color="#4c669f" />
            <ThemedText style={styles.statNumber}>{stats.userParticipation}</ThemedText>
            <ThemedText style={styles.statLabel}>Your Posts</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={24} color="#4c669f" />
            <ThemedText style={styles.statNumber}>{stats.recentActivity}</ThemedText>
            <ThemedText style={styles.statLabel}>Recent</ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigateToScreen('DiscussionForum')}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="forum" size={30} color="#fff" />
              <ThemedText style={styles.actionTitle}>Discussion Forum</ThemedText>
              <ThemedText style={styles.actionSubtitle}>Share ideas & concerns</ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigateToScreen('PollsSection')}
          >
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.actionGradient}
            >
              <MaterialIcons name="poll" size={30} color="#fff" />
              <ThemedText style={styles.actionTitle}>Polls & Surveys</ThemedText>
              <ThemedText style={styles.actionSubtitle}>Voice your opinion</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <TouchableOpacity onPress={() => navigateToScreen('DiscussionForum')}>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {recentItems.length > 0 ? (
            recentItems.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.recentItem}
                onPress={() => {
                  console.log('Clicking item:', item);
                  if (item.type === 'discussion') {
                    navigateToScreen('DiscussionDetail', { discussionId: item._id });
                  } else {
                    navigateToScreen('PollDetail', { pollId: item._id });
                  }
                }}
              >
                <View style={styles.recentItemContent}>
                  <MaterialIcons 
                    name={item.type === 'discussion' ? 'forum' : 'poll'} 
                    size={20} 
                    color="#4c669f" 
                  />
                  <View style={styles.recentItemText}>
                    <ThemedText style={styles.recentItemTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.recentItemMeta}>
                      by {item.author} • {item.timeAgo}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) }]}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="forum" size={48} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>No recent activity</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>Start a discussion or create a poll!</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    infrastructure: '#ff6b6b',
    safety: '#4ecdc4',
    environment: '#45b7d1',
    community: '#96ceb4',
    government: '#feca57',
    other: '#a0a0a0'
  };
  return colors[category] || colors.other;
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#4c669f' },
  header: { paddingTop: 60, paddingHorizontal: 20, alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  
  // Stats Container - Grid Layout
  statsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    marginBottom: 30 
  },
  statCard: { 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 12, 
    padding: 16, 
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  
  actionsContainer: { paddingHorizontal: 20, marginBottom: 30 },
  actionCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  actionGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 16 },
  actionSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 16, marginTop: 4 },
  
  recentSection: { paddingHorizontal: 20, marginBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  viewAllText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  recentItem: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recentItemContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  recentItemText: { marginLeft: 12, flex: 1 },
  recentItemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  recentItemMeta: { fontSize: 12, color: '#666', marginTop: 4 },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }
});
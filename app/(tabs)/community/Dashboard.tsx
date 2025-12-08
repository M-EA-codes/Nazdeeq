import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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

export default function CommunityPulseDashboard({ navigation }: { navigation: any }) {
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch discussions with better error handling
      let discussionsData = [];
      try {
        const discussionsResponse = await api.get('/discussions?limit=100');
        console.log('Discussions response:', discussionsResponse);
        
        // Handle different response structures
        if (Array.isArray(discussionsResponse)) {
          discussionsData = discussionsResponse;
        } else if (discussionsResponse && discussionsResponse.discussions && Array.isArray(discussionsResponse.discussions)) {
          discussionsData = discussionsResponse.discussions;
        } else if (discussionsResponse && discussionsResponse.data) {
          if (Array.isArray(discussionsResponse.data)) {
            discussionsData = discussionsResponse.data;
          } else if (discussionsResponse.data.discussions) {
            discussionsData = discussionsResponse.data.discussions;
          }
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
        console.log('Polls response:', pollsResponse);
        
        // Handle different response structures
        if (Array.isArray(pollsResponse)) {
          pollsData = pollsResponse;
        } else if (pollsResponse && pollsResponse.polls && Array.isArray(pollsResponse.polls)) {
          pollsData = pollsResponse.polls;
        } else if (pollsResponse && pollsResponse.data) {
          if (Array.isArray(pollsResponse.data)) {
            pollsData = pollsResponse.data;
          } else if (pollsResponse.data.polls) {
            pollsData = pollsResponse.data.polls;
          }
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
            const createdAt = new Date(d.created_at);
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
        timeAgo: getTimeAgo(d.created_at || new Date().toISOString()),
        category: d.category || 'other'
      }));

      const recentPolls = pollsData.slice(0, 2).map((p: any) => ({
        _id: p._id || '',
        title: p.title || 'Untitled Poll',
        type: 'poll' as const,
        author: p.createdBy?.fullName || p.createdBy?.name || 'Anonymous',
        timeAgo: getTimeAgo(p.created_at || new Date().toISOString()),
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

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  // Add navigation safety checks
  const navigateToScreen = (screenName: string, params?: any) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screenName, params);
    } else {
      console.warn('Navigation not available');
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

        {/* Stats Cards */}
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

        {/* Community Guidelines */}
        <View style={styles.guidelinesSection}>
          <ThemedText style={styles.sectionTitle}>Community Guidelines</ThemedText>
          <View style={styles.guidelineCard}>
            <Text style={styles.guidelineItem}>• Be respectful and constructive</Text>
            <Text style={styles.guidelineItem}>• Focus on community issues</Text>
            <Text style={styles.guidelineItem}>• Provide evidence when possible</Text>
            <Text style={styles.guidelineItem}>• Report inappropriate content</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    infrastructure: '#FF6B6B',
    safety: '#4ECDC4',
    environment: '#45B7D1',
    community: '#96CEB4',
    government: '#FFEAA7',
    other: '#DDA0DD'
  };
  return colors[category] || colors.other;
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { 
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    width: '22%',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  actionCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  recentSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4c669f',
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentItemText: {
    marginLeft: 12,
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recentItemMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  guidelinesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  guidelineCard: {
    marginTop: 10,
  },
  guidelineItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
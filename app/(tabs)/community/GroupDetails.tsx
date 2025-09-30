import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '@/config';

const api = axios.create({ baseURL: config.API_URL });

interface Group {
  _id: string;
  name: string;
  description: string;
  category: string;
  privacy: string;
  createdBy: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
  };
  memberIds: any[];
  maxMembers: number;
  location?: string;
  tags: string[];
  created_at: string;
  isActive: boolean;
}

const categories = [
  { id: 'general', name: 'General', icon: 'comments' },
  { id: 'hobby', name: 'Hobbies', icon: 'palette' },
  { id: 'sports', name: 'Sports', icon: 'running' },
  { id: 'book-club', name: 'Book Club', icon: 'book' },
  { id: 'parenting', name: 'Parenting', icon: 'baby' },
  { id: 'seniors', name: 'Seniors', icon: 'user-friends' },
  { id: 'professional', name: 'Professional', icon: 'briefcase' },
  { id: 'neighborhood-watch', name: 'Safety Watch', icon: 'eye' },
  { id: 'gardening', name: 'Gardening', icon: 'seedling' },
  { id: 'cooking', name: 'Cooking', icon: 'utensils' },
  { id: 'other', name: 'Other', icon: 'ellipsis-h' },
];

export default function GroupDetails({ route, navigation }: { route: any; navigation: any }) {
  const { groupId } = route.params;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchGroupDetails();
    }
  }, [userId, groupId]);

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

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groups/${groupId}`);
      setGroup(response.data);
    } catch (error) {
      console.error('Error fetching group details:', error);
      Alert.alert('Error', 'Failed to load group details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!userId || !group) {
      Alert.alert('Error', 'Please log in to join groups');
      return;
    }

    try {
      const response = await api.post(`/groups/${groupId}/join`, { userId });
      setGroup(response.data.group);
      Alert.alert('Success', 'You have successfully joined the group!');
    } catch (error: any) {
      console.error('Error joining group:', error);
      
      let errorMessage = 'Failed to join group. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const leaveGroup = async () => {
    if (!userId || !group) return;

    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post(`/groups/${groupId}/leave`, { userId });
              setGroup(response.data.group);
              Alert.alert('Success', 'You have left the group');
            } catch (error: any) {
              console.error('Error leaving group:', error);
              
              let errorMessage = 'Failed to leave group. Please try again.';
              if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
              }
              
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const shareGroup = async () => {
    if (!group) return;

    const message = `Join "${group.name}" group in our community!\n\n${group.description}\n\nCategory: ${categories.find(cat => cat.id === group.category)?.name}\nMembers: ${group.memberIds?.length || 0}`;
    
    try {
      await Share.share({
        message,
        title: group.name,
      });
    } catch (error) {
      console.error('Error sharing group:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupDetails();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData?.icon || 'users';
  };

  const getCategoryName = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData?.name || 'General';
  };

  const isUserMember = () => {
    if (!group || !userId) return false;
    return group.memberIds?.some(member => 
      (typeof member === 'string' ? member : member._id) === userId
    ) || false;
  };

  const isUserCreator = () => {
    return group?.createdBy._id === userId;
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading group details...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!group) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Group not found</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  const isMember = isUserMember();
  const isCreator = isUserCreator();

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={shareGroup}
          >
            <MaterialIcons name="share" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Header */}
        <View style={styles.groupHeader}>
          <View style={styles.groupIconLarge}>
            <FontAwesome5 
              name={getCategoryIcon(group.category)} 
              size={40} 
              color="#fff" 
            />
          </View>
          
          <ThemedText style={styles.groupTitle}>{group.name}</ThemedText>
          
          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <ThemedText style={styles.categoryText}>
                {getCategoryName(group.category)}
              </ThemedText>
            </View>
            
            {group.privacy === 'private' && (
              <View style={styles.privateBadge}>
                <FontAwesome5 name="lock" size={12} color="#fff" />
                <ThemedText style={styles.privateBadgeText}>Private</ThemedText>
              </View>
            )}
            
            {isMember && (
              <View style={styles.memberBadge}>
                <FontAwesome5 name="check" size={12} color="#fff" />
                <ThemedText style={styles.memberBadgeText}>Member</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Group Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <FontAwesome5 name="users" size={20} color="#fff" />
            <ThemedText style={styles.statNumber}>{group.memberIds?.length || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Members</ThemedText>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <FontAwesome5 name="calendar" size={20} color="#fff" />
            <ThemedText style={styles.statNumber}>
              {new Date(group.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Created</ThemedText>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <ThemedText style={styles.descriptionText}>{group.description}</ThemedText>
        </View>

        {/* Location */}
        {group.location && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Location</ThemedText>
            <View style={styles.locationContainer}>
              <FontAwesome5 name="map-marker-alt" size={16} color="rgba(255, 255, 255, 0.8)" />
              <ThemedText style={styles.locationText}>{group.location}</ThemedText>
            </View>
          </View>
        )}

        {/* Creator Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Created By</ThemedText>
          <View style={styles.creatorContainer}>
            <View style={styles.creatorAvatar}>
              <ThemedText style={styles.creatorInitial}>
                {group.createdBy.fullName?.charAt(0).toUpperCase() || 'U'}
              </ThemedText>
            </View>
            <ThemedText style={styles.creatorName}>
              {group.createdBy.fullName || 'Unknown User'}
            </ThemedText>
            {isCreator && (
              <View style={styles.youBadge}>
                <ThemedText style={styles.youBadgeText}>You</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Tags */}
        {group.tags && group.tags.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
            <View style={styles.tagsContainer}>
              {group.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>#{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Members Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Members ({group.memberIds?.length || 0}/{group.maxMembers})
          </ThemedText>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.membersList}>
              {group.memberIds?.slice(0, 10).map((member: any, index) => (
                <View key={index} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <ThemedText style={styles.memberInitial}>
                      {member.fullName?.charAt(0).toUpperCase() || 'U'}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.memberName} numberOfLines={1}>
                    {member.fullName || 'User'}
                    {member._id === userId && ' (You)'}
                  </ThemedText>
                </View>
              ))}
              {(group.memberIds?.length || 0) > 10 && (
                <View style={styles.moreMembersItem}>
                  <ThemedText style={styles.moreMembersText}>
                    +{(group.memberIds?.length || 0) - 10}
                  </ThemedText>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('DiscussionsList', { groupId: group._id })}
          >
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.actionButtonGradient}
            >
              <MaterialIcons name="forum" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>View Discussions</ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          {isMember && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('CreateDiscussion', { groupId: group._id })}
            >
              <LinearGradient
                colors={['#9b59b6', '#8e44ad']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="add-comment" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Start Discussion</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Join/Leave Button */}
        {!isCreator && (
          <TouchableOpacity 
            style={[styles.joinLeaveButton, isMember && styles.leaveButton]}
            onPress={isMember ? leaveGroup : joinGroup}
          >
            <LinearGradient
              colors={isMember ? ['#e74c3c', '#c0392b'] : ['#2ecc71', '#27ae60']}
              style={styles.joinLeaveButtonGradient}
            >
              <MaterialIcons 
                name={isMember ? "group-remove" : "group-add"} 
                size={20} 
                color="#fff" 
              />
              <ThemedText style={styles.joinLeaveButtonText}>
                {isMember ? 'Leave Group' : 'Join Group'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  groupHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  groupIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  privateBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  locationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 10,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  creatorName: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  youBadge: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  youBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  membersList: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  memberItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 60,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  moreMembersItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  moreMembersText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  actionsSection: {
    gap: 15,
    marginBottom: 25,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  joinLeaveButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leaveButton: {},
  joinLeaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  joinLeaveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

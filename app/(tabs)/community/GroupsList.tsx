import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
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
  createdBy: {
    _id: string;
    fullName: string;
    profilePhoto?: string;
  };
  memberIds: any[];
  created_at: string;
}


export default function GroupsList({ navigation }: { navigation: any }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  useEffect(() => {
    filterGroups();
  }, [groups, searchQuery]);

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

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      const groupsData = response.data || [];
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = () => {
    let filtered = [...groups];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by member count (most popular first)
    filtered.sort((a, b) => (b.memberIds?.length || 0) - (a.memberIds?.length || 0));

    setFilteredGroups(filtered);
  };

  const joinGroup = async (groupId: string) => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to join groups');
      return;
    }

    try {
      const response = await api.post(`/groups/${groupId}/join`, { userId });
      
      // Update local state
      setGroups(groups.map(group => 
        group._id === groupId ? response.data.group : group
      ));
      
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

  const leaveGroup = async (groupId: string) => {
    if (!userId) return;

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
              
              // Update local state
              setGroups(groups.map(group => 
                group._id === groupId ? response.data.group : group
              ));
              
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const isUserMember = (group: Group) => {
    return group.memberIds?.some(member => 
      (typeof member === 'string' ? member : member._id) === userId
    ) || false;
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Community Groups</ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="rgba(255, 255, 255, 0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>


      {/* Groups List */}
      <ScrollView
        style={styles.groupsList}
        contentContainerStyle={styles.groupsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ThemedText style={styles.loadingText}>Loading groups...</ThemedText>
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="users-slash" size={64} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>No groups found</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a group!'}
            </ThemedText>
            <TouchableOpacity 
              style={styles.createGroupButton}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <ThemedText style={styles.createGroupButtonText}>Create Group</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          filteredGroups.map((group) => {
            const isMember = isUserMember(group);
            const isCreator = group.createdBy._id === userId;
            
            return (
              <TouchableOpacity
                key={group._id}
                style={[styles.groupCard, isMember && styles.memberGroupCard]}
                onPress={() => navigation.navigate('GroupDetails', { groupId: group._id })}
                activeOpacity={0.8}
              >
                <View style={styles.groupHeader}>
                  <View style={styles.groupIcon}>
                    <FontAwesome5 
                      name="users" 
                      size={20} 
                      color="#667eea" 
                    />
                  </View>
                  <View style={styles.groupInfo}>
                    <ThemedText style={styles.groupTitle} numberOfLines={2}>
                      {group.name}
                    </ThemedText>
                    <View style={styles.groupMeta}>
                      <ThemedText style={styles.groupCategory}>
                        Community Group
                      </ThemedText>
                    </View>
                  </View>
                  {isMember && (
                    <View style={styles.memberBadge}>
                      <FontAwesome5 name="check" size={12} color="#fff" />
                    </View>
                  )}
                </View>

                {group.description && (
                  <ThemedText style={styles.groupDescription} numberOfLines={2}>
                    {group.description}
                  </ThemedText>
                )}

                <View style={styles.groupFooter}>
                  <View style={styles.groupStats}>
                    <View style={styles.statItem}>
                      <FontAwesome5 name="users" size={14} color="rgba(255, 255, 255, 0.7)" />
                      <ThemedText style={styles.statText}>
                        {group.memberIds?.length || 0} members
                      </ThemedText>
                    </View>
                  </View>

                  {!isCreator && (
                    <TouchableOpacity
                      style={[styles.joinButton, isMember && styles.leaveButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        isMember ? leaveGroup(group._id) : joinGroup(group._id);
                      }}
                    >
                      <ThemedText style={styles.joinButtonText}>
                        {isMember ? 'Leave' : 'Join'}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  {isCreator && (
                    <View style={styles.creatorBadge}>
                      <ThemedText style={styles.creatorBadgeText}>Creator</ThemedText>
                    </View>
                  )}
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
  container: {
    flex: 1,
  },
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtersRow: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  groupsList: {
    flex: 1,
  },
  groupsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyStateSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  createGroupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  createGroupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  groupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  memberGroupCard: {
    borderLeftColor: '#2ecc71',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupCategory: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  privateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  memberBadge: {
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupStats: {
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  joinButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  creatorBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  creatorBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginTop: 5,
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  moreTagsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 5,
  },
});

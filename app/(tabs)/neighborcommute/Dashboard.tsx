import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Text, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardStats {
  totalRides: number;
  offeredRides: number;
  joinedRides: number;
  completedRides: number;
}

export default function NeighborCommuteDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRides: 0,
    offeredRides: 0,
    joinedRides: 0,
    completedRides: 0
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDashboardStats();
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

  const fetchDashboardStats = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard stats for user:', userId);
      
      // Use the correct endpoint with userId parameter
      const response = await api.get(`/rides/my-rides?userId=${userId}`);
      console.log('API Response:', response);
      
      if (response && typeof response === 'object') {
        const { offered = [], joined = [] } = response;
        
        console.log('Offered rides:', offered.length);
        console.log('Joined rides:', joined.length);
        
        // Calculate completed rides
        const completedOffered = offered.filter((ride: any) => ride.status === 'completed').length;
        const completedJoined = joined.filter((ride: any) => ride.status === 'completed').length;
        
        const newStats = {
          totalRides: offered.length + joined.length,
          offeredRides: offered.length,
          joinedRides: joined.length,
          completedRides: completedOffered + completedJoined
        };
        
        console.log('Calculated stats:', newStats);
        setStats(newStats);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      
      // Fallback: try to get all rides and filter
      try {
        console.log('Trying fallback with all rides...');
        const fallbackResponse = await api.get('/rides');
        
        if (fallbackResponse && Array.isArray(fallbackResponse)) {
          const allRides = fallbackResponse;
          
          const offered = allRides.filter((ride: any) => {
            const driverId = ride.driverId?._id || ride.driverId;
            return driverId === userId;
          });
          
          const joined = allRides.filter((ride: any) => {
            const passengers = ride.passengerIds || [];
            return passengers.some((passenger: any) => {
              const passengerId = passenger._id || passenger.userId?._id || passenger.userId || passenger;
              return passengerId === userId;
            });
          });
          
          const completedOffered = offered.filter((ride: any) => ride.status === 'completed').length;
          const completedJoined = joined.filter((ride: any) => ride.status === 'completed').length;
          
          setStats({
            totalRides: offered.length + joined.length,
            offeredRides: offered.length,
            joinedRides: joined.length,
            completedRides: completedOffered + completedJoined
          });
          
          console.log('Fallback stats calculated successfully');
        } else {
          throw new Error('Fallback also failed');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        
        // Set default stats on complete failure
        setStats({
          totalRides: 0,
          offeredRides: 0,
          joinedRides: 0,
          completedRides: 0
        });
        
        Alert.alert(
          'Unable to Load Stats',
          'We couldn\'t load your ride statistics. Please check your connection and try again.',
          [
            { text: 'Retry', onPress: fetchDashboardStats },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    color, 
    iconName 
  }: { 
    icon: string; 
    title: string; 
    value: number; 
    color: string; 
    iconName: any; 
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <MaterialIcons name={iconName} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Neighbor Commute</Text>
          <Text style={styles.subtitle}>Share rides, save money, help environment</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                icon="directions-car"
                iconName="directions-car"
                title="Total Rides"
                value={stats.totalRides}
                color="#4b32c3"
              />
              <StatCard
                icon="add-circle"
                iconName="add-circle"
                title="Offered"
                value={stats.offeredRides}
                color="#3ad29f"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon="group"
                iconName="group"
                title="Joined"
                value={stats.joinedRides}
                color="#3a8fd2"
              />
              <StatCard
                icon="check-circle"
                iconName="check-circle"
                title="Completed"
                value={stats.completedRides}
                color="#ff6b6b"
              />
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.primaryCard]} 
            onPress={() => router.push('/(tabs)/neighborcommute/RideDiscovery')}
          >
            <LinearGradient
              colors={["#4facfe", "#00f2fe"]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="search" size={32} color="#fff" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Find a Ride</Text>
                <Text style={styles.actionDescription}>
                  Discover available rides from your neighbors
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.secondaryCard]} 
            onPress={() => router.push('/(tabs)/neighborcommute/RideOffer')}
          >
            <LinearGradient
              colors={["#a8edea", "#fed6e3"]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.actionIcon}>
                <FontAwesome5 name="plus" size={28} color="#4b32c3" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: '#4b32c3' }]}>Offer a Ride</Text>
                <Text style={[styles.actionDescription, { color: '#666' }]}>
                  Share your journey and help neighbors
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#4b32c3" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.tertiaryCard]} 
            onPress={() => router.push('/(tabs)/neighborcommute/MyRides')}
          >
            <LinearGradient
              colors={["#ffecd2", "#fcb69f"]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="history" size={32} color="#d63384" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: '#d63384' }]}>My Rides</Text>
                <Text style={[styles.actionDescription, { color: '#666' }]}>
                  View and manage your ride history
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#d63384" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Always verify pickup locations clearly</Text>
            <Text style={styles.tipItem}>• Be punctual for better community ratings</Text>
            <Text style={styles.tipItem}>• Share contact info only through the app</Text>
            <Text style={styles.tipItem}>• Rate your ride experience to help others</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { 
    flexGrow: 1, 
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235b',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  actionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryCard: {},
  secondaryCard: {},
  tertiaryCard: {},
  actionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
});
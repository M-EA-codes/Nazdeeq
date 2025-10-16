import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, // Make sure we're importing Text from react-native
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Dimensions,
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalServices: number;
  activeServices: number;
  totalProviders: number;
  totalBookings: number;
}

export default function NeighborWorksDashboard({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
    activeServices: 0,
    totalProviders: 0,
    totalBookings: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch dashboard statistics with proper error handling
      const [servicesRes, bookingsRes] = await Promise.all([
        api.get('/services/stats').catch(() => ({ data: { totalServices: 0, activeServices: 0 } })),
        api.get('/service-requests/stats').catch(() => ({ data: { totalRequests: 0 } }))
      ]);

      setStats({
        totalServices: servicesRes.data?.totalServices || 0,
        activeServices: servicesRes.data?.activeServices || 0,
        totalProviders: 15, // Mock data
        totalBookings: bookingsRes.data?.totalRequests || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values on error
      setStats({
        totalServices: 0,
        activeServices: 0,
        totalProviders: 0,
        totalBookings: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ComponentProps<typeof MaterialIcons>['name']; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialIcons name={icon} size={24} color={color} style={styles.statIcon} />
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
          <Text style={styles.title}>NeighborWorks</Text>
          <Text style={styles.subtitle}>Connect • Serve • Thrive in Your Community</Text>
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
                title="Active Services"
                value={stats.activeServices}
                icon="build"
                color="#4b32c3"
              />
              <StatCard
                title="Total Bookings"
                value={stats.totalBookings}
                icon="event"
                color="#3ad29f"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Service Providers"
                value={stats.totalProviders}
                icon="people"
                color="#3a8fd2"
              />
              <StatCard
                title="All Services"
                value={stats.totalServices}
                icon="work"
                color="#ffd93d"
              />
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ServiceList')}
          >
            <LinearGradient
              colors={["#4b32c3", "#7f53ac"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="search" size={32} color="#fff" />
              <Text style={styles.actionTitle}>Find Services</Text>
              <Text style={styles.actionSubtitle}>
                Browse and book trusted local service providers in your neighborhood
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ServiceProviderDashboard')}
          >
            <LinearGradient
              colors={["#3ad29f", "#2ecc71"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="build" size={32} color="#fff" />
              <Text style={styles.actionTitle}>Become a Provider</Text>
              <Text style={styles.actionSubtitle}>
                Offer your skills and services to help your neighbors
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Access Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Popular Services</Text>
          
          <View style={styles.featuresGrid}>
            {[
              { name: 'Plumbing', icon: 'build' as const, color: '#3a8fd2' },
              { name: 'Cleaning', icon: 'cleaning-services' as const, color: '#3ad29f' },
              { name: 'Gardening', icon: 'local-florist' as const, color: '#4caf50' },
              { name: 'Electrical', icon: 'electrical-services' as const, color: '#ffd93d' },
            ].map((feature, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.featureCard}
                onPress={() => navigation.navigate('ServiceList', { category: feature.name.toLowerCase() })}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <MaterialIcons name={feature.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.featureName}>{feature.name}</Text>
              </TouchableOpacity>
            ))}
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
  actionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 56) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
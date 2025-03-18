import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function CommunityScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Community</ThemedText>
          <ThemedText style={styles.subtitle}>Connect with your neighbors</ThemedText>
        </View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Nearby Events</ThemedText>
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>No Events</ThemedText>
            <ThemedText>There are no upcoming events in your area.</ThemedText>
          </View>
        </View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Community Groups</ThemedText>
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>No Groups</ThemedText>
            <ThemedText>No community groups available in your area yet.</ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
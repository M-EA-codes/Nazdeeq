import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <IconSymbol name="house.fill" size={80} color="#fff" />
        <ThemedText style={styles.appName}>Nazdeeq</ThemedText>
      </View>

      <View style={styles.contentContainer}>
        <ThemedText style={styles.tagline}>
          Connecting Neighbors,{"\n"}Strengthening Communities
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Link href="/(auth)/auth" asChild>
            <TouchableOpacity style={styles.button}>
              <ThemedText style={styles.buttonText}>Get Started</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height * 0.1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  contentContainer: {
    alignItems: 'center',
    width: width * 0.8,
  },
  tagline: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: height * 0.05,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4c669f',
  },
});

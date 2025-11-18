import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';

const LandingScreen = ({ navigation }) => {

  const handleStartFilming = () => {
    navigation.navigate('PlayerSelection');
  };

  // const handleBasicAnalysis = () => {
  //   navigation.navigate('Main');
  // };

  const handleAutoComparison = () => {
    navigation.navigate('Main', { autoCompare: true });
  };

  const handleFAQ = () => {
    navigation.navigate('FAQ');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo or Banner */}
      <Image
        source={require('../assets/landing.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>AI Basketball Shooting Coach</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Analyze your basketball shooting form with real-time feedback.
      </Text>

      {/* Auto Comparison */}
      <View style={{ width: '100%', alignItems: 'center', position: 'relative' }}>
        <TouchableOpacity style={styles.autoButton} onPress={handleAutoComparison}>
          <View style={styles.betaTagContainer}>
            <Text style={styles.betaTag}>BETA</Text>
          </View>
          <Text style={styles.autoButtonText}>AutoFind the Matched Player</Text>
        </TouchableOpacity>
      </View>

      {/* Start Filming Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartFilming}>
        <Text style={styles.startButtonText}>Compare with NBA Players</Text>
      </TouchableOpacity>
{/* 
      Basic Analysis Button
      <TouchableOpacity style={styles.basicButton} onPress={handleBasicAnalysis}>
        <Text style={styles.basicButtonText}>Basic Analysis</Text>
      </TouchableOpacity> */}

      {/* FAQ Button */}
      <TouchableOpacity style={styles.faqButton} onPress={handleFAQ}>
        <Text style={styles.faqButtonText}>FAQ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  betaTagContainer: {
    position: 'absolute',
    top: -10,
    right: 10,
    zIndex: 2,
  },
  betaTag: {
    backgroundColor: '#FF6F61',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    letterSpacing: 1,
    elevation: 2,
  },
  autoButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 0,
    position: 'relative',
  },
  autoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  basicButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    marginTop: 15,
    alignItems: 'center',
  },
  basicButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  faqButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  faqButtonText: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '600',
  },
});

export default LandingScreen;
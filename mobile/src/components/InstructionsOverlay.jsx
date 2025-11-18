import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  ScrollView 
} from 'react-native';

const InstructionsOverlay = ({ visible, fadeAnim, pulseAnim, onDismiss }) => {
  if (!visible) return null;

  return (
    <Animated.View style={[styles.instructionsOverlay, { opacity: fadeAnim }]}>
      <View style={styles.glassContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.instructionsTitle}>Recording Tips</Text>
        </View>
        
        <Text style={styles.instructionsSubtitle}>
          Follow these guidelines for best results
        </Text>

        {/* Make this scrollable */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.instructionsList}
        >
          <View style={styles.instructionItem}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>1</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>Side View Position</Text>
              <Text style={styles.instructionText}>
                Stand perpendicular to the camera
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>2</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>Ball Visibility</Text>
              <Text style={styles.instructionText}>
                Keep basketball in frame at all times
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>3</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>Proper Distance</Text>
              <Text style={styles.instructionText}>
                Stand 10-15 feet away from camera
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>4</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>Full Body Frame</Text>
              <Text style={styles.instructionText}>
                Ensure entire body is visible
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>5</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>Good Lighting</Text>
              <Text style={styles.instructionText}>
                Avoid shadows and backlighting
              </Text>
            </View>
          </View>

          {/* Add more instructions if needed */}
          <View style={styles.instructionItem}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>6</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>Stable Camera</Text>
              <Text style={styles.instructionText}>
                Use a tripod or stable surface to avoid shaky footage
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>7</Text>
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>Clear Background</Text>
              <Text style={styles.instructionText}>
                Ensure minimal background distractions for better tracking
              </Text>
            </View>
          </View>
        </ScrollView>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>Got it! Let's Start</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  instructionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 10,
  },
  glassContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 24,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.4)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    maxWidth: 400,
    maxHeight: '80%', // Limit height to allow scrolling
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionsSubtitle: {
    fontSize: 15,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  scrollView: {
    maxHeight: 400, // Set max height for scrollable area
  },
  instructionsList: {
    paddingBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  numberCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  instructionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  instructionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 19,
  },
  dismissButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 16,
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default InstructionsOverlay;
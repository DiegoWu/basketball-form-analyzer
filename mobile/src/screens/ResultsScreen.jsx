import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { CONFIG, getSimilarityColor, getSimilarityLabel } from '../utils/config';
import DetailedAnalysisScreen from './DetailedAnalysisScreen';
const { width, height } = Dimensions.get('window');
import { initializeTtsListeners, playTTS } from '../utils/ttsListener';

import axios from 'axios';

const sendTwilioMessage = async (body, to) => {
  try {
    const response = await axios.post(`${CONFIG.BACKEND.BASE_URL}/send-sms`, { body, to });
    return response.data;
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

const ResultsScreen = ({ navigation, route }) => {
  const { analysisResult, selectedPlayer } = route.params || {};
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [currentImagePath, setCurrentImagePath] = useState('');
  const [screenDimensions, setScreenDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  });

  const [smsStatus, setSmsStatus] = useState(null);

  const handleSendSms = async () => {
    const result = await sendTwilioMessage(
      "Your analysis is ready!",
      "+18777804236"
    );
    setSmsStatus(result);
  };

  // Check if shooting form was detected
  const isFormDetected = () => {
    if (!analysisResult) return false;
    
    // Check for error messages
    if (analysisResult.error || analysisResult.status === 'error') {
      return false;
    }
    
    // Check if comparison result exists
    if (!analysisResult.comparison_result) {
      return false;
    }
    
    // Check if DTW analysis exists and has valid data
    const dtwAnalysis = analysisResult.comparison_result?.dtw_analysis;
    if (!dtwAnalysis || !dtwAnalysis.overall_similarity) {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    initializeTtsListeners();
    
    if (isFormDetected()) {
      handleSendSms();
      setTimeout(() => {
        playTTS(analysisResult?.llm_response); 
      }, 3000);
    }
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({
        width: window.width,
        height: window.height
      });
    });
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [analysisResult]);

  const renderPhaseScore = (phase, score) => {
    const color = getSimilarityColor(score);
    const label = getSimilarityLabel(score);
    
    return (
      <View key={phase} style={styles.phaseScoreContainer}>
        <View style={styles.phaseHeader}>
          <Text style={styles.phaseName}>{phase}</Text>
          <Text style={[styles.phaseScore, { color }]}>
            {(score * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${score * 100}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.phaseLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderOverallScore = () => {
    const overallScore = analysisResult?.comparison_result?.dtw_analysis?.overall_similarity || 0;
    const color = getSimilarityColor(overallScore);
    const label = getSimilarityLabel(overallScore);
    
    return (
      <View style={styles.overallScoreContainer}>
        <Text style={styles.overallScoreTitle}>Overall Similarity</Text>
        <View style={styles.overallScoreCircle}>
          <Text style={[styles.overallScoreText, { color }]}>
            {(overallScore).toFixed(0)}%
          </Text>
        </View>
        <Text style={[styles.overallScoreLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderPlayerComparison = () => {
    if (!selectedPlayer) return null;
    
    return (
      <View style={styles.playerComparisonContainer}>
        <Text style={styles.playerComparisonTitle}>
          Comparison with {selectedPlayer.name}
        </Text>
        <View style={styles.playerInfoRow}>
          <Text style={styles.playerInfoLabel}>Style:</Text>
          <Text style={styles.playerInfoValue}>{selectedPlayer.description}</Text>
        </View>
        <View style={styles.playerInfoRow}>
          <Text style={styles.playerInfoLabel}>Characteristics:</Text>
          <Text style={styles.playerInfoValue}>
            {selectedPlayer.characteristics.join(', ')}
          </Text>
        </View>
      </View>
    );
  };

  const renderPhaseBreakdown = () => {
    const phaseScores = analysisResult?.comparison_result?.dtw_analysis?.phase_similarities || {};
  
    return (
      <View style={styles.phaseBreakdownContainer}>
        <Text style={styles.phaseBreakdownTitle}>Phase-by-Phase Analysis</Text>
        {Object.entries(phaseScores).map(([phase, data]) => {
          const score = (data.similarity ?? 50) / 100;
          return (
            <View key={phase} style={styles.phaseScoreContainer}>
              {renderPhaseScore(phase, score)}
            </View>
          );
        })}
      </View>
    );
  };

  const openImageViewer = (imagePath) => {
    setCurrentImagePath(imagePath);
    setIsImageModalVisible(true);
  };

  // Render error state when shooting form is not detected
  const renderErrorState = () => {
    const errorMessage = analysisResult?.error || analysisResult?.message || "Shooting form not detected";
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.errorScrollContent}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            
            <Text style={styles.errorTitle}>Shooting Form Not Detected</Text>
            
            <Text style={styles.errorMessage}>
              {errorMessage}
            </Text>
            
            <View style={styles.errorTipsContainer}>
              <Text style={styles.errorTipsTitle}>Tips for better detection:</Text>
              
              <View style={styles.errorTipItem}>
                <Text style={styles.errorTipBullet}>•</Text>
                <Text style={styles.errorTipText}>
                  Ensure you're in <Text style={styles.errorTipHighlight}>side view</Text> to the camera
                </Text>
              </View>
              
              <View style={styles.errorTipItem}>
                <Text style={styles.errorTipBullet}>•</Text>
                <Text style={styles.errorTipText}>
                  Keep your <Text style={styles.errorTipHighlight}>full body visible</Text> in frame
                </Text>
              </View>
              
              <View style={styles.errorTipItem}>
                <Text style={styles.errorTipBullet}>•</Text>
                <Text style={styles.errorTipText}>
                  Make sure the <Text style={styles.errorTipHighlight}>basketball is visible</Text>
                </Text>
              </View>
              
              <View style={styles.errorTipItem}>
                <Text style={styles.errorTipBullet}>•</Text>
                <Text style={styles.errorTipText}>
                  Use <Text style={styles.errorTipHighlight}>good lighting</Text> without shadows
                </Text>
              </View>
              
              <View style={styles.errorTipItem}>
                <Text style={styles.errorTipBullet}>•</Text>
                <Text style={styles.errorTipText}>
                  Stand <Text style={styles.errorTipHighlight}>10-15 feet away</Text> from camera
                </Text>
              </View>
            </View>

            <View style={styles.errorActionsContainer}>
              <TouchableOpacity
                style={styles.errorPrimaryButton}
                onPress={() => navigation.navigate('Main')}
              >
                <Text style={styles.errorPrimaryButtonText}>Try Recording Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.errorSecondaryButton}
                onPress={() => navigation.navigate('FAQ')}
              >
                <Text style={styles.errorSecondaryButtonText}>View FAQ for Help</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.errorTertiaryButton}
                onPress={() => navigation.navigate('Landing')}
              >
                <Text style={styles.errorTertiaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Check if form was detected, if not show error state
  if (!isFormDetected()) {
    return renderErrorState();
  }
    
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Results</Text>
          {selectedPlayer && (
            <Text style={styles.subtitle}>
              Your shot compared to {selectedPlayer.name}'s style
            </Text>
          )}
        </View>

        {renderOverallScore()}
        {renderPlayerComparison()}
        {renderPhaseBreakdown()}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openImageViewer(analysisResult?.image_path)}
          >
            <Text style={styles.actionButtonText}>View Shot Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsDetailModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>View Detailed Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PlayerSelection')}
          >
            <Text style={styles.actionButtonText}>Try Another Player</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Main', { autoCompare: true })}
          >
            <Text style={styles.actionButtonText}>New Auto Select</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.secondaryButtonText}>Record New Shot</Text>
          </TouchableOpacity>
          
          {smsStatus && (
            <View style={{ margin: 20, padding: 10, backgroundColor: '#222', borderRadius: 8 }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {smsStatus.status === 'sent'
                  ? `SMS sent to ${smsStatus.to}: "${smsStatus.body}"`
                  : `SMS error: ${smsStatus.error || 'Unknown error'}`}
              </Text>
              {smsStatus.sid && (
                <Text style={{ color: '#888', fontSize: 12 }}>SID: {smsStatus.sid}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Detail Screen Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDetailModalVisible}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detailed Analysis</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsDetailModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <DetailedAnalysisScreen
              detailedResult={analysisResult} 
              selectedPlayer={selectedPlayer}
            />
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={() => setIsImageModalVisible(false)}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.imageModalContent, 
            {
              width: screenDimensions.width * 0.95,
              height: screenDimensions.height * 0.85
            }
          ]}>
            <View style={styles.compactModalHeader}>
              <Text style={styles.compactModalTitle}>Pinch to zoom, drag to move</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsImageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.imageScrollContainer}
              contentContainerStyle={styles.imageContentContainer}
              maximumZoomScale={5}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              pinchGestureEnabled={true}
              scrollEnabled={true}
            >
              {currentImagePath ? (
                <Image
                  source={{ uri: `${CONFIG.BACKEND.BASE_URL}${currentImagePath}` }}
                  style={styles.zoomableImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.noImageText}>No image to display</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  errorScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorIcon: {
    fontSize: 64,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  errorTipsContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    width: '100%',
  },
  errorTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 16,
  },
  errorTipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  errorTipBullet: {
    fontSize: 20,
    color: '#4ECDC4',
    marginRight: 12,
    marginTop: -2,
  },
  errorTipText: {
    fontSize: 15,
    color: '#CCCCCC',
    flex: 1,
    lineHeight: 22,
  },
  errorTipHighlight: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  errorActionsContainer: {
    width: '100%',
    gap: 12,
  },
  errorPrimaryButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  errorSecondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  errorSecondaryButtonText: {
    color: '#4ECDC4',
    fontSize: 17,
    fontWeight: '600',
  },
  errorTertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorTertiaryButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  overallScoreContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  overallScoreTitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 16,
  },
  overallScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#333',
    marginBottom: 12,
  },
  overallScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  overallScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  playerComparisonContainer: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  playerComparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  playerInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  playerInfoLabel: {
    fontSize: 14,
    color: '#888',
    width: 100,
  },
  playerInfoValue: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  phaseBreakdownContainer: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  phaseBreakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  phaseScoreContainer: {
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  phaseScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  compactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  compactModalTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  imageScrollContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableImage: {
    width: width * 0.95,
    height: height * 0.8,
    resizeMode: 'contain',
  },
  noImageText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ResultsScreen;
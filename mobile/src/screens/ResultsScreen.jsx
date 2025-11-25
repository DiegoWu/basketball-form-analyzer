import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { CONFIG, getSimilarityColor, getSimilarityLabel } from '../utils/config';
import DetailedAnalysisScreen from './DetailedAnalysisScreen';
const { width, height } = Dimensions.get('window');
import { initializeTtsListeners, playTTS } from '../utils/ttsListener';
import Video from 'react-native-video';

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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'image', 'analysis', 'replay'
  const [screenDimensions, setScreenDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  });

  const [smsStatus, setSmsStatus] = useState(null);
  const [selectedChart, setSelectedChart] = useState('ball_trajectory');
  const [fullScreenImage, setFullScreenImage] = useState(null);
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
    
    if (analysisResult.error || analysisResult.status === 'error') {
      return false;
    }
    
    if (!analysisResult.comparison_result) {
      return false;
    }
    
    const dtwAnalysis = analysisResult.comparison_result?.dtw_analysis;
    if (!dtwAnalysis || !dtwAnalysis.overall_similarity) {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    initializeTtsListeners();
    
    if (isFormDetected()) {
      // handleSendSms();
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
    // console.log("route.params", route.params)

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

  const renderTabBar = () => {
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'image', label: 'Shot Image' },
      { id: 'analysis', label: 'Analysis' },
      { id: 'replay', label: 'Replay' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };


  const renderOverviewTab = () => {
    return (
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
    );
  };


  const renderImageTab = () => {
    const plots = analysisResult?.plots || {};
    
    // Available charts with their data
    const charts = [
      { 
        key: 'ball_trajectory', 
        label: 'Ball Trajectory',
        url: plots.ball_trajectory,
        description: 'Compare your ball release path with the pro'
      },
      { 
        key: 'wrist_trajectory', 
        label: 'Wrist Trajectory',
        url: plots.wrist_trajectory,
        description: 'Analyze your wrist movement during the shot'
      },
      { 
        key: 'elbow_angle', 
        label: 'Elbow Angle',
        url: plots.elbow_angle,
        description: 'Check your elbow positioning and angle'
      },
      { 
        key: 'hip_stability', 
        label: 'Hip Stability',
        url: plots.hip_stability,
        description: 'Evaluate your lower body stability'
      },
    ].filter(chart => chart.url); // Only show available charts

    if (charts.length === 0) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.noImageText}>No charts available</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Vertical Scrollable Gallery */}
        <ScrollView
          style={styles.verticalGallery}
          contentContainerStyle={styles.verticalGalleryContent}
          showsVerticalScrollIndicator={false}
        >
          {charts.map((chart, index) => (
            <TouchableOpacity
              key={chart.key}
              style={styles.chartCard}
              activeOpacity={0.8}
              onPress={() => setFullScreenImage(chart)}
            >
              {/* Chart Header */}
              <View style={styles.chartCardHeader}>
                <Text style={styles.chartCardTitle}>{chart.label}</Text>
                <Text style={styles.chartCardSubtitle}>{chart.description}</Text>
              </View>
              
              {/* Chart Image */}
              <View style={styles.chartImageContainer}>
                <Image
                  source={{ uri: chart.url }}
                  style={styles.chartCardImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error(`Failed to load ${chart.label}:`, error.nativeEvent.error);
                  }}
                />
                {/* Tap to Expand Overlay */}
                <View style={styles.expandOverlay}>
                  <Text style={styles.expandText}>Tap to expand</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Full-Screen Modal */}
        <Modal
          visible={!!fullScreenImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullScreenImage(null)}
        >
          <View style={styles.fullScreenModal}>
            {/* Header with Close Button */}
            <View style={styles.fullScreenModalHeader}>
              {fullScreenImage && (
                <View style={styles.fullScreenTitleContainer}>
                  <Text style={styles.fullScreenTitle}>
                    {fullScreenImage.label}
                  </Text>
                  <Text style={styles.fullScreenSubtitle}>
                    {fullScreenImage.description}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFullScreenImage(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Zoomable Image */}
            <ScrollView
              maximumZoomScale={5}
              minimumZoomScale={1}
              contentContainerStyle={styles.fullScreenImageContainer}
              pinchGestureEnabled={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              {fullScreenImage && (
                <Image
                  source={{ uri: fullScreenImage.url }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </ScrollView>

            {/* Bottom Hint */}
            <View style={styles.fullScreenFooter}>
              <Text style={styles.fullScreenHint}>
                Pinch to zoom • Drag to pan
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderAnalysisTab = () => {
    return (
      <View style={styles.tabContent}>
        <DetailedAnalysisScreen
          detailedResult={analysisResult} 
          selectedPlayer={selectedPlayer}
        />
      </View>
    );
  };

  const renderReplayTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.replayContainer}>
          <Video
            // source={{ uri: `${CONFIG.BACKEND.BASE_URL}${analysisResult?.analyzed_video_path}` }}
            source={{ uri: `${analysisResult?.analyzed_video_path}` }}
            style={styles.replayVideo}
            controls={true}
            resizeMode="contain"
            paused={false}
            repeat={true}
          />
          <TouchableOpacity
            style={styles.fullScreenReplayButton}
            onPress={() => navigation.navigate('VideoReplay', {
              analyzedVideoPath: analysisResult?.analyzed_video_path,
              normalizedData: analysisResult?.normalized_data,
            })}
          >
            <Text style={styles.fullScreenReplayButtonText}>Open Full Screen Replay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'image':
        return renderImageTab();
      case 'analysis':
        return renderAnalysisTab();
      case 'replay':
        return renderReplayTab();
      default:
        return renderOverviewTab();
    }
  };

  if (!isFormDetected()) {
    return renderErrorState();
  }
    
  return (
    <SafeAreaView style={styles.container}>
      {renderTabBar()}
      {renderTabContent()}
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
  
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(78, 205, 196, 0.05)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  activeTabText: {
    color: '#4ECDC4',
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4ECDC4',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  
  tabContent: {
    flex: 1,
    backgroundColor: '#000',
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
  fullScreenImage: {
    width: width,
    height: height * 0.85,
  },
  noImageText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  imageHint: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  
  replayContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  replayVideo: {
    width: '100%',
    height: height * 0.6,
    backgroundColor: '#000',
  },
  fullScreenReplayButton: {
    margin: 20,
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fullScreenReplayButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Original styles
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
  chartSelector: {
    maxHeight: 50,
    marginBottom: 10,
  },
  chartButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chartButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chartButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  chartButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  imageHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  verticalGallery: {
    flex: 1,
    backgroundColor: '#000',
  },
  verticalGalleryContent: {
    padding: 16,
    paddingBottom: 32,
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  chartCardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  chartCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  chartCardSubtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  chartImageContainer: {
    position: 'relative',
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  chartCardImage: {
    width: '100%',
    height: 280,
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.5)',
  },
  expandText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '600',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 60, // Account for status bar
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fullScreenTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  fullScreenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  fullScreenSubtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  fullScreenImageContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.75,
  },
  fullScreenFooter: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  fullScreenHint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ResultsScreen;
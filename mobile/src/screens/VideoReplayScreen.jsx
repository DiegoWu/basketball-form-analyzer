import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import { CONFIG } from '../utils/config';

const { width, height } = Dimensions.get('window');

const VideoReplayScreen = ({ navigation, route }) => {
    const { analyzedVideoPath, normalizedData } = route.params || {};
    
    const videoRef = useRef(null);
    const [paused, setPaused] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showShotSelector, setShowShotSelector] = useState(false);
    const [selectedShotIndex, setSelectedShotIndex] = useState(0);
    const [selectedPhase, setSelectedPhase] = useState(null);
    const [totalFrames, setTotalFrames] = useState(0);
    const [videoFps, setVideoFps] = useState(29.952681388012618);
    
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const hideControlsTimer = useRef(null);
    
    const fps = videoFps;
  
    const getAllShots = () => {
        if (!normalizedData) return [];
        
        const shotsMap = new Map();
        
        normalizedData.forEach((frame) => {
          if (frame.shot !== null && frame.shot !== undefined) {
            const shotId = frame.shot;
            
            if (!shotsMap.has(shotId)) {
              shotsMap.set(shotId, {
                id: shotId,
                startFrame: frame.frame_index,
                endFrame: frame.frame_index,
                result: null, // Will be updated
                label: `Shot ${shotId}`
              });
            } else {
              const shot = shotsMap.get(shotId);
              shot.endFrame = Math.max(shot.endFrame, frame.frame_index);
            }
          }
        });
        
        return Array.from(shotsMap.values()).sort((a, b) => a.id - b.id);
      };
    
      const getPhaseFrames = () => {
        if (!normalizedData || !currentShot) return [];
        
        const shotData = normalizedData.filter(
          frame => frame.shot === currentShot.id
        );
        
        const phases = [];
        let currentPhaseName = null;
        let phaseStartFrame = null;
        
        shotData.forEach((frame, index) => {
          const actualFrameIndex = frame.frame_index;
            // Only track non-General phases
          if (frame.phase && frame.phase !== 'General') {
            if (frame.phase !== currentPhaseName) {
              // Save previous phase
              if (currentPhaseName && phaseStartFrame !== null) {
                const prevFrameIndex = index > 0 ? shotData[index - 1].frame_index : phaseStartFrame;

                phases.push({
                  phase: currentPhaseName,
                  startFrame: phaseStartFrame,
                  endFrame: prevFrameIndex
                });
              }
              
              // Start new phase
              currentPhaseName = frame.phase;
              phaseStartFrame = actualFrameIndex;
            }
          } else {
            // End current phase when hitting General
            if (currentPhaseName && phaseStartFrame !== null) {
              const prevFrameIndex = index > 0 ? shotData[index - 1].frame_index : phaseStartFrame;
              phases.push({
                phase: currentPhaseName,
                startFrame: phaseStartFrame + 1,
                endFrame: prevFrameIndex
              });
              currentPhaseName = null;
              phaseStartFrame = null;
            }
          }
        });
        
        // Close last phase at shot end
        if (currentPhaseName && phaseStartFrame !== null) {
          phases.push({
            phase: currentPhaseName,
            startFrame: phaseStartFrame,
            endFrame: currentShot.endFrame
          });
        }
        
        return phases;
      };
    
    const getCurrentFrameData = () => {
      if (!normalizedData) {
        return null;
      }
      return normalizedData.find(frame => frame.frame_index === currentFrame);
    };
  
    const shots = getAllShots();
    const currentShot = shots[selectedShotIndex] || shots[0];
  
    // ✅ Use actual video frame bounds, not normalized data bounds
    const getShotStartFrame = () => {
      return currentShot?.startFrame || 0;
    };
  
    const getShotEndFrame = () => {
      // ✅ Use actual video total frames, not normalized data length
      return currentShot?.endFrame || (totalFrames - 1);
    };
  
    const shotStartFrame = getShotStartFrame();
    const shotEndFrame = getShotEndFrame();
    
    const shotStartTime = shotStartFrame / fps;
    const shotEndTime = shotEndFrame / fps;
    
    // ✅ Allow video to play to actual end
    const clampedCurrentTime = Math.min(Math.max(currentTime, 0), duration);
  
    useEffect(() => {
      if (!isSeeking && duration > 0) {
        const frameNumber = Math.floor(currentTime * fps);
        setCurrentFrame(Math.min(frameNumber, totalFrames - 1));
        
        if (!selectedPhase) {
          const currentPhaseData = getCurrentFrameData();
          if (currentPhaseData?.phase && currentPhaseData.phase !== 'General') {
            setSelectedPhase(currentPhaseData.phase);
          }
        }
        
        // ✅ Auto-pause at actual video end
        if (currentTime >= duration - 0.1) {
          setPaused(true);
        }
      }
    }, [currentTime, duration, fps, totalFrames, isSeeking]);
  
    useEffect(() => {
      if (duration > 0 && shotStartFrame > 0) {
        const startTime = shotStartFrame / fps;
        videoRef.current?.seek(startTime);
        setCurrentTime(startTime);
        setCurrentFrame(shotStartFrame);
      }
    }, [duration, shotStartFrame, fps]);
  
    useEffect(() => {
      if (showControls && !paused) {
        hideControlsTimer.current = setTimeout(() => {
          hideControls();
        }, 3000);
      }
      
      return () => {
        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current);
        }
      };
    }, [showControls, paused]);
  
    const toggleControls = () => {
      if (showControls) {
        hideControls();
      } else {
        showControlsAnimated();
      }
    };
  
    const showControlsAnimated = () => {
      setShowControls(true);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
  
    const hideControls = () => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowControls(false);
      });
    };
  
    const handleLoad = (data) => {
      
      setDuration(data.duration);
      
      let detectedFps = 29.952681388012618;
      
      if (data.naturalSize?.frameRate) {
        detectedFps = data.naturalSize.frameRate;
        console.log('✅ Detected FPS from naturalSize:', detectedFps);
      } else if (data.videoTracks && data.videoTracks.length > 0) {
        detectedFps = data.videoTracks[0].nominalFrameRate || 30;
        console.log('✅ Detected FPS from videoTracks:', detectedFps);
      }
      
      setVideoFps(detectedFps);
      
      // ✅ Calculate total frames from actual video duration
      const calculatedTotalFrames = Math.floor(data.duration * detectedFps);
      setTotalFrames(calculatedTotalFrames);
      
      console.log('📊 Video info:', {
        duration: data.duration,
        fps: detectedFps,
        totalFrames: calculatedTotalFrames,
        normalizedDataFrames: normalizedData?.length,
        dataStartFrame: normalizedData?.[0]?.frame_index,
        dataEndFrame: normalizedData?.[normalizedData.length - 1]?.frame_index
      });
      
      setIsLoading(false);
    };
  
    const handleProgress = (data) => {
      if (!isSeeking) {
        const newTime = data.currentTime;
        
        // ✅ Allow full video playback
        if (newTime >= duration) {
          setCurrentTime(duration);
          setPaused(true);
        } else {
          setCurrentTime(newTime);
        }
      }
    };
  
    const handleVideoTap = () => {
      if (paused) {
        // ✅ If at end, restart from shot beginning
        if (currentTime >= duration - 0.1) {
          jumpToFrame(shotStartFrame);
          setPaused(false);
        } else {
          setPaused(false);
        }
      } else {
        setPaused(true);
      }
      showControlsAnimated();
    };
  
    const handleSliderChange = (value) => {
      setIsSeeking(true);
      // ✅ Allow scrubbing through entire video
      const clampedValue = Math.min(Math.max(value, 0), duration);
      setCurrentTime(clampedValue);
      const frameNumber = Math.floor(clampedValue * fps);
      setCurrentFrame(Math.min(frameNumber, totalFrames - 1));
      setSelectedPhase(null);
      
      videoRef.current?.seek(clampedValue);
    };
  
    const handleSliderComplete = (value) => {
      const clampedValue = Math.min(Math.max(value, 0), duration);
      setIsSeeking(false);
      videoRef.current?.seek(clampedValue);
      setCurrentTime(clampedValue);
    };
  
    const jumpToFrame = (frameIndex) => {
      const timeInSeconds = (frameIndex) / (fps - 1);
      console.log("[DEBUG]: jumptoframe")
      console.log(timeInSeconds)
      console.log(frameIndex)
      const clampedTime = timeInSeconds; 
    //   Math.min(Math.max(timeInSeconds, 0), duration);
      setCurrentTime(clampedTime);
      setCurrentFrame(frameIndex);
      videoRef.current?.seek(clampedTime);
    };
  
    const selectPhase = (phaseName, frameIndex) => {
      setSelectedPhase(phaseName);
      jumpToFrame(frameIndex);
    };
  
    const selectShot = (shotIndex) => {
      setSelectedShotIndex(shotIndex);
      setShowShotSelector(false);
      setSelectedPhase(null);
      const shot = shots[shotIndex];
      if (shot) {
        jumpToFrame(shot.startFrame);
        setPaused(true);
      }
    };
  
    const frameData = getCurrentFrameData();
  
    const getPhaseColor = (phase) => {
      const phaseColors = {
        'Set-up': '#FF6B6B',
        'Loading': '#FFA500',
        'Loading-Rising': '#FFD700',
        'Rising': '#FFD700',
        'Release': '#4ECDC4',
        'Follow-through': '#95E1D3',
      };
      return phaseColors[phase] || '#888888';
    };
  
    const getShotColor = (shot) => {
      if (shot === 1) return '#00FF00';
      if (shot === 0) return '#FF0000';
      return '#888888';
    };
  
    if (!analyzedVideoPath || !normalizedData) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No video data available</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
  
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.videoContainer}
          activeOpacity={1}
          onPress={handleVideoTap}
        >
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4ECDC4" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          
          <Video
            ref={videoRef}
            source={{ uri: `${CONFIG.BACKEND.BASE_URL}${analyzedVideoPath}` }}
            style={styles.video}
            paused={paused}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onEnd={() => {
              setPaused(true);
              setCurrentTime(duration);
            }}
            resizeMode="contain"
            repeat={false}
            progressUpdateInterval={16.67}
          />
  
          {showControls && (
            <Animated.View style={[styles.topOverlay, { opacity: controlsOpacity }]}>
              <SafeAreaView>
                <View style={styles.topControls}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.backButtonText}>✕</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.shotInfo}>
                    {currentShot && (
                      <Text style={styles.shotInfoText}>
                        {currentShot.label}
                      </Text>
                    )}
                  </View>
  
                  <View style={styles.topRightSpacer} />
                </View>
              </SafeAreaView>
            </Animated.View>
          )}
  
          {paused && (
            <View style={styles.centerPlayIcon}>
              <View style={styles.playIconCircle}>
                <Text style={styles.playIconText}>▶</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
  
        <View style={styles.bottomOverlay}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.phasePillsContainer}
            >
              {getPhaseFrames().map((phaseInfo, index) => {
                const isActive = selectedPhase === phaseInfo.phase;
                console.log("[DEBUG] phase info")
                console.log(phaseInfo)
                return (
                  <TouchableOpacity
                    key={`phase-${phaseInfo.phase}-${index}`}
                    style={[
                      styles.phasePill,
                      { 
                        backgroundColor: isActive 
                          ? getPhaseColor(phaseInfo.phase)
                          : 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 2,
                        borderColor: isActive ? getPhaseColor(phaseInfo.phase) : 'transparent',
                      }
                    ]}
                    onPress={() => selectPhase(phaseInfo.phase, phaseInfo.startFrame)}
                  >
                    <Text style={[
                      styles.phasePillText,
                      { 
                        color: isActive ? 'white' : '#CCCCCC',
                        fontWeight: isActive ? 'bold' : 'normal'
                      }
                    ]}>
                      {phaseInfo.phase}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
  
            <View style={styles.timelineRow}>
              {shots.length > 1 && (
                <TouchableOpacity
                  style={styles.shotSelectorButton}
                  onPress={() => setShowShotSelector(true)}
                >
                  <Text style={styles.shotSelectorButtonText}>
                    {currentShot?.label || 'Shot'}
                  </Text>
                  <Text style={styles.shotSelectorButtonIcon}>▼</Text>
                </TouchableOpacity>
              )}
  
              <View style={styles.timelineContainer}>
                <Slider
                  style={styles.slider}
                  value={clampedCurrentTime}
                  minimumValue={0}
                  maximumValue={duration}
                  minimumTrackTintColor="#4ECDC4"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="#4ECDC4"
                  onValueChange={handleSliderChange}
                  onSlidingComplete={handleSliderComplete}
                  step={1 / fps}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
  
        {/* Shot Selector Modal - same as before */}
        <Modal
          visible={showShotSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowShotSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowShotSelector(false)}
          >
            <View style={styles.shotSelectorContainer}>
              <View style={styles.shotSelectorHeader}>
                <Text style={styles.shotSelectorTitle}>Select Shot</Text>
                <TouchableOpacity onPress={() => setShowShotSelector(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                {shots.map((shot, index) => (
                  <TouchableOpacity
                    key={shot.id}
                    style={[
                      styles.shotOption,
                      selectedShotIndex === index && styles.shotOptionSelected
                    ]}
                    onPress={() => selectShot(index)}
                  >
                    <View style={styles.shotOptionContent}>
                      <Text style={styles.shotOptionLabel}>{shot.label}</Text>
                      <Text style={styles.shotOptionFrames}>
                        Frames {shot.startFrame + 1}-{shot.endFrame + 1}
                      </Text>
                    </View>
                    {shot.result !== null && (
                      <View style={[
                        styles.shotResultBadge,
                        { backgroundColor: getShotColor(shot.result) }
                      ]}>
                        <Text style={styles.shotResultText}>
                          {shot.result === 1 ? '✓' : '✗'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: '#4ECDC4',
    marginTop: 12,
    fontSize: 16,
  },
  
  // ✅ Center Play Icon
  centerPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 3,
  },
  playIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(78, 205, 196, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playIconText: {
    color: 'white',
    fontSize: 32,
    marginLeft: 4,
  },
  
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  shotInfo: {
    flex: 1,
    alignItems: 'center',
  },
  shotInfoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topRightSpacer: {
    width: 40,
  },
  
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: 12,
  },
  phasePillsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  phasePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  phasePillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // ✅ Timeline row - no play button
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  
  shotSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  shotSelectorButtonText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  shotSelectorButtonIcon: {
    color: '#4ECDC4',
    fontSize: 10,
  },
  
  timelineContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 20,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  shotSelectorContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.5,
  },
  shotSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  shotSelectorTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: '#4ECDC4',
    fontSize: 28,
    fontWeight: '300',
  },
  shotOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  shotOptionSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  shotOptionContent: {
    flex: 1,
  },
  shotOptionLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shotOptionFrames: {
    color: '#888',
    fontSize: 13,
  },
  shotResultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  shotResultText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default VideoReplayScreen;
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Dimensions, Pressable} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { CONFIG, getApiUrl } from '../utils/config';
import { launchImageLibrary } from 'react-native-image-picker';
import InstructionsOverlay from '../components/InstructionsOverlay';

const CameraScreen = ({navigation, route}) => {
  const [selectedPlayer, setSelectedPlayer] = useState(route.params?.selectedPlayer || null);
  const cameraRef = useRef(null);
  const [cameraPosition, setCameraPosition] = useState('back');
  const device = useCameraDevice(cameraPosition);

  // const [hasPermission, setHasPermission] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Zoom state
  const [zoom, setZoom] = useState(1);
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 10, 10); // Cap at 10x
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const [autoCompare, setAutoCompare] = useState(false);
  
  const [focusPoint, setFocusPoint] = useState(null);
  const focusAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (route?.params?.autoCompare === true) {
      setAutoCompare(true);
      console.log('AutoCompare enabled via route params');
    }
  }, [route?.params?.autoCompare]);
  
  // Auto-hide instructions after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowInstructions(false));
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  // Pulse animation for dismiss button
  useEffect(() => {
    if (showInstructions) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showInstructions]);

  useEffect(() => {
    const handleDimensionsChange = ({ window }) => {
      setScreenDimensions(window);
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionsChange);
    return () => subscription?.remove();
  }, []);

  const handleTapToFocus = async (event) => {
    if (!cameraRef.current || isRecording || processing) return;

    try {
      const { locationX, locationY } = event.nativeEvent;
      const { width, height } = screenDimensions;

      // Convert screen coordinates to normalized coordinates (0-1)
      const x = locationX / width;
      const y = locationY / height;

      // Focus the camera at the tapped point
      await cameraRef.current.focus({ x, y });

      // Show focus indicator animation
      setFocusPoint({ x: locationX, y: locationY });
      
      // Animate focus indicator
      focusAnimation.setValue(0);
      Animated.sequence([
        Animated.timing(focusAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(focusAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setFocusPoint(null));

      console.log(`Focused at: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
    } catch (error) {
      console.error('Focus error:', error);
    }
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const velocity = event.velocity / 20;
      const newZoom = Math.max(minZoom, Math.min(zoom + velocity, maxZoom));
      setZoom(newZoom);
    })
    .runOnJS(true);

  const toggleInstructions = () => {
    if (showInstructions) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowInstructions(false));
    } else {
      setShowInstructions(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
    setZoom(1); // Reset zoom when switching cameras
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, minZoom));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        if (showInstructions) {
          toggleInstructions();
        }
        
        setIsRecording(true);
        cameraRef.current.startRecording({
          onRecordingFinished: async (video) => {
            console.log('Recording finished:', video);
            setProcessing(true);
            setIsRecording(false);
            await uploadVideo(video.path);
            setProcessing(false);
          },
          onRecordingError: (error) => {
            console.error('Recording error:', error);
            setIsRecording(false);
          },
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      await cameraRef.current.stopRecording();
    }
  };

  const uploadVideo = async (videoPath) => {
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: videoPath.startsWith('file://') ? videoPath : `file://${videoPath}`,
        type: 'video/mp4',
        name: 'basketball_shot.mp4',
      });

      if (selectedPlayer) {
        formData.append('player_id', selectedPlayer.id);
        formData.append('player_style', selectedPlayer.style);
        console.log('Sending video to backend with player:', selectedPlayer.name);
      } else {
        console.log('Sending video to backend for basic analysis');
      }

      const endpoint = autoCompare 
        ? CONFIG.BACKEND.ENDPOINTS.AUTO_MATCH_WITH_PLAYER : selectedPlayer 
        ? CONFIG.BACKEND.ENDPOINTS.COMPARE_WITH_PLAYER
        : CONFIG.BACKEND.ENDPOINTS.AUTO_MATCH_WITH_PLAYER;

      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: CONFIG.BACKEND.TIMEOUT,
      });

      const result = await response.json();
  
      console.log('Upload successful:', result);
      
      navigation.navigate('Results', {
        analysisResult: result,
        selectedPlayer: result?.selectedPlayer,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload video.');
    }
  };

  const handleUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
      });

      if (result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        console.log('Selected video:', video.uri);
        setProcessing(true);
        await uploadVideo(video.uri);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Failed to upload video:', error);
      Alert.alert('Error', 'Failed to upload video.');
    }
  };

  const toggleFloatingMenu = () => {
    setShowFloatingMenu((prev) => !prev);
  };

  const floatingPosition = {
    x: 20,
    y: screenDimensions.height - 100, // Adjust to keep it above the bottom edge
  };

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Interaction-blocking overlay */}
      {processing && <View style={styles.interactionBlocker} />}

      <Pressable 
        style={StyleSheet.absoluteFill}
        onPress={handleTapToFocus}
        disabled={isRecording || processing || showInstructions}
      >
        <GestureDetector gesture={pinchGesture}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            video={true}
            audio={false}
            zoom={zoom}
          />
        </GestureDetector>
      </Pressable>

      {/* ← Focus Indicator */}
      {focusPoint && (
        <Animated.View
          style={[
            styles.focusIndicator,
            {
              left: focusPoint.x - 40,
              top: focusPoint.y - 40,
              opacity: focusAnimation,
              transform: [
                {
                  scale: focusAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1.5, 0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.focusBox}>
            <View style={styles.focusCorner} />
            <View style={[styles.focusCorner, styles.focusCornerTopRight]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomLeft]} />
            <View style={[styles.focusCorner, styles.focusCornerBottomRight]} />
          </View>
        </Animated.View>
      )}

      {/* Zoom Controls */}
      {!showInstructions && !processing && (
        <View style={styles.zoomControls}>
          <TouchableOpacity 
            style={styles.zoomButton}
            onPress={handleZoomOut}
            disabled={zoom <= minZoom}
          >
            <Text style={[styles.zoomButtonText, zoom <= minZoom && styles.zoomButtonDisabled]}>
              −
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.zoomIndicator}
            onPress={resetZoom}
          >
            <Text style={styles.zoomText}>{zoom.toFixed(1)}x</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.zoomButton}
            onPress={handleZoomIn}
            disabled={zoom >= maxZoom}
          >
            <Text style={[styles.zoomButtonText, zoom >= maxZoom && styles.zoomButtonDisabled]}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Player Info */}
      {selectedPlayer && !showInstructions && (
        <View style={styles.playerInfoContainer}>
          <Text style={styles.playerInfoText}>
            Comparing with: {selectedPlayer.name}
          </Text>
          <Text style={styles.playerStyleText}>
            Style: {selectedPlayer.description}
          </Text>
        </View>
      )}

      {/* Glassy Instructions Overlay */}
      <InstructionsOverlay
        visible={showInstructions}
        fadeAnim={fadeAnim}
        pulseAnim={pulseAnim}
        onDismiss={toggleInstructions}
      />

      {/* Help Button */}
      {!showInstructions && !isRecording && (
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={toggleInstructions}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      )}

      {/* Processing Overlay */}
      {processing && (
        <View style={styles.overlay}>
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>Analyzing your shot...</Text>
            <Text style={styles.processingSubtext}>This may take a moment</Text>
          </View>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>RECORDING</Text>
        </View>
      )}

      {/* Floating Button */}
      <View
        style={[
          styles.floatingButtonContainer,
          { top: floatingPosition.y, left: floatingPosition.x },
        ]}
      >
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={toggleFloatingMenu}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>

        {showFloatingMenu && (
          <View style={styles.floatingMenu}>
            <TouchableOpacity
              style={[styles.menuButton, styles.recordButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.menuButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuButton, styles.flipButton]}
              onPress={toggleCamera}
              disabled={isRecording}
            >
              <Text style={styles.menuButtonText}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuButton, styles.uploadButton]}
              onPress={handleUpload}
              disabled={isRecording}
            >
              <Text style={styles.menuButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  zoomControls: {
    position: 'absolute',
    top: 120,
    right: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  zoomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 20,
    marginVertical: 4,
  },
  zoomButtonText: {
    color: '#4ECDC4',
    fontSize: 24,
    fontWeight: 'bold',
  },
  zoomButtonDisabled: {
    color: '#666',
  },
  zoomIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  zoomText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerInfoContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 80,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.5)',
  },
  playerInfoText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerStyleText: {
    color: '#4ECDC4',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },

  helpButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.3)',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.6)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  helpButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderRadius: 20,
    marginHorizontal: 60,
  },
  recordingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF0000',
    marginRight: 8,
  },
  recordingText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  processingContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    padding: 32,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.4)',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  processingText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  processingSubtext: {
    color: '#AAAAAA',
    fontSize: 16,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  recordButton: {
    backgroundColor: '#FF3B30',
  },
  stopButton: {
    backgroundColor: '#4ECDC4',
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButtonContainer: {
    position: 'absolute',
    zIndex: 100,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  floatingMenu: {
    position: 'absolute',
    flexDirection: 'row', // Change to horizontal layout
    top: 0,
    left: 70, // Adjust to position the menu to the right of the floating button
    alignItems: 'center',
  },
  menuButton: {
    width: 80, // Reduce width
    paddingVertical: 8, // Reduce vertical padding
    borderRadius: 6, // Slightly smaller border radius
    marginHorizontal: 4, // Adjust spacing between buttons
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Reduce shadow offset
    shadowOpacity: 0.2, // Reduce shadow opacity
    shadowRadius: 4, // Reduce shadow radius
    elevation: 4, // Reduce elevation
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 14, // Reduce font size
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    
  },
  interactionBlocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent', // Transparent to maintain visibility
    zIndex: 1000, // Ensure it is above all other elements
  },
  focusIndicator: {
    position: 'absolute',
    width: 80,
    height: 80,
    zIndex: 50,
    pointerEvents: 'none',
  },
  focusBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderRadius: 4,
  },
  focusCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#4ECDC4',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: -2,
    left: -2,
  },
  focusCornerTopRight: {
    transform: [{ rotate: '90deg' }],
    top: -2,
    right: -2,
    left: undefined,
  },
  focusCornerBottomLeft: {
    transform: [{ rotate: '270deg' }],
    bottom: -2,
    top: undefined,
    left: -2,
  },
  focusCornerBottomRight: {
    transform: [{ rotate: '180deg' }],
    bottom: -2,
    right: -2,
    top: undefined,
    left: undefined,
  },
});

export default CameraScreen;
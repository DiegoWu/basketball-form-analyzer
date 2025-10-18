import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { CONFIG, getApiUrl } from '../utils/config';

const CameraScreen = ({navigation, route}) => {
  var { selectedPlayer } = route.params || {};
  const cameraRef = useRef(null);
  const [cameraPosition, setCameraPosition] = useState('back');
  const device = useCameraDevice(cameraPosition);

  const [hasPermission, setHasPermission] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { autoCompare } = route.params || {};
  // Request camera permissions
  // useEffect(() => {
  //   const requestPermissions = async () => {
  //     const cameraPermission = await Camera.requestCameraPermission();
  //     if (cameraPermission === 'authorized') {
  //       setHasPermission(true);
  //     } else {
  //       Alert.alert('Permission Denied', 'Please enable camera permissions in settings.');
  //     }
  //   };
  //   requestPermissions();
  // }, []);

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        cameraRef.current.startRecording({
          onRecordingFinished: async (video) => {
            console.log('Recording finished:', video);
            setProcessing(true);
            setIsRecording(false);
            await uploadVideo(video.path); // Upload the video after recording finishes
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

      // Choose endpoint based on whether player is selected
      const endpoint = autoCompare 
        ? CONFIG.BACKEND.ENDPOINTS.AUTO_MATCH_WITH_PLAYER : selectedPlayer 
        ? CONFIG.BACKEND.ENDPOINTS.COMPARE_WITH_PLAYER
        : CONFIG.BACKEND.ENDPOINTS.ANALYZE_VIDEO; // Fallback to existing endpoint

      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: CONFIG.BACKEND.TIMEOUT,
      });

      const result = await response.json();
      if(autoCompare) selectedPlayer = result?.selectedPlayer;
    
      console.log('Upload successful:', result);
      
      // Navigate to results with player comparison
      navigation.navigate('Results', {
        analysisResult: result,
        selectedPlayer: selectedPlayer,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload video.');
    }
  };

  // if (!device || !hasPermission) {
  //   return (
  //     <View style={styles.container}>
  //       <Text style={styles.text}>Waiting for camera...</Text>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={false}
      />
      {selectedPlayer && (
        <View style={styles.playerInfoContainer}>
          <Text style={styles.playerInfoText}>
            Comparing with: {selectedPlayer.name}
          </Text>
          <Text style={styles.playerStyleText}>
            Style: {selectedPlayer.description}
          </Text>
        </View>
      )}
      {processing && (
        <View style={styles.overlay}>
          <Text style={styles.processingText}>Analyzing shots...</Text>
        </View>
      )}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isRecording ? styles.stopButton : styles.recordButton]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.buttonText}>{isRecording ? 'Stop' : 'Record'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.flipButton]} onPress={toggleCamera}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    alignSelf: 'center',
    marginTop: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  recordButton: {
    backgroundColor: '#FF0000',
  },
  stopButton: {
    backgroundColor: '#4ECDC4',
  },
  flipButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  processingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerInfoContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  playerInfoText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerStyleText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  
});

export default CameraScreen;

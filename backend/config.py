# Configuration settings for the basketball form analyzer

# Ball detection settings
MIN_BALL_SIZE = 0.01
MIN_BALL_CONFIDENCE = 0.3
MIN_RIM_CONFIDENCE = 0.4

# Video settings
DEFAULT_FPS = 22

# File settings
BASE_FILENAME = "demo"
OUTPUT_DIR = "data/extracted_data"

# Pose detection settings
POSE_CONFIDENCE_THRESHOLD = 0.3

# Keypoint names
KEYPOINT_NAMES = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

PLAYER_IDS = ['lebron', 'curry', 'durant', 'kawhi']

PLAYERS = {
    'lebron': {
        'name': 'LeBron James',
        'description': 'Power forward with explosive motion',
        'style': 'power',
        'characteristics': ['Explosive motion', 'Strong follow-through', 'Consistent form'],
        'image': 'lebron.jpg'
    },
    'curry': {
        'name': 'Stephen Curry',
        'description': 'Quick release with smooth motion',
        'style': 'quick',
        'characteristics': ['Fast release', 'Smooth motion flow', 'Quick acceleration'],
        'image': 'curry.jpg'
    },
    'durant': {
        'name': 'Kevin Durant',
        'description': 'Tall shooter with smooth motion',
        'style': 'smooth',
        'characteristics': ['High release point', 'Smooth motion', 'Very consistent'],
        'image': 'durant.jpg'
    },
    'kawhi': {
        'name': 'Kawhi Leonard',
        'description': 'Defensive player with controlled motion',
        'style': 'linear',
        'characteristics': ['Controlled motion', 'Deliberate form', 'Defensive focus'],
        'image': 'kawhi.jpg'
    },
    'harden': {
        'name': 'James Harden',
        'description': 'Step-back specialist with unique motion',
        'style': 'smooth',
        'characteristics': ['Step-back specialist', 'Unique rhythm', 'Smooth variations'],
        'image': 'harden.jpg'
    }
}


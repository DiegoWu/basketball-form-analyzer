"""
DTW Analysis Configuration

Configuration parameters for DTW-based shooting motion analysis.
"""

# DTW Feature weights based on shooting importance
DTW_FEATURE_WEIGHTS = {
    'ball_wrist_trajectory': 0.30,      # Most critical for accuracy
    'shooting_arm_kinematics': 0.25,    # Core shooting mechanics
    'lower_body_stability': 0.15,       # Foundation and balance
    'phase_timing_patterns': 0.15,      # Timing consistency
    'body_alignment': 0.15              # Overall posture
}

# Phase importance for shooting analysis
PHASE_IMPORTANCE_WEIGHTS = {
    'Setup': 0.10,          # Basic stance
    'Loading': 0.20,        # Power preparation
    'Rising': 0.25,         # Motion initiation  
    'Release': 0.35,        # Most critical moment
    'Follow-through': 0.10  # Consistency and finish
}

# DTW constraints for different feature types
DTW_CONSTRAINTS = {
    'trajectory_2d': {
        'window': 0.35,         # Increased from 0.2 to 0.35 (35% Sakoe-Chiba band) - more lenient for ball_wrist_trajectory
        'max_dist': 4.0,        # Increased from 3.0 to 4.0
        'max_step': 5,          # Increased from 4 to 5
        'max_length_diff': 0.5  # Increased from 0.4 to 0.5
    },
    'ball_wrist_special': {
        'window': 0.1,          # 10% band for ball-wrist trajectory (extremely strict)
        'max_dist': 1.0,        # Extremely strict distance constraint
        'max_step': 1,          # Extremely strict step constraint
        'max_length_diff': 0.2  # Extremely strict length difference constraint
    },
    'kinematics': {
        'window': 0.15,         # 15% band for kinematics - extremely strict
        'max_dist': 1.0,        # Decreased from 2.5 to 1.0
        'max_step': 1,          # Decreased from 3 to 1
        'max_length_diff': 0.2  # Decreased from 0.3 to 0.2
    },
    'stability': {
        'window': 0.3,          # Increased from 0.2 to 0.3 (30% band for stability features)
        'max_dist': 1.5,        # Increased from 1.0 to 1.5
        'max_step': 3,          # Increased from 2 to 3
        'max_length_diff': 0.5  # Increased from 0.4 to 0.5
    },
    'timing': {
        'window': 0.15,         # 15% band for timing patterns - extremely strict for phase_timing_patterns
        'max_dist': 0.5,        # Decreased from 0.8 to 0.5
        'max_step': 1,          # Decreased from 2 to 1
        'max_length_diff': 0.2  # Decreased from 0.4 to 0.2
    }
}


# Similarity score conversion parameters
SIMILARITY_CONVERSION = {
    'trajectory_2d': {
        'max_expected_dist': 8.0,        # Increased from 5.0 to 8.0 (more lenient for ball_wrist_trajectory)
        'scaling_factor': 0.4            # Decreased from 0.6 to 0.4
    },
    'ball_wrist_special': {
        'max_expected_dist': 1.5,        # Extremely strict setting for ball-wrist trajectory
        'scaling_factor': 1.5            # Extremely strict scaling
    },
    'kinematics': {
        'max_expected_dist': 40.0,       # Decreased from 60.0 to 40.0 - extremely strict setting
        'scaling_factor': 1.5            # Increased from 1.2 to 1.5 - extremely strict scaling
    },
    'stability': {
        'max_expected_dist': 1.5,        # More strict setting
        'scaling_factor': 1.0            # More strict scaling
    },
    'timing': {
        'max_expected_dist': 0.4,        # Decreased from 0.8 to 0.4 (extremely strict for phase_timing_patterns)
        'scaling_factor': 1.8            # Increased from 1.2 to 1.8
    }
}

# Subfeature weights for combined analysis
SUBFEATURE_WEIGHTS = {
    'ball_wrist_trajectory': {
        'ball_trajectory': 0.4,
        'wrist_trajectory': 0.35,
        'ball_wrist_distance': 0.25
    },
    'shooting_arm_kinematics': {
        'elbow_angles': 0.35,
        'shoulder_trajectory': 0.25,
        'elbow_trajectory': 0.25,
        'wrist_trajectory': 0.15
    },
    'lower_body_stability': {
        'hip_trajectory': 0.4,
        'knee_angles': 0.35,
        'stance_stability': 0.25
    },
    'phase_timing_patterns': {
        'phase_durations': 0.6,
        'transition_timing': 0.4
    },
    'body_alignment': {
        'shoulder_tilt': 0.4,
        'torso_angle': 0.35,
        'head_stability': 0.25
    }
}

# Similarity grade thresholds with enhanced differentiation
SIMILARITY_GRADES = {
    'A+': 95,    # Very similar
    'A': 90,     # Similar
    'A-': 85,    # Slightly similar
    'B+': 80,    # Moderately similar
    'B': 75,     # Average similarity
    'B-': 70,    # Slightly different
    'C+': 65,    # Different
    'C': 60,     # Very different
    'C-': 55,    # Quite different
    'D+': 50,    # Almost entirely different
    'D': 45,     # Completely different
    'D-': 40,    # Very different
    'F+': 35,    # Extremely different
    'F': 30,     # Completely different
    'F-': 25     # Entirely different
}

# Analysis confidence levels
CONFIDENCE_THRESHOLDS = {
    'high': 0.85,       # 85%+ successful analysis
    'medium': 0.70,     # 70%+ successful analysis
    'low': 0.50         # 50%+ successful analysis
}
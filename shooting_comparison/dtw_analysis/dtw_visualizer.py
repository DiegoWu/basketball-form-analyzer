"""
DTW Visualization Module

Provides visualization tools for DTW analysis results including:
- DTW warping path visualization
- Trajectory alignment comparison  
- Similarity heatmaps
- Side-by-side video comparison
"""

import numpy as np
import os
from typing import Dict, List, Tuple, Optional
import json
import matplotlib.pyplot as plt
from dtaidistance import dtw

MATPLOTLIB_AVAILABLE = True

import cv2
CV2_AVAILABLE = True

import shooting_comparison.utils.calculation_utils as calculation_utils

class DTWVisualizer:
    """
    Visualizes DTW analysis results for basketball shooting comparison.
    
    Creates various plots and animations to show how DTW aligns two shooting motions.
    """
    
    def __init__(self):
        self.fig_size = (12, 8)
        self.colors = {
            'video1': '#2E86AB',
            'video2': '#A23B72', 
            'alignment': '#F18F01',
            'similarity_high': '#43AA8B',
            'similarity_low': '#F8333C'
        }
        # data_path = "data/extracted_data/"
        # self.normalized_data_path1 = data_path + os.path.basename(video1_path) if video1_path else None
        # self.normalized_data_path2 = data_path + os.path.basename(video2_path) if video2_path else None
        self.matplotlib_available = MATPLOTLIB_AVAILABLE
         
        if not self.matplotlib_available:
            print("⚠️ DTWVisualizer: matplotlib not available, visualizations disabled")
        
   
   
    def create_trajectory_comparison_plot(self, dtw_results: Dict, video1_data: Dict, 
                                        video2_data: Dict, save_path: str = None) -> str:
        """
        Create detailed trajectory comparison plots.
        
        Args:
            dtw_results: DTW analysis results
            video1_data: First video's data
            video2_data: Second video's data
            save_path: Path to save the plot
            
        Returns:
            Path to saved plot
        """
        print("🎨 Creating DTW trajectory comparison plot...")
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('DTW Trajectory Comparison Analysis', fontsize=16, fontweight='bold')
        
        # Plot different trajectory comparisons
        self._plot_ball_trajectory_comparison(axes[0, 0], dtw_results, video1_data, video2_data)
        self._plot_wrist_trajectory_comparison(axes[0, 1], dtw_results, video1_data, video2_data)
        self._plot_elbow_angle_comparison(axes[1, 0], dtw_results, video1_data, video2_data)
        self._plot_hip_stability_comparison(axes[1, 1], dtw_results, video1_data, video2_data)
        
        plt.tight_layout()
        
        # Save the plot
        if not save_path:
            save_path = "shooting_comparison/results/dtw_trajectory_comparison.png"
        
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✅ DTW trajectory comparison plot saved: {save_path}")
        return save_path
    
    def _apply_dtw_to_trajectories(self, data1: List[float], data2: List[float]) -> Tuple[float, List[Tuple[int, int]]]:
        """
        Apply DTW algorithm to align two 1D trajectories (for angles, hip positions).
        
        Args:
            data1: First trajectory data (1D)
            data2: Second trajectory data (1D)
            
        Returns:
            Tuple of (dtw_distance, warping_path)
        """
        # Convert to numpy arrays
        seq1 = np.array(data1, dtype=float)
        seq2 = np.array(data2, dtype=float)
        
        # Calculate DTW distance and path
        distance = dtw.distance(seq1, seq2)
        normalized_distance = distance / max(len(seq1), len(seq2))
        path = dtw.warping_path(seq1, seq2)
        return normalized_distance, path

    def _apply_dtw_to_trajectory_2d(self, x1: List[float], y1: List[float], 
                                 x2: List[float], y2: List[float]) -> Tuple[float, List[Tuple[int, int]]]:
        """
        Apply DTW to 2D trajectory using manual implementation with Euclidean distance.
        
        Args:
            x1, y1: First trajectory coordinates
            x2, y2: Second trajectory coordinates
            
        Returns:
            Tuple of (dtw_distance, warping_path)
        """
     
        # Convert to numpy arrays and create 2D points
        x1 = np.array(x1, dtype=float)
        y1 = np.array(y1, dtype=float)
        x2 = np.array(x2, dtype=float)
        y2 = np.array(y2, dtype=float)
        
        points1 = np.column_stack((x1, y1))
        points2 = np.column_stack((x2, y2))
        
        n1, n2 = len(points1), len(points2)
        
        # print(f"   [DEBUG] DTW 2D - Seq1 length: {n1}, Seq2 length: {n2}")
        
        # Initialize DTW cost matrix
        dtw_matrix = np.full((n1 + 1, n2 + 1), np.inf)
        dtw_matrix[0, 0] = 0
        
        # Fill DTW cost matrix with Euclidean distances
        for i in range(1, n1 + 1):
            for j in range(1, n2 + 1):
                # Calculate Euclidean distance between 2D points
                cost = np.sqrt((points1[i-1][0] - points2[j-1][0])**2 + 
                            (points1[i-1][1] - points2[j-1][1])**2)
                
                # DTW recurrence relation
                dtw_matrix[i, j] = cost + min(
                    dtw_matrix[i-1, j],      # insertion
                    dtw_matrix[i, j-1],      # deletion
                    dtw_matrix[i-1, j-1]     # match
                )
        
        # Final DTW distance
        distance = dtw_matrix[n1, n2]
        normalized_distance = distance / max(n1, n2)
        # Backtrack to find optimal warping path
        path = []
        i, j = n1, n2
        
        while i > 0 and j > 0:
            path.append((i-1, j-1))
            
            # Find which direction we came from (minimum cost)
            candidates = [
                (dtw_matrix[i-1, j-1], i-1, j-1),  # diagonal (match)
                (dtw_matrix[i-1, j], i-1, j),      # up (insertion)
                (dtw_matrix[i, j-1], i, j-1)       # left (deletion)
            ]
            
            _, i, j = min(candidates, key=lambda x: x[0])
        
        # Reverse path to get forward direction
        path.reverse()
        
        # print(f"   [DEBUG] DTW 2D - Distance: {distance:.4f}, Path length: {len(path)}")
        
        return normalized_distance, path

    def _calculate_simple_distance(self, data1: List[float], data2: List[float]) -> float:
        """Calculate simple distance for 1D data when DTW is not available"""
        min_len = min(len(data1), len(data2))
        return np.sqrt(np.mean((np.array(data1[:min_len]) - np.array(data2[:min_len]))**2))

    def _calculate_simple_distance_2d(self, x1: List[float], y1: List[float],
                                    x2: List[float], y2: List[float]) -> float:
        """Calculate simple euclidean distance for 2D trajectories"""
        min_len = min(len(x1), len(x2))
        dx = np.array(x1[:min_len]) - np.array(x2[:min_len])
        dy = np.array(y1[:min_len]) - np.array(y2[:min_len])
        return np.sqrt(np.mean(dx**2 + dy**2))

    def _plot_ball_trajectory_comparison(self, ax, dtw_results, video1_data, video2_data):
        """Plot ball trajectory comparison with DTW alignment (2D data)"""
        ax.set_title("Ball Trajectory Comparison (DTW Aligned)")
        
        # Extract actual ball trajectory data
        ball1_trajectory = self._extract_ball_trajectory(video1_data)
        ball2_trajectory = self._extract_ball_trajectory(video2_data)
        
        if ball1_trajectory and ball2_trajectory:
            ball1_x, ball1_y = ball1_trajectory
            ball2_x, ball2_y = ball2_trajectory
            
            # Apply DTW to 2D trajectory (uses same path for both x and y)
            distance, path = self._apply_dtw_to_trajectory_2d(ball1_x, ball1_y, ball2_x, ball2_y)
            
            # Plot original trajectories with dashed lines
            # ax.plot(ball1_x, ball1_y, color=self.colors['video1'], linewidth=1.5, 
            #     marker='o', markersize=3, label='Video 1 Ball', alpha=0.5, linestyle='--')
            # ax.plot(ball2_x, ball2_y, color=self.colors['video2'], linewidth=1.5, 
            #     marker='s', markersize=3, label='Video 2 Ball', alpha=0.5, linestyle='--')
            
            # Create aligned trajectories using DTW path
            if path:
                aligned_ball1_x = [ball1_x[i] for i, j in path]
                aligned_ball1_y = [ball1_y[i] for i, j in path]
                aligned_ball2_x = [ball2_x[j] for i, j in path]
                aligned_ball2_y = [ball2_y[j] for i, j in path]
                
                # Plot aligned trajectories with solid lines
                ax.plot(aligned_ball1_x, aligned_ball1_y, color=self.colors['video1'], 
                    linewidth=2.5, marker='o', markersize=3, label='User (DTW)', alpha=1.0)
                ax.plot(aligned_ball2_x, aligned_ball2_y, color=self.colors['video2'], 
                    linewidth=2.5, marker='s', markersize=3, label='Player (DTW)', alpha=1.0)
                
                # Draw alignment connections (sample every N points)
                step = max(1, len(path) // 10)
                for i in range(0, len(path), step):
                    idx1, idx2 = path[i]
                    ax.plot([ball1_x[idx1], ball2_x[idx2]], [ball1_y[idx1], ball2_y[idx2]], 
                        color=self.colors['alignment'], alpha=0.3, linewidth=1, linestyle=':')
            
            # Mark start points
            ax.scatter(ball1_x[0], ball1_y[0], color=self.colors['video1'], 
                    s=150, marker='o', edgecolors='black', linewidths=2, zorder=5)
            ax.scatter(ball2_x[0], ball2_y[0], color=self.colors['video2'], 
                    s=150, marker='s', edgecolors='black', linewidths=2, zorder=5)
            
            # # Add DTW similarity
            # similarity = max(0, 100 - distance * 10)
            # ax.text(0.02, 0.98, f'DTW Similarity: {similarity:.1f}%\nDistance: {distance:.3f}', 
            #     transform=ax.transAxes, fontsize=9, verticalalignment='top',
            #     bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        else:
            print("   ⚠️ Ball trajectory data not available, skipping ball plot")
            ax.text(0.5, 0.5, 'Ball trajectory data not available', 
                transform=ax.transAxes, ha='center', va='center', fontsize=12)
        
        ax.set_xlabel("X Position (normalized)")
        ax.set_ylabel("Y Position (normalized)")
        ax.legend(loc='best', fontsize=8)
        ax.grid(True, alpha=0.3)
        ax.invert_yaxis()

    def _plot_wrist_trajectory_comparison(self, ax, dtw_results, video1_data, video2_data):
        """Plot wrist trajectory comparison with DTW alignment (2D data)"""
        ax.set_title("Wrist Trajectory Comparison (DTW Aligned)")
        
        # Extract actual wrist trajectory data
        wrist1_trajectory = self._extract_wrist_trajectory(video1_data)
        wrist2_trajectory = self._extract_wrist_trajectory(video2_data)
        
        if wrist1_trajectory and wrist2_trajectory:
            wrist1_x, wrist1_y = wrist1_trajectory
            wrist2_x, wrist2_y = wrist2_trajectory
            
            # Apply DTW to 2D trajectory
            distance, path = self._apply_dtw_to_trajectory_2d(wrist1_x, wrist1_y, wrist2_x, wrist2_y)
            
            # Plot original trajectories
            # ax.plot(wrist1_x, wrist1_y, color=self.colors['video1'], linewidth=1.5, 
            #     marker='o', markersize=3, label='Video 1 Wrist', alpha=0.5, linestyle='--')
            # ax.plot(wrist2_x, wrist2_y, color=self.colors['video2'], linewidth=1.5, 
            #     marker='s', markersize=3, label='Video 2 Wrist', alpha=0.5, linestyle='--')
            
            # Create aligned trajectories
            if path:
                aligned_wrist1_x = [wrist1_x[i] for i, j in path]
                aligned_wrist1_y = [wrist1_y[i] for i, j in path]
                aligned_wrist2_x = [wrist2_x[j] for i, j in path]
                aligned_wrist2_y = [wrist2_y[j] for i, j in path]
                
                # Plot aligned trajectories
                ax.plot(aligned_wrist1_x, aligned_wrist1_y, color=self.colors['video1'], 
                    linewidth=2.5, marker='o', markersize=3, label='User (DTW)', alpha=1.0)
                ax.plot(aligned_wrist2_x, aligned_wrist2_y, color=self.colors['video2'], 
                    linewidth=2.5, marker='s', markersize=3, label='Player (DTW)', alpha=1.0)
                
                # Draw alignment connections
                step = max(1, len(path) // 10)
                for i in range(0, len(path), step):
                    idx1, idx2 = path[i]
                    ax.plot([wrist1_x[idx1], wrist2_x[idx2]], [wrist1_y[idx1], wrist2_y[idx2]], 
                        color=self.colors['alignment'], alpha=0.3, linewidth=1, linestyle=':')
            
            # Mark start points
            ax.scatter(wrist1_x[0], wrist1_y[0], color=self.colors['video1'], 
                    s=150, marker='o', edgecolors='black', linewidths=2, zorder=5)
            ax.scatter(wrist2_x[0], wrist2_y[0], color=self.colors['video2'], 
                    s=150, marker='s', edgecolors='black', linewidths=2, zorder=5)
            
            # Add DTW similarity
            # print("[DEBUG: DISTANCE]: ", distance)
            # similarity = max(0, 100 - distance * 10)
            # ax.text(0.02, 0.98, f'DTW Similarity: {similarity:.1f}%\nDistance: {distance:.3f}', 
            #     transform=ax.transAxes, fontsize=9, verticalalignment='top',
            #     bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        else:
            print("   ⚠️ Wrist trajectory data not available, skipping wrist plot")
            ax.text(0.5, 0.5, 'Wrist trajectory data not available', 
                transform=ax.transAxes, ha='center', va='center', fontsize=12)
        
        ax.set_xlabel("X Position (normalized)")
        ax.set_ylabel("Y Position (normalized)")
        ax.legend(loc='best', fontsize=8)
        ax.grid(True, alpha=0.3)
        ax.invert_yaxis()

    def _plot_elbow_angle_comparison(self, ax, dtw_results, video1_data, video2_data):
        """Plot elbow angle comparison with DTW alignment (1D data)"""
        ax.set_title("Elbow Angle Comparison (DTW Aligned)")
        
        # Extract actual elbow angle data

        elbow1_angles = self._extract_elbow_angles(video1_data)
        elbow2_angles = self._extract_elbow_angles(video2_data)
        
        if elbow1_angles and elbow2_angles:
            # Apply DTW to 1D angle sequences
            distance, path = self._apply_dtw_to_trajectories(elbow1_angles, elbow2_angles)
            
            frames1 = range(len(elbow1_angles))
            frames2 = range(len(elbow2_angles))
            
            # Create aligned sequences using DTW path
            if path:
                aligned_elbow1 = [elbow1_angles[i] for i, j in path]
                aligned_elbow2 = [elbow2_angles[j] for i, j in path]
                aligned_frames = range(len(aligned_elbow1))
                
                # Plot aligned angles with solid lines
                ax.plot(aligned_frames, aligned_elbow1, color=self.colors['video1'], 
                    linewidth=2.5, marker='o', markersize=3, label='User (DTW)', alpha=1.0)
                ax.plot(aligned_frames, aligned_elbow2, color=self.colors['video2'], 
                    linewidth=2.5, marker='s', markersize=3, label='Player (DTW)', alpha=1.0)
                
                # Fill area between aligned curves
                ax.fill_between(aligned_frames, aligned_elbow1, aligned_elbow2, 
                            alpha=0.2, color=self.colors['alignment'])
            
            # Add reference lines
            ax.axhline(y=90, color='gray', linestyle='--', alpha=0.4, linewidth=1, label='90° Ref')
            ax.axhline(y=120, color='gray', linestyle=':', alpha=0.4, linewidth=1, label='120° Ref')
            
            # Add DTW similarity
            # similarity = max(0, 100 - distance * 0.5)
            # ax.text(0.02, 0.98, f'DTW Similarity: {similarity:.1f}%\nDistance: {distance:.2f}°', 
            #     transform=ax.transAxes, fontsize=9, verticalalignment='top',
            #     bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        else:
            print("   ⚠️ Elbow angle data not available, skipping elbow plot")
            ax.text(0.5, 0.5, 'Elbow angle data not available', 
                transform=ax.transAxes, ha='center', va='center', fontsize=12)

        ax.set_xlabel("Frame (DTW Aligned)")
        ax.set_ylabel("Elbow Angle (degrees)")
        ax.set_ylim(0, 180)
        ax.legend(loc='best', fontsize=8)
        ax.grid(True, alpha=0.3)

    def _plot_hip_stability_comparison(self, ax, dtw_results, video1_data, video2_data):
        """Plot hip stability comparison with DTW alignment (1D data)"""
        ax.set_title("Hip Stability Comparison (DTW Aligned)")
        
        # Extract actual hip position data (1D - Y positions only)
        hip1_positions = self._extract_hip_positions(video1_data)
        hip2_positions = self._extract_hip_positions(video2_data)
        
        if hip1_positions and hip2_positions:
            # Apply DTW to 1D hip position sequences
            distance, path = self._apply_dtw_to_trajectories(hip1_positions, hip2_positions)
            
            frames1 = range(len(hip1_positions))
            frames2 = range(len(hip2_positions))

            # Create aligned sequences using DTW path
            if path:
                aligned_hip1 = [hip1_positions[i] for i, j in path]
                aligned_hip2 = [hip2_positions[j] for i, j in path]
                aligned_frames = range(len(aligned_hip1))
                
                # Plot aligned positions with solid lines
                ax.plot(aligned_frames, aligned_hip1, color=self.colors['video1'], 
                    linewidth=2.5, marker='o', markersize=3, label='User (DTW)', alpha=1.0)
                ax.plot(aligned_frames, aligned_hip2, color=self.colors['video2'], 
                    linewidth=2.5, marker='s', markersize=3, label='Player (DTW)', alpha=1.0)
                
                # Fill area between curves
                ax.fill_between(aligned_frames, aligned_hip1, aligned_hip2, 
                            alpha=0.2, color=self.colors['alignment'])

            # Calculate stability metrics
            hip1_std = np.std(hip1_positions)
            hip2_std = np.std(hip2_positions)
            similarity = max(0, 100 - distance * 50)
            
            # Determine which is more stable
            more_stable = "User" if hip1_std < hip2_std else "Player"

            stability_text = (
                # f'DTW Similarity: {similarity:.1f}%\n'
                f'User Stability (σ): {hip1_std:.4f}\n'
                f'Player Stability (σ): {hip2_std:.4f}\n'
                f'More Stable: {more_stable}'
            )
            
            ax.text(0.02, 0.98, stability_text, 
                transform=ax.transAxes, fontsize=9, verticalalignment='top',
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
            
            # Add average position lines
            ax.axhline(y=np.mean(hip1_positions), color=self.colors['video1'], 
                    linestyle=':', alpha=0.3, linewidth=1.5)
            ax.axhline(y=np.mean(hip2_positions), color=self.colors['video2'], 
                    linestyle=':', alpha=0.3, linewidth=1.5)
        else:
            print("   ⚠️ Hip position data not available, skipping hip plot")
            ax.text(0.5, 0.5, 'Hip position data not available', 
                transform=ax.transAxes, ha='center', va='center', fontsize=12)

        ax.set_xlabel("Frame (DTW Aligned)")
        ax.set_ylabel("Hip Position (normalized)")
        ax.legend(loc='best', fontsize=8)
        ax.grid(True, alpha=0.3)
        ax.invert_yaxis()

    def _interpolate_missing_values(self, data: List[float]) -> List[float]:
        """
        Apply linear interpolation to fill missing values (-10) in data.
        
        Args:
            data: List of values with -10 representing missing data
            
        Returns:
            List with interpolated values
        """
        if not data:
            return data
        
        data = np.array(data, dtype=float)
        
        # Find indices of valid (non -10) and missing (-10) values
        valid_indices = np.where(data != -10)[0]
        missing_indices = np.where(data == -10)[0]
        
        # If no missing values, return original data
        if len(missing_indices) == 0:
            return data.tolist()
        
        # If no valid values, cannot interpolate
        if len(valid_indices) == 0:
            print("   ⚠️ No valid values for interpolation")
            return data.tolist()
        
        # Interpolate missing values
        if len(valid_indices) > 1:
            # Linear interpolation for missing values
            data[missing_indices] = np.interp(missing_indices, valid_indices, data[valid_indices])
        else:
            # Only one valid value - use it to fill all missing values
            data[missing_indices] = data[valid_indices[0]]
        
        return data.tolist()

    def _extract_ball_trajectory(self, video_data: Dict) -> Optional[Tuple[List[float], List[float]]]:
        """Extract ball trajectory from video data with interpolation"""
        try:
            frames = video_data.get('frames', [])
            if not frames:
                return None
            
            ball_x = []
            ball_y = []
            # print("[DEBUG] Extracting ball trajectory from video data...")
            
            for frame in frames:
                ball_data = frame.get('normalized_ball', {})
                center_x = ball_data.get('center_x', -10)
                center_y = ball_data.get('center_y', -10)
                ball_x.append(center_x)
                ball_y.append(center_y)
            
            if len(ball_x) == 0:
                return None
            
            # Apply interpolation to fill missing values
            ball_x = self._interpolate_missing_values(ball_x)
            ball_y = self._interpolate_missing_values(ball_y)
            
            # Check if we still have valid data after interpolation
            if all(x == -10 for x in ball_x) or all(y == -10 for y in ball_y):
                print("   ⚠️ No valid ball trajectory data after interpolation")
                return None
            
            return (ball_x, ball_y)
            
        except Exception as e:
            print(f"   ⚠️ Error extracting ball trajectory: {e}")
            return None

    def _extract_wrist_trajectory(self, video_data: Dict) -> Optional[Tuple[List[float], List[float]]]:
        """Extract wrist trajectory from video data with interpolation"""
        try:
            frames = video_data.get('frames', [])
            metadata = video_data.get('metadata', {})
            selected_hand = metadata.get('hand', 'right')
            
            if not frames:
                return None
            
            wrist_x = []
            wrist_y = []

            for frame in frames:
                normalized_pose = frame.get('normalized_pose', {})
                wrist_key = f'{selected_hand}_wrist'
                
                if normalized_pose and wrist_key in normalized_pose:
                    wrist_x.append(normalized_pose[wrist_key].get('x', -10))
                    wrist_y.append(normalized_pose[wrist_key].get('y', -10))
                else:
                    wrist_x.append(-10)
                    wrist_y.append(-10)

            if len(wrist_x) == 0:
                return None
            
            # Apply interpolation to fill missing values
            wrist_x = self._interpolate_missing_values(wrist_x)
            wrist_y = self._interpolate_missing_values(wrist_y)
            
            # Check if we still have valid data after interpolation
            if all(x == -10 for x in wrist_x) or all(y == -10 for y in wrist_y):
                print("   ⚠️ No valid wrist trajectory data after interpolation")
                return None
            
            return (wrist_x, wrist_y)
            
        except Exception as e:
            print(f"   ⚠️ Error extracting wrist trajectory: {e}")
            return None

    def _extract_elbow_angles(self, video_data: Dict) -> Optional[List[float]]:
        """Extract elbow angles from video data with interpolation"""
        try:
            frames = video_data.get('frames', [])
            metadata = video_data.get('metadata', {})
            selected_hand = metadata.get('hand', 'right')
            
            if not frames:
                return None
            
            elbow_angles = []

            for frame in frames:
                normalized_pose = frame.get('normalized_pose', {})
                required_keys = [
                    f'{selected_hand}_shoulder',
                    f'{selected_hand}_elbow',
                    f'{selected_hand}_wrist'
                ]
                
                if normalized_pose and all(key in normalized_pose for key in required_keys):
                
                    elbow_angle = calculation_utils.calculate_angle(
                        normalized_pose[f'{selected_hand}_shoulder']['x'],
                        normalized_pose[f'{selected_hand}_shoulder']['y'],
                        normalized_pose[f'{selected_hand}_elbow']['x'],
                        normalized_pose[f'{selected_hand}_elbow']['y'],
                        normalized_pose[f'{selected_hand}_wrist']['x'],
                        normalized_pose[f'{selected_hand}_wrist']['y']
                    )
                    elbow_angles.append(elbow_angle)

                else:
                    elbow_angles.append(-10)

            if len(elbow_angles) == 0:
                return None
            
            # Apply interpolation to fill missing values
            elbow_angles = self._interpolate_missing_values(elbow_angles)
            
            # Check if we still have valid data after interpolation
            if all(angle == -10 for angle in elbow_angles):
                print("   ⚠️ No valid elbow angle data after interpolation")
                return None
            
            return elbow_angles
            
        except Exception as e:
            print(f"   ⚠️ Error extracting elbow angles: {e}")
            return None

    def _extract_hip_positions(self, video_data: Dict) -> Optional[List[float]]:
        """Extract hip Y positions from video data with interpolation"""
        try:
            frames = video_data.get('frames', [])
            if not frames:
                return None
            
            hip_positions_y = []
            
            for frame in frames:
                normalized_pose = frame.get('normalized_pose', {})
                if normalized_pose and 'left_hip' in normalized_pose and 'right_hip' in normalized_pose:
                    left_hip_y = normalized_pose['left_hip'].get('y', -10)
                    right_hip_y = normalized_pose['right_hip'].get('y', -10)
                    
                    # Only average if both values are valid
                    if left_hip_y != -10 and right_hip_y != -10:
                        hip_positions_y.append((left_hip_y + right_hip_y) / 2)
                    else:
                        hip_positions_y.append(-10)
                else:
                    hip_positions_y.append(-10)
            
            if len(hip_positions_y) == 0:
                return None
            
            # Apply interpolation to fill missing values
            hip_positions_y = self._interpolate_missing_values(hip_positions_y)
            
            # Check if we still have valid data after interpolation
            if all(pos == -10 for pos in hip_positions_y):
                print("   ⚠️ No valid hip position data after interpolation")
                return None
            
            return hip_positions_y

        except Exception as e:
            print(f"   ⚠️ Error extracting hip positions: {e}")
            return None
            
    def create_comprehensive_dtw_report(self, dtw_results: Dict, video1_data: Dict, 
                                      video2_data: Dict, video1_path: str, video2_path: str,
                                      save_dir: str = None) -> Dict[str, str]:
        """
        Create comprehensive DTW visualization report.
        
        Args:
            dtw_results: DTW analysis results
            video1_data: First video's data
            video2_data: Second video's data
            video1_path: Path to first video
            video2_path: Path to second video
            save_dir: Directory to save visualizations
            
        Returns:
            Dictionary of visualization file paths
        """
        print("🎨 Creating comprehensive DTW visualization report...")
        
        if not save_dir:
            base_name1 = os.path.splitext(os.path.basename(video1_path))[0]
            base_name2 = os.path.splitext(os.path.basename(video2_path))[0]
            save_dir = f"shooting_comparison/results/dtw_viz_{base_name1}_vs_{base_name2}"
        
        os.makedirs(save_dir, exist_ok=True)
        
        visualization_files = {}
    
        # Trajectory comparison
        trajectory_path = os.path.join(save_dir, "trajectory_comparison.png")
        visualization_files['trajectories'] = self.create_trajectory_comparison_plot(
            dtw_results, video1_data, video2_data, trajectory_path)
        
        print(f"✅ DTW visualization report created in: {save_dir}")
        print(f"📊 Generated {len(visualization_files)} visualization files")
        
        # Save visualization index
        index_file = os.path.join(save_dir, "visualization_index.json")
        with open(index_file, 'w') as f:
            json.dump(visualization_files, f, indent=2)
        
        return visualization_files

# Utility function for easy visualization
def visualize_dtw_results(dtw_results: Dict, video1_data: Dict, video2_data: Dict,
                         video1_path: str, video2_path: str) -> Dict[str, str]:
    """
    Convenience function to create all DTW visualizations.
    
    Args:
        dtw_results: DTW analysis results
        video1_data: First video's data
        video2_data: Second video's d   ata
        video1_path: Path to first video
        video2_path: Path to second video
        
    Returns:
        Dictionary of visualization file paths
    """
    visualizer = DTWVisualizer()
    return visualizer.create_comprehensive_dtw_report(
        dtw_results, video1_data, video2_data, video1_path, video2_path)
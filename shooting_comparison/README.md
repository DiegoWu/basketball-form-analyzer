# Basketball Shooting Form Comparison

This is a pipeline for comparing shooting forms. It analyzes shooting forms by selecting two videos and using the Dynamic Time Warping (DTW) technique.

## Features

### Main Features
- **Select Two Videos**: Choose videos for comparison through GUI
- **Automatic Data Processing**: Extract pose/ball data using Integrated Pipeline
- **DTW-based Comparison**: Coordinate-based and feature-based comparative analysis
- **Phase-by-Phase Comparison**: Comparison by Loading & Rising, Release, Follow-through phases
- **Save Results**: Store comparison results in JSON format

### Types of Comparative Analysis
1. **Overall Phase Comparison**
   - Coordinate-based
   - Feature-based

2. **Phase-by-Phase Comparison**
   - Loading & Rising phase
   - Release phase
   - Follow-through phase

## Usage

### Basic Execution
```bash
cd shooting_comparison
python shooting_comparison_pipeline.py
```

### Programmatic Usage
```python
from shooting_comparison import ShootingComparisonPipeline

# Initialize pipeline
pipeline = ShootingComparisonPipeline()

# Run complete comparison
success = pipeline.run_comparison()

# Run individual steps
video1_path, video2_path = pipeline.select_videos()
video1_data = pipeline.process_video_data(video1_path)
video2_data = pipeline.process_video_data(video2_path)
results = pipeline.perform_comparison()
```

## File Structure

```
shooting_comparison/
├── __init__.py                     # Module initialization
├── shooting_comparison_pipeline.py # Main pipeline
├── results/                        # Directory for storing comparison results
└── README.md                       # Documentation
```

## Dependencies

- basketball_shooting_integrated_pipeline
- data_collection.dtw_processor
- tkinter (GUI)
- opencv-python
- numpy
- json

## Output Results

### Console Output
- Real-time display of processing
- DTW distance results
- Phase-by-phase statistics
- Comparison summary

### File Output
- `comparison_{video1}_vs_{video2}_{timestamp}.json`
- DTW analysis results
- Metadata
- Phase statistics

## Interpreting Results

### DTW Distance
- **Low value**: Similar shooting form
- **High value**: Different shooting form

### Phase Distribution
- Number of frames for each phase
- Phase comparison between two videos

## Example

```bash
🏀 Basketball Shooting Form Comparison Pipeline
============================================================

🎬 STEP 1: Select Videos for Comparison
==================================================
📹 Select the first video (Reference):
✅ First video selected: stephen_curry_part.mp4
📹 Select the second video (Comparison):
✅ Second video selected: sample_shot.mp4

🔄 STEP 2: Processing Videos
==================================================
🔍 Processing: stephen_curry_part.mp4
✅ Found existing results: stephen_curry_part_normalized_output.json
📊 Loaded 150 frames

🔍 Processing: sample_shot.mp4
🚀 Processing video with integrated pipeline...
✅ Successfully processed 120 frames

🔄 STEP 3: Performing DTW Comparison
==================================================
📊 Performing coordinate-based overall comparison...
📊 Performing feature-based overall comparison...
📊 Performing loading & rising phases comparison...
📊 Performing release phase comparison...
📊 Performing follow-through phase comparison...
✅ DTW comparison completed successfully!

💾 STEP 4: Saving Comparison Results
==================================================
✅ Comparison results saved: comparison_stephen_curry_part_vs_sample_shot_20250801_232600.json
📁 Location: shooting_comparison/results/comparison_stephen_curry_part_vs_sample_shot_20250801_232600.json

📋 COMPARISON SUMMARY
==================================================
📹 Video 1 (Reference): stephen_curry_part.mp4
📹 Video 2 (Comparison): sample_shot.mp4
🖐 Selected Hand: right
📊 Video 1 Frames: 150
📊 Video 2 Frames: 120

🔍 DTW Distance Results:
  • Coordinate Overall: 245.67
  • Feature Overall: 198.34
  • Loading & Rising: 156.78
  • Release: 89.12
  • Follow-through: 134.56

📈 Phase Distribution:
  • Follow-through: Video1=25, Video2=20
  • General: Video1=80, Video2=65
  • Loading: Video1=15, Video2=12
  • Release: Video1=8, Video2=6
  • Rising: Video1=12, Video2=10
  • Set-up: Video1=10, Video2=7

🎉 Shooting form comparison completed successfully!
```

## Notes

### Bugs fixes

* dip point reversed y(rising)
* selected hand is always right in analyzers(follow-through, rising, release)
* swapping logic in normalization(basketball_shooting_analyzer)
* height reversed y(rising, release)
* dip point angles are not calculated
* made up toes and fingers
* safe float function in interpreter
* refactor interpreter configs

### TODO 
* frame numbers in jump height is not actual frame number of the whole video, it's just the frame index of rising frames(debug)
ex
```bash
Video 2 Rising Analysis:
    Total Rising Time: 0.7451052631578947s
    Rising Frames: 13
    Loading-Rising Frames: 32
    Combined Rising Frames: 45
    Jump Analysis:
      Max Jump Height: 1.8575
      Max Height Frame: 44 # this is just frame index of the rising frames
      Max Height Time: 0.729s
      Setup Time: 0.000s
      Relative Timing: -0.729s
```
* frame numbers in follow-through is not actual frame number of the whole video, it's just the frame index of follow-through frames
```bash
Video 2 Follow-through Analysis:
    Total Follow-through Time: 0.7119894736842105s
    Follow-through Frames: 43
    Max Elbow Angle Analysis:
      Max Elbow Angle: 180.00°
      Max Elbow Frame Index: 7
      Arm Angles Std: 10.34°
      Body Angles Std: 0.41°
      Leg Angles Std: 0.39°
      Overall Angles Std: 7.20°
    Stability Analysis:
```
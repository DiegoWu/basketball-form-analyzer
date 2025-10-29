# Basketball Form Analyzer

A comprehensive basketball shooting form analysis system that compares user videos with synthetic NBA player motion profiles. This system provides real-time feedback and detailed phase-by-phase analysis of shooting mechanics.

## Features

### **Motion Profiles**
- **5 NBA Player Styles**: LeBron James, Stephen Curry, Kevin Durant, Kawhi Leonard, James Harden
- **Realistic Biomechanics**: Each player has unique motion characteristics and phase distributions
- **6 Shooting Phases**: General, Set-up, Loading, Rising, Release, Follow-through
- **Motion Curves**: Power, Quick, Smooth, Linear acceleration patterns

### **Mobile App Integration**
- **Player Selection**: Choose from 5 NBA player styles to compare against
- **Real-time Recording**: Capture basketball shots with camera integration
- **Instant Analysis**: Get immediate feedback and similarity scores
- **Phase Breakdown**: Detailed analysis of each shooting phase
- **Recommendations**: Personalized improvement suggestions

### **Backend API**
- **FastAPI Server**: High-performance backend with synthetic profiles integration
- **Video Analysis**: Pose detection and ball tracking
- **Comparison Engine**: Compare user videos with synthetic player data
- **RESTful Endpoints**: Easy integration with mobile and web clients

## Quick Start


### **1. functionality check**

1. Basketball Shooting Integrated Pipeline
* End to end from raw video to shooting motion
* command

```bash
cd ./
python basketball_shooting_integrated_pipeline.py 
```

2. Basketball Shooting Comparison Pipeline
* Compare two shooting motion and output similarity scores as well as coaching advise
* command

```bash
python -m shooting_comparison.enhanced_pipeline                       
```

### **2. Mobile App Setup**

Please refer to mobile/README.md for more details


## Mobile App Flow

1. **Player Selection**: Choose an NBA player to compare against
2. **Video Recording**: Record your basketball shot
3. **Analysis**: Backend processes video and compares with synthetic data
4. **Results**: View similarity scores and recommendations
5. **Improvement**: Get specific feedback for each shooting phase

## Player Styles

### **LeBron James**
- **Style**: Power-based, athletic motion
- **Characteristics**: Explosive motion, strong follow-through, consistent form
- **Motion Curve**: Power acceleration
- **Frame Count**: 90 frames

### **Stephen Curry**
- **Style**: Quick release with smooth motion
- **Characteristics**: Fast release, smooth motion flow, quick acceleration
- **Motion Curve**: Quick acceleration
- **Frame Count**: 85 frames

### **Kevin Durant**
- **Style**: Tall shooter with smooth motion
- **Characteristics**: High release point, smooth motion, very consistent
- **Motion Curve**: Smooth S-curve
- **Frame Count**: 85 frames

### **Kawhi Leonard**
- **Style**: Controlled, deliberate motion
- **Characteristics**: Controlled motion, deliberate form, defensive focus
- **Motion Curve**: Linear motion
- **Frame Count**: 88 frames

### **James Harden**
- **Style**: Step-back specialist with unique rhythm
- **Characteristics**: Step-back specialist, unique rhythm, smooth variations
- **Motion Curve**: Smooth S-curve
- **Frame Count**: 87 frames

## Analysis Results

The system provides:

- **Overall Similarity Score**: Percentage match with selected player
- **Phase-by-Phase Scores**: Individual scores for each shooting phase
- **Recommendations**: Specific improvement suggestions
- **Comparison Metrics**: Motion consistency, release timing, follow-through


## Future Enhancements

- **More Players**: Additional NBA player profiles
- **Custom Profiles**: User-generated motion profiles
- **Advanced Analytics**: Machine learning-based insights
- **Real-time Feedback**: Live coaching during recording
- **Social Features**: Share and compare with friends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This repository is released under a **source-available, non-commercial license**.  
See [LICENSE](./LICENSE) and [EULA.md](./EULA.md) for full terms.

## Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

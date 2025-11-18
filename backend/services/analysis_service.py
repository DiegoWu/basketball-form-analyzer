import os
import tempfile
import shutil
import math
from datetime import datetime
from fastapi import UploadFile, HTTPException
from typing import Dict
from shooting_comparison.analysis_interpreter import AnalysisInterpreter
from shooting_comparison.enhanced_pipeline import EnhancedShootingComparisonPipeline
from backend.routes.llm_routes import LLMService
from backend.config import PLAYER_IDS, PLAYERS
import json

from basketball_shooting_integrated_pipeline import BasketballShootingIntegratedPipeline
ANALYSIS_AVAILABLE = True 
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

def clean_floats(obj):
    if isinstance(obj, dict):
        return {k: clean_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_floats(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    else:
        return obj

def mock_analyze_video(video_path):
    return {
        "success": True,
        "message": "Video analyzed successfully (mock)",
        "total_frames": 150,
        "duration": 5.0,
        "phases_detected": ["General", "Set-up", "Loading", "Rising", "Release", "Follow-through"]
    }

def mock_compare_with_player(user_data: Dict, player_id: str) -> Dict:
    """Mock comparison with synthetic player data"""
    import random
    
    # Generate mock similarity scores
    phase_scores = {}
    for phase in ["General", "Set-up", "Loading", "Rising", "Release", "Follow-through"]:
        phase_scores[phase] = random.uniform(0.3, 0.9)
    
    overall_similarity = sum(phase_scores.values()) / len(phase_scores)
    
    # Generate mock recommendations
    recommendations = []
    if overall_similarity < 0.6:
        recommendations.append("Focus on improving your shooting form consistency")
        recommendations.append("Practice the release phase for better accuracy")
    elif overall_similarity < 0.8:
        recommendations.append("Good form! Work on fine-tuning your motion")
    else:
        recommendations.append("Excellent form! Keep up the great work")
    
    return {
        "success": True,
        "player_id": player_id,
        "overall_similarity": overall_similarity,
        "phase_scores": phase_scores,
        "recommendations": recommendations,
        "comparison_metrics": {
            "motion_consistency": random.uniform(0.4, 0.9),
            "release_timing": random.uniform(0.3, 0.8),
            "follow_through": random.uniform(0.5, 0.9)
        }
    }

# def analyze_video_service(video: UploadFile):
#     try:
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
#             shutil.copyfileobj(video.file, tmp_file)
#             video_path = tmp_file.name

#         if ANALYSIS_AVAILABLE:
#             pipeline = BasketballShootingIntegratedPipeline()
#             user_result = pipeline.run_full_pipeline(video_path, overwrite_mode=True, use_existing_extraction=False)
#         else:
#             user_result = mock_analyze_video(video_path)

#         analysis_pipeline = AnalysisPipeline(video_path)
#         comparison_result = analysis_pipeline.run_basic_analysis()
#         os.unlink(video_path)
#         return user_result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def user_video_replay(video_path: str):
    normalized_json_path = os.path.abspath(os.path.join(CURRENT_DIR, "../../data/results/", os.path.basename(video_path).replace('.mp4', '_normalized_output.json')))
    analyzed_video_path = f"/data/visualized_video/{os.path.basename(video_path).replace('.mp4', '_original_analyzed.mp4')}"
    try:
        with open(normalized_json_path, 'r', encoding='utf-8') as f:
            normalized_data = json.load(f)
            frames = normalized_data.get('frames', [])
            data = [
                {
                    "frame_index": frame["frame_index"],
                    "phase": frame["phase"],
                    "shot": frame["shot"]
                }
                for frame in frames
            ]
            return {
                "normalized_data": data,
                "analyzed_video_path": analyzed_video_path
            }
    except Exception as e:
        print(f"Error loading normalized data: {e}")
    
def compare_with_player_service(video: UploadFile, player_id: str, player_style: str):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            shutil.copyfileobj(video.file, tmp_file)
            video_path = tmp_file.name

        if ANALYSIS_AVAILABLE:
            pipeline = BasketballShootingIntegratedPipeline()
            success = pipeline.run_full_pipeline(video_path, overwrite_mode=True, use_existing_extraction=False)
            if success:
                data = user_video_replay(video_path)
                normalized_data = data.get("normalized_data", [])
                analyzed_video_path = data.get("analyzed_video_path", "")

        else:
            user_result = mock_analyze_video(video_path)

        print("debug: User video analyzed")
        enhanced_pipeline = EnhancedShootingComparisonPipeline()
        synthetic_base_path = f"output_dir/{player_id.lower()}"
        comparison_result = enhanced_pipeline.run_comparison(
            video_path, synthetic_base_path, save_results=True, include_dtw=True, create_visualizations=True, enable_shot_selection=False
        )
        os.unlink(video_path)
        print("debug: Comparison result obtained")
        interpretation = comparison_result.get("interpretation", "No interpretation available")
        output_dir = os.path.abspath(os.path.join(CURRENT_DIR, "../../shooting_comparison/results"))

        interpreter = AnalysisInterpreter()
        llm_prompt = interpreter.generate_llm_prompt(interpretation)
        prompt_file_name = f"llm_prompt_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        prompt_path = os.path.join(output_dir, prompt_file_name)

        with open(prompt_path, 'w', encoding='utf-8') as f:
                f.write(llm_prompt)

        print("debug: Initializing LLMService with prompt path", prompt_path)
        llm_service = LLMService(prompt_path)
        print("debug: Generating LLM response")
        llm_response = llm_service.generate_response()
        print("debug: LLM response generated")
        file_name = os.path.basename(video_path)
        base_name = os.path.splitext(file_name)[0]
        image_rel_path = f"dtw_viz_{base_name}_vs_{player_id}/trajectory_comparison.png"
        image_path = f"/results/{image_rel_path}"
        print("debug: Image path set to", image_path)
        results = {
            "comparison_result": comparison_result,
            "llm_response": llm_response,
            "image_path": image_path,
            "normalized_data": normalized_data,
            "selectedPlayer": PLAYERS.get(player_id, {}),
            "analyzed_video_path": analyzed_video_path,
        }
        print("[DEBUG]: analyzed video path: ", analyzed_video_path)
        print("debug: Final results prepared")
        results = clean_floats(results)
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

def auto_compare_service(video: UploadFile):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            shutil.copyfileobj(video.file, tmp_file)
            video_path = tmp_file.name

        if ANALYSIS_AVAILABLE:
            pipeline = BasketballShootingIntegratedPipeline()
            success = pipeline.run_full_pipeline(video_path, overwrite_mode=True, use_existing_extraction=False)
            if success:
                data = user_video_replay(video_path)
                normalized_data = data.get("normalized_data", [])
                analyzed_video_path = data.get("analyzed_video_path", "")
        else:
            user_result = mock_analyze_video(video_path)
        print("debug: User video analyzed")
        enhanced_pipeline = EnhancedShootingComparisonPipeline()
        best_overall_score = -1
        best_comparison_result = None
        best_player_id = None
        best_interpretation = None
        for player_id in PLAYER_IDS:
        
            synthetic_base_path = f"output_dir/{player_id.lower()}"
            comparison_result = enhanced_pipeline.run_comparison(
                video_path, synthetic_base_path, save_results=True, include_dtw=True, create_visualizations=True, enable_shot_selection=False
            )
            # os.unlink(video_path)
            print("debug: Comparison result obtained")
            interpretation = comparison_result.get("interpretation", "No interpretation available")

            output_dir = os.path.abspath(os.path.join(CURRENT_DIR, "../../shooting_comparison/results"))
            dtw_analysis = comparison_result.get("dtw_analysis", {})
            overall_score = dtw_analysis.get("overall_similarity", 0)
            if overall_score > best_overall_score:
                best_overall_score = overall_score
                best_comparison_result = comparison_result
                best_player_id = player_id
                best_interpretation = interpretation

        os.unlink(video_path)
        print("debug: best overall score", best_overall_score)
        interpreter = AnalysisInterpreter()
        llm_prompt = interpreter.generate_llm_prompt(best_interpretation)
        prompt_file_name = f"llm_prompt_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        prompt_path = os.path.join(output_dir, prompt_file_name)
        print("debug: Saving LLM prompt to", prompt_path)
        try:
            with open(prompt_path, 'w', encoding='utf-8') as f:
                f.write(llm_prompt)
        except Exception as e:
            print(f"   Error saving LLM prompt: {e}")

        print("debug: Initializing LLMService with prompt path", prompt_path)
        llm_service = LLMService(prompt_path)
        print("debug: Generating LLM response")
        llm_response = llm_service.generate_response()
        print("debug: LLM response generated")
        file_name = os.path.basename(video_path)
        base_name = os.path.splitext(file_name)[0]
        image_rel_path = f"dtw_viz_{base_name}_vs_{player_id}/trajectory_comparison.png"
        image_path = f"/results/{image_rel_path}"
        print("debug: Image path set to", image_path)
        results = {
            "comparison_result": best_comparison_result,
            "llm_response": llm_response,
            "image_path": image_path,
            "selectedPlayer": PLAYERS.get(best_player_id, {}),
            "analyzed_video_path": analyzed_video_path,
            "normalized_data": normalized_data,
        }
        print("debug: Final results prepared")

        results = clean_floats(results)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
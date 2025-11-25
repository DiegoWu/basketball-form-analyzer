#!/usr/bin/env python3
"""
Basketball Form Analyzer Backend with Synthetic Motion Profiles Integration

This FastAPI backend provides endpoints for analyzing basketball shots and comparing
them with synthetic NBA player motion profiles.
"""

import os
import sys
# Add current directory to path for imports
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
# from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from fastapi.staticfiles import StaticFiles

from backend.services.analysis_service import compare_with_player_service, auto_compare_service

from backend.services.twilio_service import send_sms

app = FastAPI(
    title="Basketball Form Analyzer - Synthetic Profiles Integration",
    description="API for analyzing basketball shooting form with synthetic NBA player comparisons",
    version="1.0.0"
)

results_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../shooting_comparison/results"))
visualized_video_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/visualized_video"))
# app.mount("/results", StaticFiles(directory=results_dir), name="results")
# app.mount("/data/visualized_video", StaticFiles(directory=str(visualized_video_dir)), name="visualized_video")

# # Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Include existing routes
# # app.include_router(model_router, prefix="/api", tags=["Model Routes"])
# app.include_router(llm_routes.llm_router, prefix="/llm", tags=["LLM Routes"])

# @app.post("/analysis/analyze-video")
# async def analyze_video(video: UploadFile = File(...)):
#     return JSONResponse(content=analyze_video_service(video))

@app.post("/analysis/compare-with-player")
async def compare_with_player(
    video: UploadFile = File(...),
    player_id: str = Form(...),
    player_style: str = Form(...)
):
    return JSONResponse(content=compare_with_player_service(video, player_id, player_style))

@app.post("/analysis/auto")
async def auto_compare(video: UploadFile = File(...)):
    return JSONResponse(content=auto_compare_service(video))

@app.post("/send-sms")
async def send_sms_endpoint(request: Request):
    data = await request.json()
    body = data.get("body")
    to = data.get("to")
    if not body or not to:
        raise HTTPException(status_code=400, detail="Missing body or to")
    try:
        sid = send_sms(body, to)
        return {"status": "sent", "sid": sid, "body": body, "to": to}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

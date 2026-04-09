import cv2
import numpy as np
import mediapipe as mp
import math
import base64
import os
import logging
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "pose_landmarker_heavy.task")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task"


def _ensure_model():
    """Download the pose landmarker model if it doesn't exist."""
    if os.path.exists(MODEL_PATH):
        return
    logger.info("Downloading MediaPipe pose landmarker model (~29MB)...")
    try:
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        logger.info(f"Model downloaded to {MODEL_PATH}")
    except Exception as e:
        raise RuntimeError(
            f"Failed to download pose model: {e}. "
            f"Download manually from {MODEL_URL} and place at {MODEL_PATH}"
        )


class PoseDetector:
    """MediaPipe Pose landmark detection and skeleton visualization (Tasks API)."""

    # Landmark indices
    NOSE = 0
    LEFT_EAR = 7
    RIGHT_EAR = 8
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28

    BODY_CONNECTIONS = [
        (LEFT_SHOULDER, RIGHT_SHOULDER),
        (LEFT_SHOULDER, LEFT_ELBOW),
        (LEFT_ELBOW, LEFT_WRIST),
        (RIGHT_SHOULDER, RIGHT_ELBOW),
        (RIGHT_ELBOW, RIGHT_WRIST),
        (LEFT_SHOULDER, LEFT_HIP),
        (RIGHT_SHOULDER, RIGHT_HIP),
        (LEFT_HIP, RIGHT_HIP),
        (LEFT_HIP, LEFT_KNEE),
        (LEFT_KNEE, LEFT_ANKLE),
        (RIGHT_HIP, RIGHT_KNEE),
        (RIGHT_KNEE, RIGHT_ANKLE),
    ]

    MEASUREMENT_LINES = {
        "shoulder": {"points": (LEFT_SHOULDER, RIGHT_SHOULDER), "color": (0, 255, 0)},
        "left_arm": {"points": (LEFT_SHOULDER, LEFT_WRIST), "color": (255, 165, 0)},
        "right_arm": {"points": (RIGHT_SHOULDER, RIGHT_WRIST), "color": (255, 165, 0)},
        "torso_left": {"points": (LEFT_SHOULDER, LEFT_HIP), "color": (0, 191, 255)},
        "torso_right": {"points": (RIGHT_SHOULDER, RIGHT_HIP), "color": (0, 191, 255)},
        "waist": {"points": (LEFT_HIP, RIGHT_HIP), "color": (255, 0, 255)},
    }

    def __init__(self):
        _ensure_model()

        BaseOptions = mp.tasks.BaseOptions
        PoseLandmarker = mp.tasks.vision.PoseLandmarker
        PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions

        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL_PATH),
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            output_segmentation_masks=True,
        )
        self.landmarker = PoseLandmarker.create_from_options(options)
        logger.info("PoseDetector initialized successfully")

    def detect(self, image: np.ndarray) -> Optional[dict]:
        """Detect pose landmarks in an image.

        Returns dict with 'landmarks', 'image_dimensions', and 'segmentation_mask',
        or None if no pose found.
        """
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = self.landmarker.detect(mp_image)

        if not results.pose_landmarks or len(results.pose_landmarks) == 0:
            return None

        h, w, _ = image.shape
        pose = results.pose_landmarks[0]
        landmarks = []
        for lm in pose:
            landmarks.append({
                "x": lm.x * w,
                "y": lm.y * h,
                "z": lm.z,
                "visibility": lm.visibility if hasattr(lm, "visibility") else lm.presence,
            })

        seg_mask = None
        if results.segmentation_masks and len(results.segmentation_masks) > 0:
            seg_mask = results.segmentation_masks[0].numpy_view()

        return {
            "landmarks": landmarks,
            "image_dimensions": {"width": w, "height": h},
            "segmentation_mask": seg_mask,
        }

    def draw_skeleton(self, image: np.ndarray, landmarks: list[dict]) -> np.ndarray:
        """Draw skeleton overlay with measurement lines on the image."""
        overlay = image.copy()

        # Body connections (gray)
        for start_idx, end_idx in self.BODY_CONNECTIONS:
            start = landmarks[start_idx]
            end = landmarks[end_idx]
            if start["visibility"] > 0.5 and end["visibility"] > 0.5:
                pt1 = (int(start["x"]), int(start["y"]))
                pt2 = (int(end["x"]), int(end["y"]))
                cv2.line(overlay, pt1, pt2, (200, 200, 200), 2, cv2.LINE_AA)

        # Measurement lines (colored + labeled)
        for name, info in self.MEASUREMENT_LINES.items():
            start_idx, end_idx = info["points"]
            color = info["color"]
            start = landmarks[start_idx]
            end = landmarks[end_idx]
            if start["visibility"] > 0.5 and end["visibility"] > 0.5:
                pt1 = (int(start["x"]), int(start["y"]))
                pt2 = (int(end["x"]), int(end["y"]))
                cv2.line(overlay, pt1, pt2, color, 3, cv2.LINE_AA)
                mid = ((pt1[0] + pt2[0]) // 2, (pt1[1] + pt2[1]) // 2 - 10)
                cv2.putText(overlay, name, mid, cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)

        # Neck line (yellow)
        nose = landmarks[self.NOSE]
        l_shoulder = landmarks[self.LEFT_SHOULDER]
        r_shoulder = landmarks[self.RIGHT_SHOULDER]
        if all(lm["visibility"] > 0.5 for lm in [nose, l_shoulder, r_shoulder]):
            mid_shoulder = (
                int((l_shoulder["x"] + r_shoulder["x"]) / 2),
                int((l_shoulder["y"] + r_shoulder["y"]) / 2),
            )
            cv2.line(overlay, (int(nose["x"]), int(nose["y"])), mid_shoulder, (0, 255, 255), 3, cv2.LINE_AA)
            cv2.putText(overlay, "neck", (mid_shoulder[0] + 10, mid_shoulder[1]),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)

        # Chest line (red, horizontal at 30% between shoulder and hip)
        l_hip = landmarks[self.LEFT_HIP]
        r_hip = landmarks[self.RIGHT_HIP]
        if all(lm["visibility"] > 0.5 for lm in [l_shoulder, r_shoulder, l_hip, r_hip]):
            chest_y = int(l_shoulder["y"] + (l_hip["y"] - l_shoulder["y"]) * 0.3)
            chest_left = (int(l_shoulder["x"]), chest_y)
            chest_right = (int(r_shoulder["x"]), chest_y)
            cv2.line(overlay, chest_left, chest_right, (255, 0, 0), 3, cv2.LINE_AA)
            cv2.putText(overlay, "chest", (chest_left[0] - 50, chest_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1, cv2.LINE_AA)

        # Landmark dots (red)
        for lm in landmarks:
            if lm["visibility"] > 0.5:
                cv2.circle(overlay, (int(lm["x"]), int(lm["y"])), 5, (0, 0, 255), -1)

        return overlay

    def image_to_base64(self, image: np.ndarray) -> str:
        """Convert OpenCV image to base64-encoded JPEG string."""
        _, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buffer).decode("utf-8")

    @staticmethod
    def pixel_distance(p1: dict, p2: dict) -> float:
        """Euclidean distance between two landmark points in pixel space."""
        return math.sqrt((p1["x"] - p2["x"]) ** 2 + (p1["y"] - p2["y"]) ** 2)

    def close(self):
        self.landmarker.close()

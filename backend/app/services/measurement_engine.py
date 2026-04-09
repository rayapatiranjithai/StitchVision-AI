import math
from .pose_detector import PoseDetector


# Anthropometric correction factors per gender
BODY_RATIOS = {
    "male": {
        "chest_to_shoulder": 2.6,
        "neck_circumference_factor": 1.15,
        "waist_to_hip_width": 2.4,
        "shoulder_depth_factor": 1.15,
    },
    "female": {
        "chest_to_shoulder": 2.4,
        "neck_circumference_factor": 1.10,
        "waist_to_hip_width": 2.2,
        "shoulder_depth_factor": 1.10,
    },
}

# Standard shirt sizes (chest circumference in cm)
SHIRT_SIZES = {
    "male": [
        ("XS", 81, 86),
        ("S", 86, 96),
        ("M", 96, 104),
        ("L", 104, 112),
        ("XL", 112, 120),
        ("XXL", 120, 130),
        ("3XL", 130, 145),
    ],
    "female": [
        ("XS", 76, 82),
        ("S", 82, 90),
        ("M", 90, 98),
        ("L", 98, 108),
        ("XL", 108, 118),
        ("XXL", 118, 128),
    ],
}

# Reasonable measurement ranges (cm)
CLAMP_RANGES = {
    "shoulder_width_cm": (30, 65),
    "chest_circumference_cm": (70, 150),
    "sleeve_length_cm": (45, 90),
    "shirt_length_cm": (55, 95),
    "neck_size_cm": (30, 55),
    "waist_cm": (60, 140),
}


class MeasurementEngine:
    """Calculate real-world body measurements from pose landmarks.

    Uses PoseDetector's static pixel_distance method — does NOT instantiate
    a second detector.
    """

    @staticmethod
    def _px_dist(p1: dict, p2: dict) -> float:
        return PoseDetector.pixel_distance(p1, p2)

    @staticmethod
    def calculate_scale_factor(landmarks: list[dict], height_cm: float) -> float:
        """Calculate pixels-to-cm scale using full body height.

        pixel_height = nose_to_ankle / 0.88  (nose is ~88% of total height)
        scale = height_cm / pixel_height
        """
        nose = landmarks[PoseDetector.NOSE]
        l_ankle = landmarks[PoseDetector.LEFT_ANKLE]
        r_ankle = landmarks[PoseDetector.RIGHT_ANKLE]

        # Use the more visible ankle
        ankle = l_ankle if l_ankle["visibility"] > r_ankle["visibility"] else r_ankle

        nose_to_ankle_px = PoseDetector.pixel_distance(nose, ankle)
        pixel_height = nose_to_ankle_px / 0.88

        if pixel_height < 10:
            raise ValueError("Could not detect full body height. Ensure full body is visible.")

        return height_cm / pixel_height

    def calculate_measurements(
        self,
        landmarks: list[dict],
        height_cm: float,
        gender: str = "male",
    ) -> dict:
        """Calculate all shirt measurements from landmarks.

        Returns dict with 'measurements' (cm), 'confidence' (0-1), and 'warnings' list.
        """
        scale = self.calculate_scale_factor(landmarks, height_cm)
        ratios = BODY_RATIOS.get(gender, BODY_RATIOS["male"])
        warnings: list[str] = []
        confidences: list[float] = []

        # --- Shoulder Width ---
        l_shoulder = landmarks[PoseDetector.LEFT_SHOULDER]
        r_shoulder = landmarks[PoseDetector.RIGHT_SHOULDER]
        shoulder_vis = min(l_shoulder["visibility"], r_shoulder["visibility"])
        confidences.append(shoulder_vis)

        shoulder_px = self._px_dist(l_shoulder, r_shoulder)
        shoulder_cm = shoulder_px * scale * ratios["shoulder_depth_factor"]

        if shoulder_vis < 0.7:
            warnings.append("Shoulder landmarks have low visibility - measurement may be inaccurate")

        # --- Chest Circumference ---
        # Front-view approximation: chest_circ = shoulder_width * ratio
        chest_cm = shoulder_cm * ratios["chest_to_shoulder"]

        # --- Sleeve Length ---
        # shoulder -> elbow -> wrist (use the side with better visibility)
        l_elbow = landmarks[PoseDetector.LEFT_ELBOW]
        l_wrist = landmarks[PoseDetector.LEFT_WRIST]
        r_elbow = landmarks[PoseDetector.RIGHT_ELBOW]
        r_wrist = landmarks[PoseDetector.RIGHT_WRIST]

        left_vis = min(l_shoulder["visibility"], l_elbow["visibility"], l_wrist["visibility"])
        right_vis = min(r_shoulder["visibility"], r_elbow["visibility"], r_wrist["visibility"])

        if left_vis > right_vis:
            upper_arm_px = self._px_dist(l_shoulder, l_elbow)
            forearm_px = self._px_dist(l_elbow, l_wrist)
            arm_vis = left_vis
        else:
            upper_arm_px = self._px_dist(r_shoulder, r_elbow)
            forearm_px = self._px_dist(r_elbow, r_wrist)
            arm_vis = right_vis

        confidences.append(arm_vis)
        sleeve_cm = (upper_arm_px + forearm_px) * scale

        if arm_vis < 0.7:
            warnings.append("Arm landmarks have low visibility - sleeve measurement may be inaccurate")

        # --- Shirt Length ---
        # Mid-shoulder to mid-hip + 10cm extension below hip
        l_hip = landmarks[PoseDetector.LEFT_HIP]
        r_hip = landmarks[PoseDetector.RIGHT_HIP]

        mid_shoulder = {"x": (l_shoulder["x"] + r_shoulder["x"]) / 2,
                        "y": (l_shoulder["y"] + r_shoulder["y"]) / 2}
        mid_hip = {"x": (l_hip["x"] + r_hip["x"]) / 2,
                   "y": (l_hip["y"] + r_hip["y"]) / 2}

        torso_px = self._px_dist(mid_shoulder, mid_hip)
        shirt_length_cm = torso_px * scale + 10.0

        hip_vis = min(l_hip["visibility"], r_hip["visibility"])
        confidences.append(hip_vis)

        # --- Neck Size ---
        # Neck width from ear-to-ear distance, then circumference via pi * correction
        l_ear = landmarks[PoseDetector.LEFT_EAR]
        r_ear = landmarks[PoseDetector.RIGHT_EAR]
        ear_vis = min(l_ear["visibility"], r_ear["visibility"])

        if ear_vis > 0.5:
            ear_dist_px = self._px_dist(l_ear, r_ear)
            neck_width_cm = ear_dist_px * scale * 0.6
        else:
            # Fallback: neck width ~ 38% of shoulder width
            neck_width_cm = shoulder_cm * 0.38
            warnings.append("Ear landmarks not visible - neck size estimated from shoulder width")

        # Circumference = width * pi * correction factor
        neck_cm = neck_width_cm * math.pi * ratios["neck_circumference_factor"]
        neck_cm = max(30.0, min(55.0, neck_cm))

        # --- Waist ---
        waist_px = self._px_dist(l_hip, r_hip)
        waist_cm = waist_px * scale * ratios["waist_to_hip_width"]

        # --- Overall confidence ---
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.5

        # Clamp all measurements to reasonable ranges
        raw = {
            "shoulder_width_cm": shoulder_cm,
            "chest_circumference_cm": chest_cm,
            "sleeve_length_cm": sleeve_cm,
            "shirt_length_cm": shirt_length_cm,
            "neck_size_cm": neck_cm,
            "waist_cm": waist_cm,
        }
        measurements = {}
        for key, val in raw.items():
            lo, hi = CLAMP_RANGES[key]
            measurements[key] = round(max(lo, min(hi, val)), 1)

        return {
            "measurements": measurements,
            "confidence": round(avg_confidence, 2),
            "warnings": warnings,
        }

    @staticmethod
    def recommend_size(chest_cm: float, gender: str = "male") -> str:
        """Recommend shirt size based on chest circumference."""
        sizes = SHIRT_SIZES.get(gender, SHIRT_SIZES["male"])
        for label, low, high in sizes:
            if low <= chest_cm < high:
                return label
        if chest_cm < sizes[0][1]:
            return sizes[0][0]
        return sizes[-1][0]

    @staticmethod
    def cm_to_inches(measurements: dict) -> dict:
        """Convert measurement dict values from cm to inches."""
        return {k: round(v / 2.54, 1) for k, v in measurements.items()}

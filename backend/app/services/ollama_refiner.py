import httpx
import json
import os
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


REFINEMENT_PROMPT = """You are a professional tailor's measurement AI assistant. Given the following body measurements estimated from a photo, refine them using your knowledge of human body proportions.

Input measurements (in cm):
- Shoulder width: {shoulder_width_cm}
- Chest circumference: {chest_circumference_cm}
- Sleeve length: {sleeve_length_cm}
- Shirt length: {shirt_length_cm}
- Neck size: {neck_size_cm}
- Waist: {waist_cm}

Person details:
- Height: {height_cm} cm
- Gender: {gender}

Rules for refinement:
1. For {gender}, typical chest-to-shoulder ratio is about {chest_ratio}:1
2. Sleeve length should be proportional to height (typically 32-36% of height for males, 30-34% for females)
3. Shirt length is typically 38-42% of height
4. Neck circumference is typically 22-25% of shoulder width * 3.14 for males
5. If any measurement seems like an outlier (>20% deviation from expected), adjust it closer to the expected range
6. All measurements should be internally consistent

Return ONLY a valid JSON object with the corrected measurements. No explanation, no markdown, just the JSON:
{{"shoulder_width_cm": X, "chest_circumference_cm": X, "sleeve_length_cm": X, "shirt_length_cm": X, "neck_size_cm": X, "waist_cm": X}}
"""


async def refine_measurements(
    measurements: dict,
    height_cm: float,
    gender: str = "male",
) -> dict:
    """Use Ollama LLM to refine measurements based on body proportion heuristics.

    Falls back to original measurements if Ollama is unavailable.
    """
    chest_ratio = 2.6 if gender == "male" else 2.4

    prompt = REFINEMENT_PROMPT.format(
        **measurements,
        height_cm=height_cm,
        gender=gender,
        chest_ratio=chest_ratio,
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
            )

            if response.status_code != 200:
                logger.warning(f"Ollama returned status {response.status_code}, using original measurements")
                return measurements

            result = response.json()
            text = result.get("response", "")

            # Extract JSON from response
            # Try to find JSON in the response
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                refined = json.loads(text[start:end])
                # Validate that all expected keys are present
                expected_keys = {"shoulder_width_cm", "chest_circumference_cm", "sleeve_length_cm",
                                 "shirt_length_cm", "neck_size_cm", "waist_cm"}
                if expected_keys.issubset(refined.keys()):
                    # Ensure values are reasonable (within 30% of original)
                    for key in expected_keys:
                        original = measurements[key]
                        new_val = refined[key]
                        if abs(new_val - original) / original > 0.3:
                            logger.warning(f"Ollama adjustment for {key} too large ({original} -> {new_val}), capping")
                            refined[key] = round(original * (1.15 if new_val > original else 0.85), 1)
                        else:
                            refined[key] = round(new_val, 1)
                    return refined

            logger.warning("Could not parse Ollama response, using original measurements")
            return measurements

    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.info(f"Ollama not available ({e}), using original measurements")
        return measurements
    except Exception as e:
        logger.warning(f"Error refining with Ollama: {e}")
        return measurements


async def check_ollama_status() -> dict:
    """Check if Ollama is running and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [m["name"] for m in models]
                has_model = any(OLLAMA_MODEL in name for name in model_names)
                return {
                    "status": "connected",
                    "model": OLLAMA_MODEL,
                    "model_available": has_model,
                    "available_models": model_names,
                }
            return {"status": "error", "message": f"Status {response.status_code}"}
    except Exception as e:
        return {"status": "disconnected", "message": str(e)}

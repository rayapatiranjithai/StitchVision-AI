"""
Shirt Style Catalog — defines stitching styles with measurement standards.

Each style has:
- ease: extra cm added to body measurement for fit comfort
- length_factor: multiplier on base shirt length
- sleeve_type: full / 3-quarter / half / sleeveless
- sleeve_factor: multiplier on measured sleeve length
- neck_type: collar / mandarin / round / v-neck / boat / band / square
- description: what the style looks like
- standards: expected measurement ranges for reference
"""

STYLES = {
    # ===================== MALE STYLES =====================
    "male": {
        "regular_fit_shirt": {
            "name": "Regular Fit Shirt",
            "description": "Classic business/casual shirt with moderate room. Standard collar, full sleeves, falls at mid-hip.",
            "neck_type": "collar",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 12,       # 12cm ease for comfortable fit
                "waist_cm": 14,
                "shoulder_cm": 2,
                "neck_cm": 1.5,
            },
            "length_factor": 1.0,     # standard length
            "sleeve_factor": 1.0,     # standard sleeve
            "standards": {
                "S":   {"chest": "96-101",  "shoulder": "43-44", "sleeve": "60-61", "length": "72-74", "neck": "37-38"},
                "M":   {"chest": "101-106", "shoulder": "44-46", "sleeve": "61-62", "length": "74-76", "neck": "38-39"},
                "L":   {"chest": "106-116", "shoulder": "46-48", "sleeve": "62-63", "length": "76-78", "neck": "39-41"},
                "XL":  {"chest": "116-121", "shoulder": "48-50", "sleeve": "63-64", "length": "78-80", "neck": "41-43"},
                "XXL": {"chest": "121-131", "shoulder": "50-52", "sleeve": "64-65", "length": "80-82", "neck": "43-45"},
            },
        },
        "slim_fit_shirt": {
            "name": "Slim Fit Shirt",
            "description": "Tapered body with narrow shoulders. Follows body contour closely. Modern look for lean builds.",
            "neck_type": "collar",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 6,
                "waist_cm": 8,
                "shoulder_cm": 0.5,
                "neck_cm": 1,
            },
            "length_factor": 0.97,
            "sleeve_factor": 1.0,
            "standards": {
                "S":   {"chest": "90-96",  "shoulder": "42-43", "sleeve": "60-61", "length": "70-72", "neck": "37-38"},
                "M":   {"chest": "96-101", "shoulder": "43-45", "sleeve": "61-62", "length": "72-74", "neck": "38-39"},
                "L":   {"chest": "101-108","shoulder": "45-47", "sleeve": "62-63", "length": "74-76", "neck": "39-41"},
                "XL":  {"chest": "108-116","shoulder": "47-49", "sleeve": "63-64", "length": "76-78", "neck": "41-43"},
            },
        },
        "kurta": {
            "name": "Kurta",
            "description": "Traditional Indian tunic. Loose fit, knee-length, side slits. Band or mandarin collar, full sleeves.",
            "neck_type": "mandarin",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 18,
                "waist_cm": 20,
                "shoulder_cm": 3,
                "neck_cm": 2,
            },
            "length_factor": 1.55,    # knee-length
            "sleeve_factor": 1.0,
            "standards": {
                "S":   {"chest": "102-106", "shoulder": "44-46", "sleeve": "60-62", "length": "100-104", "neck": "38-39"},
                "M":   {"chest": "106-112", "shoulder": "46-48", "sleeve": "62-64", "length": "104-108", "neck": "39-40"},
                "L":   {"chest": "112-120", "shoulder": "48-50", "sleeve": "64-66", "length": "108-112", "neck": "40-42"},
                "XL":  {"chest": "120-128", "shoulder": "50-52", "sleeve": "66-68", "length": "112-116", "neck": "42-44"},
                "XXL": {"chest": "128-136", "shoulder": "52-54", "sleeve": "68-70", "length": "116-120", "neck": "44-46"},
            },
        },
        "nehru_jacket": {
            "name": "Nehru / Mandarin Collar",
            "description": "Short stand-up collar, no lapels. Semi-formal. Fitted at chest, hip-length. Often worn over kurta.",
            "neck_type": "mandarin",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 10,
                "waist_cm": 10,
                "shoulder_cm": 1.5,
                "neck_cm": 1,
            },
            "length_factor": 1.05,
            "sleeve_factor": 1.0,
            "standards": {
                "S":   {"chest": "96-101",  "shoulder": "43-45", "sleeve": "60-61", "length": "74-76", "neck": "37-38"},
                "M":   {"chest": "101-108", "shoulder": "45-47", "sleeve": "61-62", "length": "76-78", "neck": "38-39"},
                "L":   {"chest": "108-116", "shoulder": "47-49", "sleeve": "62-63", "length": "78-80", "neck": "39-41"},
                "XL":  {"chest": "116-124", "shoulder": "49-51", "sleeve": "63-64", "length": "80-82", "neck": "41-43"},
            },
        },
        "polo_shirt": {
            "name": "Polo Shirt",
            "description": "Knit shirt with 2-3 button placket. Short sleeves, ribbed collar. Casual smart wear.",
            "neck_type": "collar",
            "sleeve_type": "half",
            "ease": {
                "chest_cm": 10,
                "waist_cm": 12,
                "shoulder_cm": 1.5,
                "neck_cm": 1,
            },
            "length_factor": 0.95,
            "sleeve_factor": 0.45,    # short sleeve
            "standards": {
                "S":   {"chest": "94-99",  "shoulder": "43-44", "sleeve": "24-25", "length": "70-72", "neck": "37-38"},
                "M":   {"chest": "99-106", "shoulder": "44-46", "sleeve": "25-26", "length": "72-74", "neck": "38-39"},
                "L":   {"chest": "106-114","shoulder": "46-48", "sleeve": "26-27", "length": "74-76", "neck": "39-41"},
                "XL":  {"chest": "114-122","shoulder": "48-50", "sleeve": "27-28", "length": "76-78", "neck": "41-43"},
            },
        },
        "casual_overshirt": {
            "name": "Casual / Overshirt",
            "description": "Relaxed boxy fit. Dropped shoulders, straight hem. Camp collar or button-down. Untucked wear.",
            "neck_type": "collar",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 16,
                "waist_cm": 18,
                "shoulder_cm": 4,
                "neck_cm": 2,
            },
            "length_factor": 1.05,
            "sleeve_factor": 0.98,
            "standards": {
                "S":   {"chest": "100-106", "shoulder": "46-48", "sleeve": "58-60", "length": "74-76", "neck": "38-39"},
                "M":   {"chest": "106-114", "shoulder": "48-50", "sleeve": "60-62", "length": "76-78", "neck": "39-40"},
                "L":   {"chest": "114-122", "shoulder": "50-52", "sleeve": "62-64", "length": "78-80", "neck": "40-42"},
                "XL":  {"chest": "122-130", "shoulder": "52-54", "sleeve": "64-66", "length": "80-82", "neck": "42-44"},
            },
        },
    },

    # ===================== FEMALE STYLES =====================
    "female": {
        "classic_blouse": {
            "name": "Classic Blouse",
            "description": "Standard fitted blouse with darts. Button front, pointed collar, full sleeves. Tucked or untucked.",
            "neck_type": "collar",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 10,
                "waist_cm": 10,
                "shoulder_cm": 1.5,
                "neck_cm": 1,
            },
            "length_factor": 0.95,
            "sleeve_factor": 1.0,
            "standards": {
                "XS":  {"chest": "82-86",  "shoulder": "36-37", "sleeve": "56-57", "length": "60-62", "neck": "33-34"},
                "S":   {"chest": "86-92",  "shoulder": "37-38", "sleeve": "57-58", "length": "62-64", "neck": "34-35"},
                "M":   {"chest": "92-100", "shoulder": "38-40", "sleeve": "58-59", "length": "64-66", "neck": "35-36"},
                "L":   {"chest": "100-108","shoulder": "40-42", "sleeve": "59-60", "length": "66-68", "neck": "36-38"},
                "XL":  {"chest": "108-118","shoulder": "42-44", "sleeve": "60-61", "length": "68-70", "neck": "38-40"},
            },
        },
        "kurti": {
            "name": "Kurti",
            "description": "Indian tunic top. A-line or straight. Round or V-neck. Falls below knee. 3/4 or full sleeves.",
            "neck_type": "round",
            "sleeve_type": "3-quarter",
            "ease": {
                "chest_cm": 14,
                "waist_cm": 16,
                "shoulder_cm": 2,
                "neck_cm": 2,
            },
            "length_factor": 1.45,     # below knee
            "sleeve_factor": 0.75,     # 3/4 length
            "standards": {
                "S":   {"chest": "90-96",  "shoulder": "37-38", "sleeve": "42-44", "length": "90-94", "neck": "34-35"},
                "M":   {"chest": "96-104", "shoulder": "38-40", "sleeve": "44-46", "length": "94-98", "neck": "35-36"},
                "L":   {"chest": "104-112","shoulder": "40-42", "sleeve": "46-48", "length": "98-102", "neck": "36-38"},
                "XL":  {"chest": "112-120","shoulder": "42-44", "sleeve": "48-50", "length": "102-106", "neck": "38-40"},
                "XXL": {"chest": "120-128","shoulder": "44-46", "sleeve": "50-52", "length": "106-110", "neck": "40-42"},
            },
        },
        "anarkali": {
            "name": "Anarkali",
            "description": "Floor-length flared dress. Fitted at bust, flares from waist. Heavy embroidery. Full sleeves typical.",
            "neck_type": "round",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 10,
                "waist_cm": 8,       # fitted at waist then flares
                "shoulder_cm": 1.5,
                "neck_cm": 1.5,
            },
            "length_factor": 2.0,     # floor-length
            "sleeve_factor": 1.0,
            "standards": {
                "S":   {"chest": "86-92",  "shoulder": "37-38", "sleeve": "57-58", "length": "130-136", "neck": "34-35"},
                "M":   {"chest": "92-100", "shoulder": "38-40", "sleeve": "58-59", "length": "136-142", "neck": "35-36"},
                "L":   {"chest": "100-108","shoulder": "40-42", "sleeve": "59-60", "length": "142-148", "neck": "36-38"},
                "XL":  {"chest": "108-118","shoulder": "42-44", "sleeve": "60-61", "length": "148-154", "neck": "38-40"},
            },
        },
        "peplum_top": {
            "name": "Peplum Top",
            "description": "Fitted bodice with flared ruffle at waist. Short or cap sleeves. Round or sweetheart neckline.",
            "neck_type": "round",
            "sleeve_type": "half",
            "ease": {
                "chest_cm": 8,
                "waist_cm": 6,        # tight at waist
                "shoulder_cm": 1,
                "neck_cm": 1,
            },
            "length_factor": 0.85,
            "sleeve_factor": 0.4,
            "standards": {
                "XS":  {"chest": "80-84",  "shoulder": "36-37", "sleeve": "20-22", "length": "52-54", "neck": "33-34"},
                "S":   {"chest": "84-90",  "shoulder": "37-38", "sleeve": "22-23", "length": "54-56", "neck": "34-35"},
                "M":   {"chest": "90-98",  "shoulder": "38-40", "sleeve": "23-24", "length": "56-58", "neck": "35-36"},
                "L":   {"chest": "98-106", "shoulder": "40-42", "sleeve": "24-25", "length": "58-60", "neck": "36-38"},
                "XL":  {"chest": "106-114","shoulder": "42-44", "sleeve": "25-26", "length": "60-62", "neck": "38-40"},
            },
        },
        "a_line_top": {
            "name": "A-Line Top",
            "description": "Fitted at shoulders, gradually flares to hem. Relaxed silhouette. Round or V-neck. Versatile casual wear.",
            "neck_type": "v-neck",
            "sleeve_type": "half",
            "ease": {
                "chest_cm": 14,
                "waist_cm": 20,       # wide at hem
                "shoulder_cm": 2,
                "neck_cm": 1.5,
            },
            "length_factor": 1.0,
            "sleeve_factor": 0.45,
            "standards": {
                "S":   {"chest": "90-96",  "shoulder": "37-38", "sleeve": "24-25", "length": "64-66", "neck": "34-35"},
                "M":   {"chest": "96-104", "shoulder": "38-40", "sleeve": "25-26", "length": "66-68", "neck": "35-36"},
                "L":   {"chest": "104-112","shoulder": "40-42", "sleeve": "26-27", "length": "68-70", "neck": "36-38"},
                "XL":  {"chest": "112-120","shoulder": "42-44", "sleeve": "27-28", "length": "70-72", "neck": "38-40"},
            },
        },
        "fitted_shirt": {
            "name": "Fitted / Slim Shirt",
            "description": "Body-hugging cut with princess seams or darts. Accentuates waist. Formal or semi-formal.",
            "neck_type": "collar",
            "sleeve_type": "full",
            "ease": {
                "chest_cm": 6,
                "waist_cm": 6,
                "shoulder_cm": 0.5,
                "neck_cm": 1,
            },
            "length_factor": 0.95,
            "sleeve_factor": 1.0,
            "standards": {
                "XS":  {"chest": "78-82",  "shoulder": "36-37", "sleeve": "56-57", "length": "60-62", "neck": "33-34"},
                "S":   {"chest": "82-88",  "shoulder": "37-38", "sleeve": "57-58", "length": "62-64", "neck": "34-35"},
                "M":   {"chest": "88-96",  "shoulder": "38-40", "sleeve": "58-59", "length": "64-66", "neck": "35-36"},
                "L":   {"chest": "96-104", "shoulder": "40-42", "sleeve": "59-60", "length": "66-68", "neck": "36-38"},
                "XL":  {"chest": "104-112","shoulder": "42-44", "sleeve": "60-61", "length": "68-70", "neck": "38-40"},
            },
        },
    },
}


def get_styles_for_gender(gender: str) -> dict:
    """Return all available styles for a gender."""
    return STYLES.get(gender, STYLES["male"])


def get_style(gender: str, style_id: str) -> dict | None:
    """Get a specific style definition."""
    styles = STYLES.get(gender, {})
    return styles.get(style_id)


def apply_style_adjustments(body_measurements: dict, gender: str, style_id: str) -> dict:
    """Apply style-specific ease and length adjustments to raw body measurements.

    body_measurements: raw measurements from MeasurementEngine (cm)
    Returns: stitching measurements (what the tailor cuts)
    """
    style = get_style(gender, style_id)
    if not style:
        return body_measurements

    ease = style["ease"]

    stitching = {
        "shoulder_width_cm": round(body_measurements["shoulder_width_cm"] + ease["shoulder_cm"], 1),
        "chest_circumference_cm": round(body_measurements["chest_circumference_cm"] + ease["chest_cm"], 1),
        "sleeve_length_cm": round(body_measurements["sleeve_length_cm"] * style["sleeve_factor"], 1),
        "shirt_length_cm": round(body_measurements["shirt_length_cm"] * style["length_factor"], 1),
        "neck_size_cm": round(body_measurements["neck_size_cm"] + ease["neck_cm"], 1),
        "waist_cm": round(body_measurements["waist_cm"] + ease["waist_cm"], 1),
    }

    return stitching


def get_style_summary(gender: str, style_id: str) -> dict | None:
    """Get a summary of a style for frontend display."""
    style = get_style(gender, style_id)
    if not style:
        return None

    return {
        "id": style_id,
        "name": style["name"],
        "description": style["description"],
        "neck_type": style["neck_type"],
        "sleeve_type": style["sleeve_type"],
        "ease": style["ease"],
        "length_factor": style["length_factor"],
        "sleeve_factor": style["sleeve_factor"],
        "standards": style["standards"],
    }

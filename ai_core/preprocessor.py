"""
Image preprocessing and multi-spectral index analysis for satellite imagery.
Supports radiometric normalization, dimension alignment, and spectral index generation (NDVI, NDBI, NDWI).
"""

import os
from typing import Tuple, Dict, Any
import numpy as np
import cv2
from PIL import Image

def preprocess_image(image_input) -> np.ndarray:
    """
    Loads an image from filepath or byte stream, ensures RGB format,
    and returns a float32 array normalized to [0, 1].
    """
    if isinstance(image_input, str):
        if not os.path.exists(image_input):
            raise FileNotFoundError(f"Image not found at: {image_input}")
        img_bgr = cv2.imread(image_input)
        if img_bgr is None:
            raise ValueError(f"Failed to read image at: {image_input}")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    elif isinstance(image_input, Image.Image):
        img_rgb = np.array(image_input.convert("RGB"))
    elif isinstance(image_input, np.ndarray):
        if len(image_input.shape) == 2:
            img_rgb = cv2.cvtColor(image_input, cv2.COLOR_GRAY2RGB)
        elif image_input.shape[2] == 4:
            img_rgb = cv2.cvtColor(image_input, cv2.COLOR_RGBA2RGB)
        else:
            img_rgb = image_input
    else:
        raise TypeError(f"Unsupported image input type: {type(image_input)}")
        
    return img_rgb.astype(np.float32) / 255.0

def align_image_pair(
    img1: np.ndarray, 
    img2: np.ndarray, 
    target_dim: Tuple[int, int] = (512, 512)
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Ensures both images share the exact spatial grid dimensions and radiometric range.
    """
    h, w = target_dim
    if img1.shape[:2] != (h, w):
        img1 = cv2.resize(img1, (w, h), interpolation=cv2.INTER_AREA)
    if img2.shape[:2] != (h, w):
        img2 = cv2.resize(img2, (w, h), interpolation=cv2.INTER_AREA)
        
    return img1, img2

def compute_spectral_indices(img_rgb: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Calculates optical and pseudo-spectral indices from RGB optical bands:
    - NIR pseudo-band estimation from chlorophyll / reflectance profile
    - NDVI: Normalized Difference Vegetation Index
    - NDBI: Normalized Difference Built-up Index
    - NDWI: Normalized Difference Water Index
    - Luminance: Overall panchromatic intensity
    """
    eps = 1e-6
    R = img_rgb[:, :, 0]
    G = img_rgb[:, :, 1]
    B = img_rgb[:, :, 2]
    
    # Synthetic NIR proxy for high-resolution visible imagery:
    # Healthy green canopy exhibits high G and low R/B absorption.
    # Concrete/built-up has flat high R/G/B reflectance.
    # Water has high B/G and very low R/NIR absorption.
    synthetic_nir = np.clip(1.4 * G - 0.4 * R + 0.1 * (1.0 - B), 0.0, 1.0)
    
    # NDVI: (NIR - Red) / (NIR + Red)
    ndvi = (synthetic_nir - R) / (synthetic_nir + R + eps)
    ndvi = np.clip(ndvi, -1.0, 1.0)
    
    # NDBI: Proxy for built-up / bare impervious surfaces
    # Impervious built-up reflects strongly in Red/composite compared to green absorption
    ndbi = (R - synthetic_nir) / (R + synthetic_nir + eps)
    ndbi = np.clip(ndbi, -1.0, 1.0)
    
    # NDWI: (Green - NIR) / (Green + NIR)
    ndwi = (G - synthetic_nir) / (G + synthetic_nir + eps)
    ndwi = np.clip(ndwi, -1.0, 1.0)
    
    # Panchromatic brightness
    luminance = 0.299 * R + 0.587 * G + 0.114 * B
    
    return {
        "ndvi": ndvi,
        "ndbi": ndbi,
        "ndwi": ndwi,
        "luminance": luminance,
        "R": R,
        "G": G,
        "B": B
    }

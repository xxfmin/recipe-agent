import base64
import io
import re
from PIL import Image
import google.generativeai as genai
import logfire
from ..models.ingredients import ExtractedIngredients

class GeminiService:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Gemini API key is required")
            
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def extract_ingredients_from_image(
        self, 
        image_base64: str
    ) -> ExtractedIngredients:
        """
        Extract ingredients from fridge image using Gemini Vision
        
        Args:
            image_base64: Base64 encoded image string (with or without data URL prefix)
            
        Returns:
            ExtractedIngredients object containing list of found ingredients
            
        Raises:
            Exception with user-friendly error messages
        """
        with logfire.span("extract_ingredients_from_image") as span:
            try:
                # validate input
                if not image_base64:
                    raise ValueError("No image data provided")
                
                # decode base64 image
                try:
                    # handle data URL format
                    if ',' in image_base64 and image_base64.startswith('data:'):
                        image_base64 = image_base64.split(',')[1]
                    
                    # clean and pad base64 string
                    image_base64 = image_base64.strip()
                    missing_padding = len(image_base64) % 4
                    if missing_padding:
                        image_base64 += '=' * (4 - missing_padding)
                    
                    image_bytes = base64.b64decode(image_base64)
                    
                except Exception as e:
                    logfire.error(f"Base64 decoding failed: {str(e)}")
                    raise Exception("Invalid image format. Please ensure the image is properly encoded.")
                
                # open and validate image
                try:
                    image = Image.open(io.BytesIO(image_bytes))
                    
                    # log image details
                    span.set_attribute("image_format", image.format)
                    span.set_attribute("image_size", f"{image.width}x{image.height}")
                    logfire.info(f"Processing {image.format} image: {image.width}x{image.height}")
                    
                except Exception as e:
                    logfire.error(f"Image processing failed: {str(e)}")
                    raise Exception("Unable to process the image. Please ensure it's a valid image file.")
                
                # generate content with gemini
                try:
                    prompt = """Analyze this refrigerator image and list EVERY SINGLE visible item.

                    IMPORTANT: Just list the items, one per line. No headers, no sections, no explanations.
                    Don't say "Top shelf" or "Middle shelf" - just list the actual food items.
                    
                    Be SPECIFIC with names:
                    - Include brand names when visible (e.g., "Heinz ketchup" not just "ketchup")
                    - Be specific about types (e.g., "whole milk" not just "milk")
                    - Name specific fruits/vegetables (e.g., "red bell pepper" not just "pepper")
                    
                    List EVERYTHING you can see:
                    - Every condiment
                    - Every dairy product
                    - Every fruit (individually)
                    - Every vegetable (individually)
                    - Every beverage
                    - Every jar, container, package
                    - Every other food item
                    
                    Format: Just the item name, one per line. Nothing else."""
                    
                    response = self.model.generate_content([prompt, image])
                    
                    if not response.text:
                        raise Exception("Gemini returned empty response")
                    
                except Exception as e:
                    error_msg = str(e).lower()
                    
                    # handle specific Gemini API errors
                    if "quota" in error_msg or "limit" in error_msg:
                        logfire.error("Gemini API quota exceeded")
                        raise Exception("Image analysis quota exceeded. Please try again later.")
                    elif "api_key" in error_msg or "unauthorized" in error_msg:
                        logfire.error("Gemini API key invalid")
                        raise Exception("Invalid API configuration. Please contact support.")
                    elif "safety" in error_msg:
                        logfire.warning("Gemini safety filter triggered")
                        raise Exception("Unable to analyze this image. Please try a different image.")
                    else:
                        logfire.error(f"Gemini API error: {str(e)}")
                        raise Exception(f"Failed to analyze image: {str(e)}")
                
                # parse ingredients from response
                try:
                    ingredients = []
                    lines = response.text.strip().split('\n')
                    
                    for line in lines:
                        # skip empty lines
                        if not line.strip():
                            continue
                        
                        # remove common prefixes and formatting
                        cleaned = re.sub(r'^[\d\-\•\*\.\s]+', '', line).strip()
                        
                        # skip header-like lines
                        skip_patterns = [
                            'shelf', 'compartment', 'drawer', 'section',
                            'ingredients:', 'items:', 'contents:',
                            'here are', 'i can see', 'visible items'
                        ]
                        if any(pattern in cleaned.lower() for pattern in skip_patterns):
                            continue
                        
                        # only add valid ingredient lines
                        if cleaned and len(cleaned) > 2 and any(c.isalpha() for c in cleaned):
                            ingredients.append(cleaned)
                    
                    # log results
                    span.set_attribute("ingredients_found", len(ingredients))
                    logfire.info(f"Extracted {len(ingredients)} ingredients from image")
                    
                    # validate we found something
                    if not ingredients:
                        logfire.warning("No ingredients found in image")
                        raise Exception(
                            "No ingredients could be identified in the image. "
                            "Please ensure the image clearly shows the contents of your fridge."
                        )
                    
                    return ExtractedIngredients(ingredients=ingredients)
                    
                except Exception as e:
                    # re-raise if it's already our exception
                    if "ingredients could be identified" in str(e):
                        raise
                    logfire.error(f"Failed to parse ingredients: {str(e)}")
                    raise Exception("Failed to extract ingredients from the image analysis.")
                    
            except Exception as e:
                # log final error
                span.set_attribute("error", str(e))
                span.set_attribute("status", "error")
                
                # re-raise if it's already a user-friend
                if any(msg in str(e) for msg in [
                    "Invalid image format",
                    "Unable to process",
                    "quota exceeded",
                    "Invalid API configuration",
                    "No ingredients could be identified",
                    "Failed to extract ingredients"
                ]):
                    raise
                
                # generic error fallback
                logfire.error(f"Unexpected error in extract_ingredients_from_image: {str(e)}")
                raise Exception("An unexpected error occurred while analyzing the image. Please try again.")

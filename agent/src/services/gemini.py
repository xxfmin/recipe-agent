import base64
import io
import re
from PIL import Image
import google.generativeai as genai
import logfire
from ..models.ingredients import ExtractedIngredients

class GeminiService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def extract_ingredients_from_image(
        self, 
        image_base64: str
    ) -> ExtractedIngredients:
        """Extract ingredients from fridge image"""
        with logfire.span("extract_ingredients_from_image"):
            # decode image
            if ',' in image_base64 and image_base64.startswith('data:'):
                image_base64 = image_base64.split(',')[1]
            
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes))
            
            # generate content
            prompt = """Analyze this refrigerator image and list EVERY visible item.
            List items one per line, be specific with brands and types."""
            
            response = self.model.generate_content([prompt, image])
            
            # parse ingredients
            ingredients = []
            for line in response.text.strip().split('\n'):
                cleaned = re.sub(r'^[\d\-\•\*\.\s]+', '', line).strip()
                if cleaned and len(cleaned) > 2:
                    ingredients.append(cleaned)
            
            return ExtractedIngredients(ingredients=ingredients)
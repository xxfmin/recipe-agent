from dataclasses import dataclass
from typing import Optional, List, Dict
from httpx import AsyncClient

from ..models.ingredients import ExtractedIngredients
from ..models.recipe import RecipeDetails

from ..services.spoonacular import SpoonacularService
from ..services.gemini import GeminiService

@dataclass
class Deps:
    client: AsyncClient
    spoonacular_api_key: str
    gemini_api_key: str

    # workflow type
    has_image: bool = False
    user_query: Optional[str] = None

    # image workflow state
    image_base64: Optional[str] = None # fridge image
    extracted_ingredients: Optional[ExtractedIngredients] = None # ingredients extracted from image
    formatted_ingredients: Optional[str] = None # string with ingredients selected for recipe search
    ingredient_search_results: Optional[List[Dict]] = None # recipes using formatted_ingredients

    # shared final state
    recipe_details: Optional[List[RecipeDetails]] = None # recipe full details

    # service instances
    _spoonacular_service: Optional[SpoonacularService] = None
    _gemini_service: Optional[GeminiService] = None

    @property
    def spoonacular(self) -> SpoonacularService:
        if not self._spoonacular_service:
            self._spoonacular_service = SpoonacularService(self.spoonacular_api_key)
        return self._spoonacular_service
    
    @property
    def gemini(self) -> GeminiService:
        if not self._gemini_service:
            self._gemini_service = GeminiService(self.gemini_api_key)
        return self._gemini_service

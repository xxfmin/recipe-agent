from typing import List, Dict
from httpx import AsyncClient
from ..models.recipe import RecipeDetails, RecipeSearchParams

class SpoonacularService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.spoonacular.com"
    
    async def search_by_ingredients(
        self, 
        ingredients: str, 
        number: int = 20,
        ranking: int = 2
    ) -> List[Dict]:
        """For fridge workflow - returns basic recipe info"""
        async with AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/recipes/findByIngredients",
                params={
                    "ingredients": ingredients,
                    "number": number,
                    "ranking": ranking,
                    "ignorePantry": True,
                    "apiKey": self.api_key
                }
            )
            return response.json()
    
    async def get_recipe_details_bulk(
        self, 
        recipe_ids: List[int]
    ) -> List[RecipeDetails]:
        """For fridge workflow - gets full details"""
        async with AsyncClient() as client:
            ids_str = ",".join(str(id) for id in recipe_ids)
            response = await client.get(
                f"{self.base_url}/recipes/informationBulk",
                params={
                    "ids": ids_str,
                    "includeNutrition": True,
                    "apiKey": self.api_key
                }
            )
            # parse to RecipeDetails objects
            return [RecipeDetails(**data) for data in response.json()]
    
    async def complex_search(
        self,
        params: RecipeSearchParams
    ) -> List[RecipeDetails]:
        """For text queries - returns full details directly"""
        async with AsyncClient() as client:
            request_params = {
                "query": params.query,
                "number": params.number,
                "apiKey": self.api_key,
                "addRecipeInformation": True,
                "addRecipeNutrition": True,
                "fillIngredients": True,
            }
            
            # add optional parameters
            if params.cuisine:
                request_params["cuisine"] = params.cuisine
            if params.intolerances:
                request_params["intolerances"] = params.intolerances
            if params.includeIngredients:
                request_params["includeIngredients"] = params.includeIngredients
            if params.excludeIngredients:
                request_params["excludeIngredients"] = params.excludeIngredients
            if params.maxReadyTime:
                request_params["maxReadyTime"] = params.maxReadyTime
            
            response = await client.get(
                f"{self.base_url}/recipes/complexSearch",
                params=request_params
            )
            data = response.json()
            return [RecipeDetails(**r) for r in data.get('results', [])]
from typing import List, Dict
from httpx import AsyncClient, HTTPStatusError
import logfire
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
        """
        For fridge workflow - returns basic recipe info with used/missed ingredients
        
        Args:
            ingredients: Comma-separated list of ingredients
            number: Number of recipes to return
            ranking: 1 = maximize used ingredients, 2 = minimize missing ingredients
            
        Returns:
            List of recipe dictionaries with basic info and ingredient matches
        """
        try:
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
                response.raise_for_status()
                
                recipes = response.json()
                logfire.info(f"Found {len(recipes)} recipes with ingredients: {ingredients[:50]}...")
                return recipes
                
        except HTTPStatusError as e:
            if e.response.status_code == 402:
                logfire.error("Spoonacular API quota exceeded")
                raise Exception("Recipe search quota exceeded. Please try again later.")
            elif e.response.status_code == 401:
                logfire.error("Invalid Spoonacular API key")
                raise Exception("Invalid API configuration. Please contact support.")
            else:
                logfire.error(f"Spoonacular API HTTP error: {e.response.status_code}")
                raise Exception(f"Recipe search failed: {e.response.status_code}")
                
        except Exception as e:
            logfire.error(f"Spoonacular search_by_ingredients error: {str(e)}")
            raise Exception(f"Failed to search recipes: {str(e)}")
    
    async def get_recipe_details_bulk(
        self, 
        recipe_ids: List[int]
    ) -> List[RecipeDetails]:
        """
        For fridge workflow - gets full details for multiple recipes
        
        Args:
            recipe_ids: List of recipe IDs to fetch
            
        Returns:
            List of RecipeDetails objects with full information
        """
        if not recipe_ids:
            return []
            
        try:
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
                response.raise_for_status()
                
                recipes_data = response.json()
                
                # parse to RecipeDetails objects with error handling
                parsed_recipes = []
                for recipe_data in recipes_data:
                    try:
                        # handle missing extendedIngredients
                        if 'extendedIngredients' in recipe_data and 'ingredients' not in recipe_data:
                            recipe_data['ingredients'] = recipe_data['extendedIngredients']
                        
                        recipe = RecipeDetails(**recipe_data)
                        parsed_recipes.append(recipe)
                        
                    except Exception as parse_error:
                        recipe_id = recipe_data.get('id', 'unknown')
                        recipe_title = recipe_data.get('title', 'Unknown')
                        logfire.warning(
                            f"Failed to parse recipe {recipe_id} ({recipe_title}): {parse_error}"
                        )
                        # skip this recipe but continue with others
                        continue
                
                logfire.info(f"Successfully parsed {len(parsed_recipes)}/{len(recipes_data)} recipes")
                return parsed_recipes
                
        except HTTPStatusError as e:
            if e.response.status_code == 402:
                logfire.error("Spoonacular API quota exceeded")
                raise Exception("Recipe details quota exceeded. Please try again later.")
            else:
                logfire.error(f"Spoonacular API HTTP error: {e.response.status_code}")
                raise Exception(f"Failed to get recipe details: {e.response.status_code}")
                
        except Exception as e:
            logfire.error(f"Spoonacular get_recipe_details_bulk error: {str(e)}")
            raise Exception(f"Failed to get recipe details: {str(e)}")
    
    async def complex_search(
        self,
        params: RecipeSearchParams
    ) -> List[RecipeDetails]:
        """
        For text queries - returns full recipe details directly
        
        Args:
            params: Recipe search parameters from natural language extraction
            
        Returns:
            List of RecipeDetails objects with full information
        """
        try:
            async with AsyncClient() as client:
                request_params = {
                    "query": params.query,
                    "number": params.number,
                    "apiKey": self.api_key,
                    "addRecipeInformation": True,
                    "addRecipeNutrition": True,
                    "fillIngredients": True,
                }
                
                # add optional parameters only if they have values
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
                response.raise_for_status()
                
                data = response.json()
                recipes_data = data.get('results', [])
                total_results = data.get('totalResults', 0)
                
                logfire.info(
                    f"Complex search for '{params.query}' found {len(recipes_data)} recipes "
                    f"(total available: {total_results})"
                )
                
                # parse to RecipeDetails objects with error handling
                parsed_recipes = []
                for recipe_data in recipes_data:
                    try:
                        # handle missing extendedIngredients
                        if 'extendedIngredients' in recipe_data and 'ingredients' not in recipe_data:
                            recipe_data['ingredients'] = recipe_data['extendedIngredients']
                        
                        recipe = RecipeDetails(**recipe_data)
                        parsed_recipes.append(recipe)
                        
                    except Exception as parse_error:
                        recipe_id = recipe_data.get('id', 'unknown')
                        recipe_title = recipe_data.get('title', 'Unknown')
                        logfire.warning(
                            f"Failed to parse recipe {recipe_id} ({recipe_title}) "
                            f"in complex search: {parse_error}"
                        )
                        continue
                
                return parsed_recipes
                
        except HTTPStatusError as e:
            if e.response.status_code == 402:
                logfire.error("Spoonacular API quota exceeded")
                raise Exception("Recipe search quota exceeded. Please try again later.")
            elif e.response.status_code == 401:
                logfire.error("Invalid Spoonacular API key")
                raise Exception("Invalid API configuration. Please contact support.")
            else:
                logfire.error(f"Spoonacular API HTTP error: {e.response.status_code}")
                raise Exception(f"Recipe search failed: {e.response.status_code}")
                
        except Exception as e:
            logfire.error(f"Spoonacular complex_search error: {str(e)}")
            raise Exception(f"Failed to search recipes: {str(e)}")
from ..services.spoonacular import SpoonacularService
from .query_extractor import query_extractor

class RecipeAgent:
    def __init__(self, spoonacular_service: SpoonacularService):
        self.spoonacular = spoonacular_service

    async def run(self, query: str):
        # extract search parameters
        extraction_result = await query_extractor.run(query)
        search_params = extraction_result.data
        # search recipes
        recipes = await self.spoonacular.complex_search(search_params)
        # fetch full details for all recipe IDs to ensure instructions are included
        recipe_ids = [recipe.id for recipe in recipes]
        detailed_recipes = await self.spoonacular.get_recipe_details_bulk(recipe_ids) if recipe_ids else []
        recipe_dicts = [recipe.model_dump() for recipe in detailed_recipes]
        return {
            "type": "complete",
            "message": f"Found {len(recipe_dicts)} recipes matching '{search_params.query}'",
            "recipes": recipe_dicts,
            "summary": {
                "query": query,
                "total_recipes": len(recipe_dicts)
            }
        } 
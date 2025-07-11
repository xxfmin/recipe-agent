from ..agents.formatter import formatter_agent
from ..services.gemini import GeminiService
from ..services.spoonacular import SpoonacularService
from ..models.chat import StreamResponse

class FridgeAgent:
    """
    Agent for handling fridge image workflows: extract ingredients, format, search recipes, get details.
    Streams progress updates for each step.
    """
    def __init__(self, deps):
        self.deps = deps

    async def run(self, image_base64: str):
        # 1) analyze fridge image
        yield {
            "type": "step",
            "step": "analyze_image",
            "status": "in_progress",
            "message": "Analyzing your fridge contents..."
        }
        try:
            extracted = await self.deps.gemini.extract_ingredients_from_image(image_base64)
            self.deps.extracted_ingredients = extracted
            yield {
                "type": "step",
                "step": "analyze_image",
                "status": "complete",
                "message": f"Found {len(extracted.ingredients)} ingredients",
                "data": {
                    "ingredients_count": len(extracted.ingredients),
                    "ingredients": extracted.ingredients
                }
            }
        except Exception as e:
            yield {
                "type": "error",
                "step": "analyze_image",
                "message": str(e)
            }
            return
        # 2) format ingredients
        yield {
            "type": "step",
            "step": "format_ingredients",
            "status": "in_progress",
            "message": "Selecting the best ingredients for recipe search..."
        }
        try:
            result = await formatter_agent.run(f"Format these ingredients: {', '.join(extracted.ingredients)}")
            self.deps.formatted_ingredients = result.data.ingredients
            yield {
                "type": "step",
                "step": "format_ingredients",
                "status": "complete",
                "message": "Ingredients formatted successfully",
                "summary": {
                    "ingredients_used_for_search": self.deps.formatted_ingredients
                }
            }
        except Exception as e:
            yield {
                "type": "error",
                "step": "format_ingredients",
                "message": f"Failed to format ingredients: {str(e)}"
            }
            return
        # 3) search recipes
        yield {
            "type": "step",
            "step": "search_recipes",
            "status": "in_progress",
            "message": "Searching for recipes you can make..."
        }
        try:
            results = await self.deps.spoonacular.search_by_ingredients(self.deps.formatted_ingredients)
            self.deps.ingredient_search_results = results
            if len(results) == 0:
                yield {
                    "type": "complete",
                    "message": "No recipes found with those ingredients. Try adding more ingredients or using different ones.",
                    "recipes": []
                }
                return
            yield {
                "type": "step",
                "step": "search_recipes",
                "status": "complete",
                "message": f"Found {len(results)} recipes",
                "data": {
                    "recipe_count": len(results)
                }
            }
        except Exception as e:
            yield {
                "type": "error",
                "step": "search_recipes",
                "message": str(e)
            }
            return
        # 4) get recipe details
        yield {
            "type": "step",
            "step": "get_details",
            "status": "in_progress",
            "message": "Getting detailed recipe information..."
        }
        try:
            recipe_ids = [r['id'] for r in results]
            details = await self.deps.spoonacular.get_recipe_details_bulk(recipe_ids)
            search_results_map = {r['id']: r for r in results}
            enhanced_recipes = []
            for recipe in details:
                recipe_dict = recipe.model_dump()
                if recipe.id in search_results_map:
                    search_result = search_results_map[recipe.id]
                    recipe_dict['usedIngredients'] = search_result.get('usedIngredients', [])
                    recipe_dict['missedIngredients'] = search_result.get('missedIngredients', [])
                    recipe_dict['usedIngredientCount'] = search_result.get('usedIngredientCount', 0)
                    recipe_dict['missedIngredientCount'] = search_result.get('missedIngredientCount', 0)
                enhanced_recipes.append(recipe_dict)
            enhanced_recipes.sort(
                key=lambda r: (
                    r.get('usedIngredientCount', 0),
                    -r.get('missedIngredientCount', 0)
                ),
                reverse=True
            )
            yield {
                "type": "complete",
                "message": f"Found {len(enhanced_recipes)} delicious recipes you can make with your ingredients!",
                "recipes": enhanced_recipes,
                "summary": {
                    "total_ingredients_found": len(extracted.ingredients),
                    "ingredients_used_for_search": self.deps.formatted_ingredients,
                    "total_recipes": len(enhanced_recipes)
                }
            }
        except Exception as e:
            yield {
                "type": "error",
                "step": "get_details",
                "message": str(e)
            }
            return 
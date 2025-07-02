import logfire
from typing import Dict
from pydantic_ai import RunContext

from ..models.deps import Deps
from ..agents.formatter import formatter_agent
from ..models.recipe import RecipeDetails

# 1) analyze ingredients within fridge
async def analyze_fridge_image(ctx: RunContext[Deps]) -> str:
    """Extract ingredients from fridge image"""
    if not ctx.deps.image_base64:
        return "No image provided"
    
    extracted = await ctx.deps.gemini.extract_ingredients_from_image(
        ctx.deps.image_base64
    )
    
    ctx.deps.extracted_ingredients = extracted
    logfire.info(f"Extracted {len(extracted.ingredients)} ingredients")
    return f"Found {len(extracted.ingredients)} ingredients"

# 2) format ingredients
async def format_ingredients_for_search(ctx: RunContext[Deps]) -> str:
    """Format extracted ingredients for recipe search"""
    if not ctx.deps.extracted_ingredients:
        return "No ingredients to format"
    
    result = await formatter_agent.run(
        f"Format these ingredients: {', '.join(ctx.deps.extracted_ingredients.ingredients)}"
    )
    
    ctx.deps.formatted_ingredients = result.data.ingredients
    return f"Formatted ingredients: {ctx.deps.formatted_ingredients}"

# 3) find recipes using the formatted ingredients
async def search_recipes_by_ingredients(ctx: RunContext[Deps]) -> str:
    """Search recipes using available ingredients"""
    if not ctx.deps.formatted_ingredients:
        return "No formatted ingredients"
    
    results = await ctx.deps.spoonacular.search_by_ingredients(
        ctx.deps.formatted_ingredients
    )
    
    ctx.deps.ingredient_search_results = results
    return f"Found {len(results)} recipes"

# 4) get details of the recipes using extracted ingredients
async def get_recipe_details_for_ingredient_search(ctx: RunContext[Deps]) -> str:
    """Get full details for recipes found by ingredients"""
    if not ctx.deps.ingredient_search_results:
        return "No recipes to get details for"
    
    recipe_ids = [r['id'] for r in ctx.deps.ingredient_search_results]
    details = await ctx.deps.spoonacular.get_recipe_details_bulk(recipe_ids)
    
    # create a mapping of search results by ID for quick lookup
    search_results_map = {r['id']: r for r in ctx.deps.ingredient_search_results}
    
    # enhance each recipe with ingredient match information
    enhanced_recipes = []
    for recipe in details:
        # convert to dict to modify
        recipe_dict = recipe.model_dump()
        
        # add ingredient match info from search results
        if recipe.id in search_results_map:
            search_result = search_results_map[recipe.id]
            recipe_dict['usedIngredients'] = search_result.get('usedIngredients', [])
            recipe_dict['missedIngredients'] = search_result.get('missedIngredients', [])
            recipe_dict['usedIngredientCount'] = search_result.get('usedIngredientCount', 0)
            recipe_dict['missedIngredientCount'] = search_result.get('missedIngredientCount', 0)
        
        # create RecipeDetails with the added fields
        enhanced_recipe = RecipeDetails(**recipe_dict)
        enhanced_recipes.append(enhanced_recipe)
    
    ctx.deps.recipe_details = enhanced_recipes
    return f"Retrieved details for {len(enhanced_recipes)} recipes"

# main workflow function
async def run_image_workflow(ctx: RunContext[Deps]) -> Dict:
    """Execute complete image workflow"""
    steps = [
        ("Analyzing image", analyze_fridge_image),
        ("Formatting ingredients", format_ingredients_for_search),
        ("Searching recipes", search_recipes_by_ingredients),
        ("Getting details", get_recipe_details_for_ingredient_search)
    ]
    
    results = {}
    for step_name, step_func in steps:
        logfire.info(f"Running: {step_name}")
        result = await step_func(ctx)
        results[step_name] = result
        
        # stop if step failed
        if "No" in result or "error" in result.lower():
            break
    
    return results
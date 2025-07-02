from pydantic_ai import Agent, RunContext
from pydantic_ai.models.gemini import GeminiModel

from .query_extractor import query_extractor
from .formatter import formatter_agent

from ..models.deps import Deps

orchestrator = Agent(
    model=GeminiModel(model_name="gemini-2.0-flash"),
    deps_type=Deps,
    result_type=str,
    system_prompt="""
    You help users find recipes through two methods:
    1. Analyzing fridge images to find recipes based on available ingredients
    2. Searching for specific recipes based on their requirements

    Choose the appropriate workflow based on the input.
    """
)

# query workflow tool
@orchestrator.tool
async def search_recipes_by_query(ctx: RunContext[Deps]) -> str:
    """Search recipes using complex search for text queries"""
    if not ctx.deps.user_query:
        return "No search query provided"
    
    # extract parameters from natural language using query extractor agent
    extraction_result = await query_extractor.run(ctx.deps.user_query)
    search_params = extraction_result.output

    recipes = await ctx.deps.spoonacular.complex_search(search_params)
    ctx.deps.recipe_details = recipes
    
    # response message
    msg_parts = [f"Found {len(recipes)} recipes matching '{search_params.query}'"]
    if search_params.cuisine:
        msg_parts.append(f"cuisine: {search_params.cuisine}")
    if search_params.intolerances:
        msg_parts.append(f"avoiding: {search_params.intolerances}")
    if search_params.maxReadyTime:
        msg_parts.append(f"ready in {search_params.maxReadyTime} min or less")
        
    return " | ".join(msg_parts)

# image workflow tools
# 1) analyze fridge
@orchestrator.tool
async def analyze_fridge_image(ctx: RunContext[Deps]) -> str:
    """Extract ingredients from fridge image"""
    if not ctx.deps.image_base64:
        return "No image provided"
    
    extracted = await ctx.deps.gemini.extract_ingredients_from_image(
        ctx.deps.image_base64
    )

    ctx.deps.extracted_ingredients = extracted
    return f"Found {len(extracted.ingredients)} ingredients"

# 2) format ingredients
@orchestrator.tool
async def format_ingredients_for_search(ctx: RunContext[Deps]) -> str:
    """Format extracted ingredients for recipe search"""
    if not ctx.deps.extracted_ingredients:
        return "No ingredients formatted"
    
    # use formatter agent
    result = await formatter_agent.run(
        f"Format these ingredients: {', '.join(ctx.deps.extracted_ingredients.ingredients)}"
    )

    ctx.deps.formatted_ingredients = result.output.ingredients
    return f"Formatted ingredients: {ctx.deps.formatted_ingredients}"

# 3) find recipes using the formatted ingredients
@orchestrator.tool
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
@orchestrator.tool
async def get_recipe_details_for_ingredient_search(ctx: RunContext[Deps]) -> str:
    """Get full details for recipes found by ingredients"""
    if not ctx.deps.ingredient_search_results:
        return "No recipes to get details for"
    
    recipe_ids = [r['id'] for r in ctx.deps.ingredient_search_results] # spoonacular id
    details = await ctx.deps.spoonacular.get_recipe_details_bulk(recipe_ids)

    for detail in details:
        for result in ctx.deps.ingredient_search_results:
            if result['id'] == detail.id:
                detail.used_ingredients = result.get('usedIngredients', [])
                detail.missed_ingredients = result.get('missedIngredients', [])
                break

    ctx.deps.recipe_details = details
    return f"Retrieved details for {len(details)} recipes"
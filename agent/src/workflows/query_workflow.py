import logfire
from pydantic_ai import RunContext

from ..models.deps import Deps
from ..agents.query_extractor import query_extractor

async def search_recipes_by_query(ctx: RunContext[Deps]) -> str:
    """Search recipes using complex search for text queries"""
    if not ctx.deps.user_query:
        return "No search query provided"
    
    # extract parameters from natural language
    extraction_result = await query_extractor.run(ctx.deps.user_query)
    search_params = extraction_result.data
    
    logfire.info(f"Extracted params: {search_params}")
    
    # search recipes
    recipes = await ctx.deps.spoonacular.complex_search(search_params)
    ctx.deps.recipe_details = recipes
    
    # build response message
    msg_parts = [f"Found {len(recipes)} recipes matching '{search_params.query}'"]
    if search_params.cuisine:
        msg_parts.append(f"cuisine: {search_params.cuisine}")
    if search_params.intolerances:
        msg_parts.append(f"avoiding: {search_params.intolerances}")
    if search_params.maxReadyTime:
        msg_parts.append(f"ready in {search_params.maxReadyTime} min or less")
        
    return " | ".join(msg_parts)

# main workflow function
async def run_query_workflow(ctx: RunContext[Deps]) -> str:
    """Execute query workflow"""
    return await search_recipes_by_query(ctx)
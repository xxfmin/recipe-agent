from pydantic_ai import Agent, RunContext
from pydantic_ai.models.gemini import GeminiModel

from ..workflows.query_workflow import search_recipes_by_query
from ..workflows.image_workflow import (
    analyze_fridge_image,
    format_ingredients_for_search,
    search_recipes_by_ingredients,
    get_recipe_details_for_ingredient_search
)

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

# query workflow
orchestrator.tool(search_recipes_by_query)

# image analysis workflow
orchestrator.tool(analyze_fridge_image)
orchestrator.tool(format_ingredients_for_search)
orchestrator.tool(search_recipes_by_ingredients)
orchestrator.tool(get_recipe_details_for_ingredient_search)

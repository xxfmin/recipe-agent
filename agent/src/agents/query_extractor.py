from pydantic_ai import Agent
from pydantic_ai.models.gemini import GeminiModel
from ..models.recipe import RecipeSearchParams

query_extractor = Agent(
    model=GeminiModel(model_name="gemini-2.0-flash"),
    result_type=RecipeSearchParams,
    system_prompt="""
    Extract recipe search parameters from the user's natural language query.     
    Parse time expressions like 'less than an hour' to minutes (60). 
    Extract specific ingredients mentioned.
    Identify the main dish being searched for.

    Examples:
    - "gluten-free pasta under 30 minutes" → intolerances: "gluten", maxReadyTime: 30, query: "pasta"
    - "healthy vegetarian dinner without nuts" → excludeIngredients: "nuts", query: "vegetarian dinner"
    - "quick Italian dishes" → cuisine: "italian", query: "quick dishes"
    """
)
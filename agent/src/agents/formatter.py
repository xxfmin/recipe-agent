from pydantic_ai import Agent
from pydantic_ai.models.gemini import GeminiModel
from ..models.ingredients import IngredientSearchParams

formatter_agent = Agent(
    model=GeminiModel(model_name="gemini-2.0-flash"),
    result_type=IngredientSearchParams,
    system_prompt="""
    Convert extracted ingredients into recipe search parameters.
    Focus on main cooking ingredients, limit to 10-15 most versatile items.
    """
)
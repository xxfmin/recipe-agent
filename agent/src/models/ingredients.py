from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedIngredients(BaseModel):
    """ Ingredients extracted from fridge image """
    ingredients: List[str] = Field(
        default_factory=list,
        description="List of all ingredients found in the image"
    )

class IngredientSearchParams(BaseModel):
    """ Formatted parameters for recipe search by ingredients """
    ingredients: str = Field(
        ...,
        description="Comma-separated list of ingredients for recipe search"
    )
    number: int = Field(default=20)
    ranking: int = Field(
        default=2,
        description="1: maximize used ingredients, 2: minimize missing ingredients"
    )

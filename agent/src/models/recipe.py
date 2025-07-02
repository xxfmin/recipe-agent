from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class NutritionInfo(BaseModel):
    calories: Optional[float] = None
    fat: Optional[float] = None
    carbohydrates: Optional[float] = None
    protein: Optional[float] = None

class Ingredient(BaseModel):
    name: str = ""
    amount: float = 0
    unit: str = ""

class InstructionStep(BaseModel):
    number: int = 0
    step: str = ""
    length: int = 0  # in minutes

# structure return recipes
class RecipeDetails(BaseModel):
    id: int
    title: str
    image: str = ""
    readyInMinutes: int = 0
    preparationMinutes: Optional[int] = None
    cookingMinutes: Optional[int] = None
    nutrition: NutritionInfo = Field(default_factory=NutritionInfo)
    ingredients: List[Ingredient] = Field(default_factory=list)
    summary: str = ""
    analyzedInstructions: List[InstructionStep] = Field(default_factory=list)

    # fields for ingredient-based search results
    usedIngredients: Optional[List[Dict[str, Any]]] = None
    missedIngredients: Optional[List[Dict[str, Any]]] = None
    usedIngredientCount: Optional[int] = None
    missedIngredientCount: Optional[int] = None

    @field_validator('nutrition', mode='before')
    def extract_nutrients(cls, v):
        if v is None:
            return NutritionInfo()
        if isinstance(v, dict) and 'nutrients' in v:
            result = {}
            for nutrient in v.get('nutrients', []):
                name = nutrient.get('name', '')
                amount = nutrient.get('amount', 0)
                if name == 'Calories':
                    result['calories'] = amount
                elif name == 'Fat':
                    result['fat'] = amount
                elif name == 'Carbohydrates':
                    result['carbohydrates'] = amount
                elif name == 'Protein':
                    result['protein'] = amount
            return NutritionInfo(**result)
        elif isinstance(v, dict):
            return NutritionInfo(**v)
        return NutritionInfo()
    
    @field_validator('ingredients', mode='before')
    def extract_ingredients(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            result = []
            for ingredient in v:
                if isinstance(ingredient, dict):
                    result.append(Ingredient(
                        name=ingredient.get('name', ingredient.get('originalName', ingredient.get('original', ''))),
                        amount=ingredient.get('amount', ingredient.get('measures', {}).get('us', {}).get('amount', 0)),
                        unit=ingredient.get('unit', ingredient.get('measures', {}).get('us', {}).get('unitShort', ''))
                    ))
            return result
        return []
    
    @field_validator('analyzedInstructions', mode='before')
    def extract_instructions(cls, v):
        if v is None:
            return []
        
        if isinstance(v, list):
            all_steps = []
            for item in v:
                if isinstance(item, dict):
                    steps = item.get('steps', [])
                    for step in steps:
                        if isinstance(step, dict):
                            all_steps.append(InstructionStep(
                                number=step.get('number', 0),
                                step=step.get('step', ''),
                                length=step.get('length', {}).get('number', 0) if isinstance(step.get('length'), dict) else 0
                            ))
            return all_steps
        return []
    
class RecipeSearchParams(BaseModel):
    query: str = Field(description="The main recipe search query")
    number: int = Field(default=10, description="Number of results to return")
    cuisine: Optional[str] = Field(default=None, description="The cuisine type")
    intolerances: Optional[str] = Field(default=None, description="Comma-separated list of intolerances")
    includeIngredients: Optional[str] = Field(default=None, description="Comma-separated list of ingredients that should be included")
    excludeIngredients: Optional[str] = Field(default=None, description="Comma-separated list of ingredients that should be excluded")
    maxReadyTime: Optional[int] = Field(default=None, description="Maximum time in minutes for the recipe to be ready")


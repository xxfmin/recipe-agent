interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  preparationMinutes?: number;
  cookingMinutes?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
  };
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  analyzedInstructions: Array<{
    number: number;
    step: string;
    length: number;
  }>;
  summary?: string;
  // for ingredient-based search
  usedIngredients?: any[];
  missedIngredients?: any[];
  usedIngredientCount?: number;
  missedIngredientCount?: number;
}

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

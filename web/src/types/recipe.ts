export interface Recipe {
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
  usedIngredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
  }>;
  missedIngredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
  }>;
  usedIngredientCount?: number;
  missedIngredientCount?: number;
}

export interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

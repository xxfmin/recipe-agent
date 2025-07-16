import { NextRequest, NextResponse } from "next/server";
import { Recipe } from "@/types/recipe";

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!SPOONACULAR_API_KEY) {
      return NextResponse.json(
        { error: "Spoonacular API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.spoonacular.com/recipes/random?apiKey=${SPOONACULAR_API_KEY}&number=5&includeNutrition=true`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recipes from Spoonacular");
    }

    const data = await response.json();

    // transform data to match Recipe type
    const recipes: Recipe[] = data.recipes.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || "",
      readyInMinutes: recipe.readyInMinutes || 0,
      preparationMinutes: recipe.preparationMinutes,
      cookingMinutes: recipe.cookingMinutes,
      nutrition: recipe.nutrition
        ? {
            calories: recipe.nutrition.nutrients?.find(
              (n: any) => n.name === "Calories"
            )?.amount,
            protein: recipe.nutrition.nutrients?.find(
              (n: any) => n.name === "Protein"
            )?.amount,
            carbohydrates: recipe.nutrition.nutrients?.find(
              (n: any) => n.name === "Carbohydrates"
            )?.amount,
            fat: recipe.nutrition.nutrients?.find((n: any) => n.name === "Fat")
              ?.amount,
          }
        : undefined,
      ingredients:
        recipe.extendedIngredients?.map((ing: any) => ({
          name: ing.name || ing.originalName || "",
          amount: ing.amount || 0,
          unit: ing.unit || "",
        })) || [],
      analyzedInstructions:
        recipe.analyzedInstructions?.[0]?.steps?.map((step: any) => ({
          number: step.number,
          step: step.step,
          length: step.length?.number || 0,
        })) || [],
      summary: recipe.summary || "",
    }));

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Error fetching popular recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch popular recipes" },
      { status: 500 }
    );
  }
}

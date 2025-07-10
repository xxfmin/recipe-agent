"use client";
import React, { useState, useContext } from "react";
import { Card, CarouselContext } from "./carousel";
import { Clock, Users, Flame, Check, ChefHat, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RecipeCard({ recipe, index }: RecipeCardProps) {
  // Format the recipe data for the carousel card component
  const cardData = {
    src: recipe.image || "/api/placeholder/400/600",
    title: recipe.title,
    category: `${recipe.readyInMinutes} mins`,
    content: <RecipeCardContent recipe={recipe} />,
    recipeId: recipe.id,
    recipeData: recipe,
  };

  return <Card card={cardData} index={index} layout={true} />;
}

// Helper function to format ingredient display
function formatIngredient(ingredient: {
  name: string;
  amount: number;
  unit: string;
}): string {
  const { name, amount, unit } = ingredient;

  if (amount > 0) {
    // Round to 2 decimal places if needed
    const formattedAmount = amount % 1 === 0 ? amount : amount.toFixed(2);

    if (unit && unit.trim() !== "") {
      return `${formattedAmount} ${unit} ${name}`;
    } else {
      return `${formattedAmount} ${name}`;
    }
  } else {
    return name;
  }
}

// Content shown when card is expanded
function RecipeCardContent({ recipe }: { recipe: Recipe }) {
  const { savedRecipes, setSavedRecipes } = useContext(CarouselContext);
  const [isLoading, setIsLoading] = useState(false);

  const isSaved = savedRecipes.has(recipe.id);

  const handleSave = async () => {
    if (isSaved) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(recipe),
      });

      if (response.ok) {
        setSavedRecipes(recipe.id);
        console.log("Recipe saved successfully!");
      }
    } catch (error) {
      console.error("Error saving recipe: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* image */}
      {recipe.image && (
        <div className="relative h-64 w-full overflow-hidden rounded-xl">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* ingredient match info (for fridge-based searches) */}
      {recipe.usedIngredientCount !== undefined && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <h3 className="text-sm font-semibold mb-2 text-green-800">
            Ingredient Match
          </h3>
          <div className="space-y-2">
            {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">
                  ✓ Uses {recipe.usedIngredientCount} of your ingredients:
                </p>
                <div className="flex flex-wrap gap-1">
                  {recipe.usedIngredients.map((ing: any, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs bg-green-100"
                    >
                      {ing.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {recipe.missedIngredients &&
              recipe.missedIngredients.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-1">
                    ⚠ You'll need {recipe.missedIngredientCount} more:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.missedIngredients
                      .slice(0, 5)
                      .map((ing: any, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs bg-orange-100"
                        >
                          {ing.name}
                        </Badge>
                      ))}
                    {recipe.missedIngredients.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{recipe.missedIngredients.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{recipe.readyInMinutes} minutes total</span>
        </div>
        {recipe.preparationMinutes && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {recipe.preparationMinutes} min prep
            </span>
          </div>
        )}
        {recipe.cookingMinutes && (
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{recipe.cookingMinutes} min cook</span>
          </div>
        )}
      </div>

      {/* nutrition */}
      {recipe.nutrition && (
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Nutrition per serving</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recipe.nutrition.calories !== undefined && (
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(recipe.nutrition.calories)}
                </p>
                <p className="text-xs text-gray-500">Calories</p>
              </div>
            )}
            {recipe.nutrition.protein !== undefined && (
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(recipe.nutrition.protein)}g
                </p>
                <p className="text-xs text-gray-500">Protein</p>
              </div>
            )}
            {recipe.nutrition.carbohydrates !== undefined && (
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(recipe.nutrition.carbohydrates)}g
                </p>
                <p className="text-xs text-gray-500">Carbs</p>
              </div>
            )}
            {recipe.nutrition.fat !== undefined && (
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(recipe.nutrition.fat)}g
                </p>
                <p className="text-xs text-gray-500">Fat</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* summary */}
      {recipe.summary && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">About this recipe</h3>
          <div
            className="prose prose-sm max-w-none text-gray-600"
            dangerouslySetInnerHTML={{
              __html: recipe.summary.replace(/<[^>]*>/g, ""), // Strip HTML tags
            }}
          />
        </div>
      )}

      {/* ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Ingredients
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2 text-gray-400">•</span>
                <span className="text-sm">{formatIngredient(ingredient)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* instructions */}
      {recipe.analyzedInstructions &&
        recipe.analyzedInstructions.length > 0 && (
          <div>
            <h3 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Instructions
            </h3>
            <ol className="space-y-3">
              {recipe.analyzedInstructions.map((step, idx) => (
                <li key={idx} className="flex">
                  <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                    {step.number}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{step.step}</p>
                    {step.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        ~{step.length} minutes
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

      {/* save recipe button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaved || isLoading}
          className={cn("w-full", isSaved && "bg-green-600 hover:bg-green-600")}
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving Recipe...
            </>
          ) : isSaved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Recipe Saved!
            </>
          ) : (
            "Save to My Recipes"
          )}
        </Button>
      </div>
    </div>
  );
}

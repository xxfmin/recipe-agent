"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Recipe } from "@/types/recipe";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SavedRecipeCard } from "@/components/dashboard/saved-recipe-card";

// extended Recipe type with savedAt field
interface SavedRecipe extends Recipe {
  savedAt?: string;
}

export default function MyRecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadRecipes();
    }
  }, [status, router]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/recipe", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load recipes");
      }

      const data = await response.json();
      
      // transform the backend recipe format to match frontend Recipe type
      const transformedRecipes = data.recipes.map((recipe: any) => ({
        id: recipe.spoonacularId,
        title: recipe.title,
        image: recipe.image || "",
        readyInMinutes: recipe.readyInMinutes || 0,
        preparationMinutes: recipe.preparationMinutes,
        cookingMinutes: recipe.cookingMinutes,
        nutrition: recipe.nutrition,
        ingredients: recipe.ingredients || [],
        analyzedInstructions: recipe.analyzedInstructions || [],
        summary: recipe.summary || "",
        savedAt: recipe.savedAt || recipe.createdAt,
      }));

      setRecipes(transformedRecipes);
    } catch (err) {
      console.error("Error loading recipes:", err);
      setError("Failed to load your recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: number): Promise<void> => {
    if (!confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    try {
      const response = await fetch(`/api/recipe/${recipeId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      // remove the recipe from state
      setRecipes((prevRecipes) =>
        prevRecipes.filter((recipe) => recipe.id !== recipeId)
      );

      console.log("Recipe deleted successfully");
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe. Please try again.");
    }
  };

  // filter recipes based on search query
  const filteredRecipes = Array.isArray(recipes)
    ? recipes.filter(
        (recipe) =>
          recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.ingredients?.some((ingredient) =>
            ingredient.name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : [];

  if (loading || status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your recipes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadRecipes}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* header */}
      <div className="flex-none border-b bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 mx-auto w-full max-w-screen-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
              <p className="text-sm text-gray-600">
                Your saved recipe collection ({filteredRecipes.length}{" "}
                {filteredRecipes.length === 1 ? "recipe" : "recipes"})
              </p>
            </div>

            {/* search */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search your recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8 xl:px-12 mx-auto w-full max-w-screen-2xl">
          {filteredRecipes.length === 0 ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="text-center max-w-md mx-auto">
                {recipes.length === 0 ? (
                  <>
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      No saved recipes yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Start chatting with the Recipe Agent to discover and save
                      delicious recipes!
                    </p>
                    <button
                      onClick={() => router.push("/dashboard/chat")}
                      className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      Go to Recipe Agent
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      No recipes found
                    </p>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search terms or browse all recipes
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
              {filteredRecipes.map((recipe) => (
                <SavedRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onDelete={handleDeleteRecipe}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { IconArrowLeft, IconArrowRight, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { Recipe } from "@/types/recipe";
import { Clock, Flame, Utensils, ChefHat, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type RecipeTestimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
  recipe: Recipe;
};

// placeholder image as a data URL
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext text-anchor='middle' x='200' y='200' style='fill:%236b7280;font-weight:500;font-size:18px;font-family:system-ui,sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";

// helper hook for outside click detection
const useOutsideClick = <T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      callback();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};

// recipe modal component
const RecipeModal = ({
  recipe,
  onClose,
  savedRecipes,
  onSave,
}: {
  recipe: Recipe;
  onClose: () => void;
  savedRecipes: Set<number>;
  onSave: (recipe: Recipe) => Promise<void>;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSaved = savedRecipes.has(recipe.id);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  useOutsideClick(modalRef, onClose);

  const formatIngredient = (ingredient: {
    name: string;
    amount: number;
    unit: string;
  }): string => {
    const { name, amount, unit } = ingredient;
    if (amount > 0) {
      const formattedAmount = amount % 1 === 0 ? amount : amount.toFixed(2);
      return unit && unit.trim() !== ""
        ? `${formattedAmount} ${unit} ${name}`
        : `${formattedAmount} ${name}`;
    }
    return name;
  };

  const handleSave = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(recipe);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-screen overflow-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={modalRef}
        className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10"
      >
        <button
          className="sticky top-4 right-0 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black cursor-pointer z-10"
          onClick={onClose}
        >
          <IconX className="h-6 w-6 text-neutral-100" />
        </button>

        <h2 className="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl">
          {recipe.title}
        </h2>

        <div className="py-10 space-y-6">
          {/* image */}
          {recipe.image && (
            <div className="relative h-64 w-full overflow-hidden rounded-xl">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // hide broken images in modal
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* save recipe */}
          <button
            onClick={handleSave}
            disabled={isSaved || isSaving}
            className={cn(
              "w-full rounded-lg px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2",
              isSaved
                ? "bg-green-100 border-2 border-green-200 text-green-700"
                : "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="h-4 w-4" />
                Recipe Saved
              </>
            ) : (
              "Save Recipe"
            )}
          </button>

          {/* stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {recipe.readyInMinutes} minutes total
              </span>
            </div>
            {recipe.preparationMinutes && (
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {recipe.preparationMinutes} min prep
                </span>
              </div>
            )}
            {recipe.cookingMinutes && (
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {recipe.cookingMinutes} min cook
                </span>
              </div>
            )}
          </div>

          {/* nutrition */}
          {recipe.nutrition && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold">
                Nutrition per serving
              </h3>
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
                  __html: recipe.summary.replace(/<[^>]*>/g, ""),
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
                    <span className="text-sm">
                      {formatIngredient(ingredient)}
                    </span>
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
        </div>
      </motion.div>
    </div>
  );
};

export const PopularRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipesState] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPopularRecipes();
  }, []);

  const fetchPopularRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/recipe/popular");

      if (!response.ok) {
        throw new Error("Failed to fetch popular recipes");
      }

      const data = await response.json();

      // validate images for all recipes
      const validatedRecipes = await Promise.all(
        data.recipes.map(async (recipe: Recipe) => {
          try {
            // check if image URL exists and is valid
            if (!recipe.image) return null;

            // try to load the image
            const img = new Image();
            const imageLoadPromise = new Promise((resolve, reject) => {
              img.onload = () => resolve(true);
              img.onerror = () => reject(false);
              img.src = recipe.image;
            });

            // wait for image to load with timeout
            await Promise.race([
              imageLoadPromise,
              new Promise((_, reject) => setTimeout(() => reject(false), 5000)), // 5 second timeout
            ]);

            return recipe;
          } catch {
            // image failed to load
            return null;
          }
        })
      );

      // filter out recipes with broken images and limit to 5
      const recipesWithValidImages = validatedRecipes
        .filter((recipe) => recipe !== null)
        .slice(0, 5) as Recipe[];

      setRecipes(recipesWithValidImages);
    } catch (err) {
      console.error("Error fetching popular recipes:", err);
      setError("Failed to load popular recipes");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActive((prev) => (prev + 1) % recipes.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + recipes.length) % recipes.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      // ensure every ingredient has a 'unit' property as a string
      const recipeToSave = {
        ...recipe,
        ingredients: recipe.ingredients.map((ing) => ({
          ...ing,
          unit: typeof ing.unit === "string" ? ing.unit : "",
        })),
      };

      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(recipeToSave),
      });

      if (response.ok) {
        setSavedRecipesState((prev) => new Set(prev).add(recipe.id));
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  // transform recipes into testimonial format
  const testimonials: RecipeTestimonial[] = recipes.map((recipe) => ({
    quote:
      recipe.summary?.replace(/<[^>]*>/g, "").slice(0, 120) + "..." ||
      "A delicious recipe to try!",
    name: recipe.title,
    designation: `${recipe.readyInMinutes} min • ${Math.round(
      recipe.nutrition?.calories || 0
    )} cal`,
    src: recipe.image || "",
    recipe: recipe,
  }));

  return (
    <>
      <div className="flex flex-col h-full">
        {/* header */}
        <div className="flex-none p-6">
          <h2 className="text-xl font-semibold mb-1 text-gray-800">
            Trending Recipes
          </h2>
          <p className="text-sm text-gray-500">
            Popular dishes to inspire your cooking
          </p>
        </div>

        {/* content */}
        <div className="flex-1 px-6 pb-6 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error || recipes.length < 2 ? (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-sm text-gray-500 text-center">
                Unable to load enough recipes
              </p>
            </div>
          ) : (
            <div className="relative h-full flex items-center">
              <div className="w-full h-full">
                <div className="relative grid grid-cols-1 xl:grid-cols-2 gap-3 items-center h-full">
                  {/* image stack */}
                  <div className="flex justify-center items-center h-full">
                    <div className="relative w-full max-w-[180px] aspect-square">
                      <AnimatePresence>
                        {testimonials.map((testimonial, index) => (
                          <motion.div
                            key={testimonial.src}
                            initial={{
                              opacity: 0,
                              scale: 0.9,
                              z: -100,
                              rotate: randomRotateY(),
                            }}
                            animate={{
                              opacity: isActive(index) ? 1 : 0.7,
                              scale: isActive(index) ? 1 : 0.95,
                              z: isActive(index) ? 0 : -100,
                              rotate: isActive(index) ? 0 : randomRotateY(),
                              zIndex: isActive(index)
                                ? 40
                                : testimonials.length + 2 - index,
                              y: isActive(index) ? [0, -20, 0] : 0,
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.9,
                              z: 100,
                              rotate: randomRotateY(),
                            }}
                            transition={{
                              duration: 0.4,
                              ease: "easeInOut",
                            }}
                            className="absolute inset-0 origin-bottom cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                            onClick={() =>
                              handleRecipeClick(testimonial.recipe)
                            }
                          >
                            <img
                              src={testimonial.src}
                              alt={testimonial.name}
                              draggable={false}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                              style={{ objectPosition: "center" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  PLACEHOLDER_IMAGE;
                              }}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* recipe info */}
                  <div className="flex flex-col justify-center space-y-3">
                    <motion.div
                      key={active}
                      initial={{
                        y: 20,
                        opacity: 0,
                      }}
                      animate={{
                        y: 0,
                        opacity: 1,
                      }}
                      exit={{
                        y: -20,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: "easeInOut",
                      }}
                    >
                      <h3
                        className="text-lg xl:text-xl font-bold text-gray-800 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                        onClick={() =>
                          handleRecipeClick(testimonials[active].recipe)
                        }
                      >
                        {testimonials[active].name}
                      </h3>

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {testimonials[active].recipe.readyInMinutes} min
                          </span>
                        </div>
                        {testimonials[active].recipe.nutrition?.calories && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            <span>
                              {Math.round(
                                testimonials[active].recipe.nutrition.calories
                              )}{" "}
                              cal
                            </span>
                          </div>
                        )}
                      </div>

                      <motion.p className="mt-2 text-xs text-gray-600 line-clamp-2 xl:line-clamp-3">
                        {testimonials[active].quote
                          .split(" ")
                          .map((word, index) => (
                            <motion.span
                              key={index}
                              initial={{
                                filter: "blur(10px)",
                                opacity: 0,
                                y: 5,
                              }}
                              animate={{
                                filter: "blur(0px)",
                                opacity: 1,
                                y: 0,
                              }}
                              transition={{
                                duration: 0.2,
                                ease: "easeInOut",
                                delay: 0.02 * index,
                              }}
                              className="inline-block"
                            >
                              {word}&nbsp;
                            </motion.span>
                          ))}
                      </motion.p>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() =>
                            handleRecipeClick(testimonials[active].recipe)
                          }
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium"
                        >
                          View Recipe
                        </button>
                        <button
                          onClick={() =>
                            handleSaveRecipe(testimonials[active].recipe)
                          }
                          disabled={savedRecipes.has(
                            testimonials[active].recipe.id
                          )}
                          className={cn(
                            "px-4 py-2 rounded-lg transition-colors text-xs font-medium",
                            savedRecipes.has(testimonials[active].recipe.id)
                              ? "bg-green-100 border border-green-200 text-green-700"
                              : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {savedRecipes.has(testimonials[active].recipe.id) ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Saved
                            </span>
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    </motion.div>

                    {/* navigation */}
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrev}
                        className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <IconArrowLeft className="h-3 w-3 text-gray-700 transition-transform duration-300 group-hover/button:translate-x-[-2px]" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="group/button flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <IconArrowRight className="h-3 w-3 text-gray-700 transition-transform duration-300 group-hover/button:translate-x-[2px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* recipe modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            savedRecipes={savedRecipes}
            onSave={handleSaveRecipe}
          />
        )}
      </AnimatePresence>
    </>
  );
};

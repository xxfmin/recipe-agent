"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RecipeCard } from "./recipe-card";
import { Carousel } from "./carousel";
import {
  Check,
  Clock,
  AlertCircle,
  ShoppingCart,
  Filter,
  Search,
  Book,
  ChefHat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatBubbleProps } from "@/types/chat";
import { Recipe } from "@/types/recipe";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// step config
const WORKFLOW_STEPS = {
  analyze_image: {
    label: "Extract Ingredients",
    icon: ShoppingCart,
    inProgressMsg: "Analyzing your fridge contents...",
    completeMsg: "ingredients found",
  },
  format_ingredients: {
    label: "Format Ingredients",
    icon: Filter,
    inProgressMsg: "Selecting the best ingredients for recipe search...",
    completeMsg: "Ingredients formatted",
  },
  search_recipes: {
    label: "Search Recipes",
    icon: Search,
    inProgressMsg: "Searching for recipes you can make...",
    completeMsg: "recipes found",
  },
  get_details: {
    label: "Get Recipe Details",
    icon: Book,
    inProgressMsg: "Getting detailed recipe information...",
    completeMsg: "Details retrieved",
  },
  search: {
    label: "Search Recipes",
    icon: Search,
    inProgressMsg: "Searching for recipes...",
    completeMsg: "Search complete",
  },
};

export function ChatBubble({
  role,
  message,
  imagePreview,
  streamingData,
  isLoading,
}: ChatBubbleProps) {
  const [activeSteps, setActiveSteps] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [errorSteps, setErrorSteps] = useState<Set<string>>(new Set());
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [finalRecipes, setFinalRecipes] = useState<Recipe[]>([]);
  const [finalMessage, setFinalMessage] = useState<string>("");

  useEffect(() => {
    if (!streamingData) return;

    // handle different message types
    switch (streamingData.type) {
      case "step":
        if (streamingData.step && streamingData.status === "in_progress") {
          setActiveSteps((prev) => new Set(prev).add(streamingData.step!));
          setErrorSteps((prev) => {
            const next = new Set(prev);
            next.delete(streamingData.step!);
            return next;
          });
        } else if (streamingData.step && streamingData.status === "complete") {
          setActiveSteps((prev) => {
            const next = new Set(prev);
            next.delete(streamingData.step!);
            return next;
          });
          setCompletedSteps((prev) => new Set(prev).add(streamingData.step!));

          // store step data
          if (streamingData.data) {
            setStepData((prev) => ({
              ...prev,
              [streamingData.step!]: streamingData.data,
            }));
          }

          // auto-open accordion
          if (!openAccordions.includes(streamingData.step)) {
            setOpenAccordions((prev) => [...prev, streamingData.step!]);
          }
        }
        break;
      case "complete":
        // store final message and recipes
        if (streamingData.message) {
          setFinalMessage(streamingData.message);
        }
        if (streamingData.recipes) {
          setFinalRecipes(streamingData.recipes);
        }
        break;
      case "error":
        if (streamingData.step) {
          setActiveSteps((prev) => {
            const next = new Set(prev);
            next.delete(streamingData.step!);
            return next;
          });
          setErrorSteps((prev) => new Set(prev).add(streamingData.step!));
        }
        break;
    }
  }, [streamingData]);

  // helper to get step status
  const getStepStatus = (step: string) => {
    if (errorSteps.has(step)) return "error";
    if (activeSteps.has(step)) return "in_progress";
    if (completedSteps.has(step)) return "completed";
    return "pending";
  };

  // helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  // check if we should show workflow steps
  const showWorkflow =
    activeSteps.size > 0 || completedSteps.size > 0 || errorSteps.size > 0;

  return (
    <Card className={cn("mb-4", role === "user" && "bg-gray-50")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {role === "user" ? (
            <>You</>
          ) : (
            <>
              <ChefHat className="w-4 h-4" />
              Sous
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* loading state */}
        {isLoading && !streamingData && (
          <div className="flex gap-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce delay-100">●</span>
            <span className="animate-bounce delay-200">●</span>
          </div>
        )}

        {/* user message */}
        {role === "user" && (
          <>
            {message && <p className="text-sm">{message}</p>}
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Uploaded"
                className="mt-2 rounded-lg max-h-48 object-cover"
              />
            )}
          </>
        )}

        {/* assistant response */}
        {role === "assistant" && (
          <>
            {/* workflow steps */}
            {showWorkflow && (
              <Accordion
                type="multiple"
                value={openAccordions}
                onValueChange={setOpenAccordions}
                className="w-full mb-4"
              >
                {Object.entries(WORKFLOW_STEPS).map(([stepKey, stepConfig]) => {
                  const status = getStepStatus(stepKey);
                  if (status === "pending") return null;

                  const Icon = stepConfig.icon;
                  const data = stepData[stepKey];

                  return (
                    <AccordionItem
                      key={stepKey}
                      value={stepKey}
                      className="border-b"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">
                              {stepConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mr-2">
                            <span className="text-sm text-gray-600">
                              {status === "in_progress" &&
                                stepConfig.inProgressMsg}
                              {status === "completed" && (
                                <>
                                  {stepKey === "analyze_image" &&
                                    data?.ingredients_count &&
                                    `${data.ingredients_count} ${stepConfig.completeMsg}`}
                                  {stepKey === "search_recipes" &&
                                    data &&
                                    `${
                                      stepData[stepKey]?.recipe_count || 0
                                    } recipes found`}
                                  {stepKey === "format_ingredients" &&
                                    stepConfig.completeMsg}
                                  {stepKey === "get_details" &&
                                    stepConfig.completeMsg}
                                  {stepKey === "search" &&
                                    stepConfig.completeMsg}
                                </>
                              )}
                              {status === "error" && "Error"}
                            </span>
                            {getStatusIcon(status)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* step-specific content */}
                        {stepKey === "analyze_image" && data?.ingredients && (
                          <div className="pt-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              All ingredients found in your fridge:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {data.ingredients.map(
                                (ingredient: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {ingredient}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {stepKey === "format_ingredients" &&
                          streamingData?.summary
                            ?.ingredients_used_for_search && (
                            <div className="pt-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Selected ingredients for recipe search:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {streamingData.summary.ingredients_used_for_search
                                  .split(",")
                                  .map((ingredient: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs bg-green-50 border-green-200 text-green-700"
                                    >
                                      {ingredient.trim()}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                        {stepKey === "search_recipes" && (
                          <div className="pt-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Recipe search optimization:
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>•</span>
                                <span>
                                  Prioritizing recipes that use your ingredients
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>•</span>
                                <span>
                                  Minimizing additional ingredients needed
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>•</span>
                                <span>
                                  Found {stepData[stepKey]?.recipe_count || 0}{" "}
                                  matching recipes
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {stepKey === "get_details" && (
                          <div className="pt-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Recipe details retrieved:
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>•</span>
                                <span>Nutritional information</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>•</span>
                                <span>Detailed ingredient lists</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>•</span>
                                <span>Step-by-step instructions</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>•</span>
                                <span>
                                  Cooking times and preparation details
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {stepKey === "search" && streamingData?.summary && (
                          <div className="text-sm text-gray-600 pt-2">
                            Searching for: {streamingData.summary.query}
                          </div>
                        )}

                        {status === "error" && streamingData?.message && (
                          <div className="text-sm text-red-600 pt-2">
                            {streamingData.message}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

            {/* final message */}
            {finalMessage && (
              <div className="prose max-w-none mb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm as any]}>
                  {finalMessage}
                </ReactMarkdown>
              </div>
            )}

            {/* recipe carousel */}
            {finalRecipes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3">Recipes Found</h3>
                <Carousel
                  items={finalRecipes.map((recipe, index) => (
                    <RecipeCard key={recipe.id} recipe={recipe} index={index} />
                  ))}
                />
              </div>
            )}

            {/* simple message (no workflow) - only show if no finalMessage */}
            {streamingData?.type === "complete" &&
              !showWorkflow &&
              streamingData.message &&
              !finalMessage && (
                <p className="text-sm">{streamingData.message}</p>
              )}

            {/* error message (no workflow) */}
            {streamingData?.type === "error" && !streamingData.step && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">
                  {streamingData.message || "An error occurred"}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

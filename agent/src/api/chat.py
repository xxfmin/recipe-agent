import json
import logfire
from typing import AsyncGenerator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from httpx import AsyncClient
from pydantic_ai import RunContext

from ..models.chat import ChatMessage, StreamResponse
from ..models.deps import Deps
from ..agents.orchestrator import orchestrator
from ..workflows import image_workflow, query_workflow
from ..config import config

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(body: ChatMessage):
    """
    Stream recipe search results based on:
    - Image: Extract -> Format -> Search by ingredients -> Get details
    - Query: Extract params -> Complex search
    """
    async def stream_updates() -> AsyncGenerator[str, None]:
        try:
            async with AsyncClient() as client:
                deps = Deps(
                    client=client,
                    spoonacular_api_key=config.SPOONACULAR_API_KEY,
                    gemini_api_key=config.GEMINI_API_KEY,
                    has_image=bool(body.image_base64),
                    image_base64=body.image_base64,
                    user_query=body.message,
                )

                # create context for workflow functions
                ctx = RunContext(deps=deps)

                if deps.has_image:
                    # IMAGE WORKFLOW
                    logfire.info("Starting image workflow")

                    # 1) analyze fridge image
                    response = StreamResponse(
                        type="step",
                        step="analyze_image",
                        status="in_progress",
                        message="Analyzing your fridge contents..."
                    )
                    yield response.model_dump_json() + "\n"
                    try:
                        result = await image_workflow.analyze_fridge_image(ctx)

                        if "No" in result or "error" in result.lower():
                            error_response = StreamResponse(
                                type="error",
                                step="analyze_image",
                                message=result
                            )
                            yield error_response.model_dump_json() + "\n"
                            return
                        complete_response = StreamResponse(
                            type="step",
                            step="analyzie_image",
                            status="complete",
                            message=result,
                            data={
                                "ingredients_count": len(deps.extracted_ingredients.ingredients) if deps.extracted_ingredients else 0,
                                "ingredients": deps.extracted_ingredients.ingredients[:10] if deps.extracted_ingredients else []
                            }
                        )
                        yield complete_response.model_dump_json() + "\n"
                    except Exception as e:
                        error_response = StreamResponse(
                            type="error",
                            step="analyze_image",
                            message=str(e)
                        )
                        yield error_response.model_dump_json() + "\n"
                        return
                    
                    # 2) format ingredients
                    format_response = StreamResponse(
                        type="step",
                        step="format_ingredients",
                        status="in_progress",
                        message="Selecting the best ingredients for recipe search..."
                    )
                    yield format_response.model_dump_json() + "\n"
                    
                    try:
                        result = await image_workflow.format_ingredients_for_search(ctx)
                        
                        complete_response = StreamResponse(
                            type="step",
                            step="format_ingredients",
                            status="complete",
                            message=result
                        )
                        yield complete_response.model_dump_json() + "\n"
                        
                    except Exception as e:
                        error_response = StreamResponse(
                            type="error",
                            step="format_ingredients",
                            message=f"Failed to format ingredients: {str(e)}"
                        )
                        yield error_response.model_dump_json() + "\n"
                        return
                    
                    # 3) search recipes
                    search_response = StreamResponse(
                        type="step",
                        step="search_recipes",
                        status="in_progress",
                        message="Searching for recipes you can make..."
                    )
                    yield search_response.model_dump_json() + "\n"
                    
                    try:
                        result = await image_workflow.search_recipes_by_ingredients(ctx)
                        
                        if deps.ingredient_search_results and len(deps.ingredient_search_results) == 0:
                            final_response = StreamResponse(
                                type="complete",
                                message="No recipes found with those ingredients. Try adding more ingredients or using different ones.",
                                recipes=[]
                            )
                            yield final_response.model_dump_json() + "\n"
                            return
                        
                        complete_response = StreamResponse(
                            type="step",
                            step="search_recipes",
                            status="complete",
                            message=result
                        )
                        yield complete_response.model_dump_json() + "\n"
                        
                    except Exception as e:
                        error_response = StreamResponse(
                            type="error",
                            step="search_recipes",
                            message=str(e)
                        )
                        yield error_response.model_dump_json() + "\n"
                        return
                    
                    # 4) get recipe details
                    details_response = StreamResponse(
                        type="step",
                        step="get_details",
                        status="in_progress",
                        message="Getting detailed recipe information..."
                    )
                    yield details_response.model_dump_json() + "\n"
                    
                    try:
                        result = await image_workflow.get_recipe_details_for_ingredient_search(ctx)
                        
                        # prepare final response
                        if deps.recipe_details:
                            recipe_dicts = []
                            for recipe in deps.recipe_details:
                                recipe_dict = recipe.model_dump()
                                recipe_dicts.append(recipe_dict)
                            
                            # sort by used ingredients count (best matches first)
                            recipe_dicts.sort(
                                key=lambda r: r.get('usedIngredientCount', 0), 
                                reverse=True
                            )
                            
                            final_response = StreamResponse(
                                type="complete",
                                message=f"Found {len(recipe_dicts)} delicious recipes you can make with your ingredients!",
                                recipes=recipe_dicts,
                                summary={
                                    "total_ingredients_found": len(deps.extracted_ingredients.ingredients) if deps.extracted_ingredients else 0,
                                    "ingredients_used_for_search": deps.formatted_ingredients,
                                    "total_recipes": len(recipe_dicts)
                                }
                            )
                            yield final_response.model_dump_json() + "\n"
                        else:
                            final_response = StreamResponse(
                                type="complete",
                                message="Unable to get recipe details. Please try again.",
                                recipes=[]
                            )
                            yield final_response.model_dump_json() + "\n"
                            
                    except Exception as e:
                        error_response = StreamResponse(
                            type="error",
                            step="get_details",
                            message=str(e)
                        )
                        yield error_response.model_dump_json() + "\n"
                        return
                    
                elif deps.user_query:
                    # QUERY WORKFLOW
                    logfire.info(f"Starting query workflo for: {deps.user_query}")

                    search_response = StreamResponse(
                        type="step",
                        step="search",
                        status="in_progress",
                        message=f"Searching for recipes: {deps.user_query}"
                    )
                    yield search_response.model_dump_json() + "\n"

                    try:
                        result = await query_workflow.search_recipes_by_query(ctx)

                        if deps.recipe_details:
                            recipe_dicts = [recipe.model_dump() for recipe in deps.recipe_details]
                            
                            final_response = StreamResponse(
                                type="complete",
                                message=result,
                                recipes=recipe_dicts,
                                summary={
                                    "query": deps.user_query,
                                    "total_recipes": len(recipe_dicts)
                                }
                            )
                            yield final_response.model_dump_json() + "\n"
                        else:
                            final_response = StreamResponse(
                                type="complete",
                                message="No recipes found matching your search. Try different keywords or filters.",
                                recipes=[]
                            )
                            yield final_response.model_dump_json() + "\n"
                            
                    except Exception as e:
                        error_response = StreamResponse(
                            type="error",
                            step="search",
                            message=str(e)
                        )
                        yield error_response.model_dump_json() + "\n"
                        return
                else:
                    # NO INPUT PROVIDED
                    welcome_response = StreamResponse(
                        type="complete",
                        message="Welcome to Recipe Assistant! Upload a photo of your fridge or tell me what kind of recipe you're looking for.",
                        recipes=[]
                    )
                    yield welcome_response.model_dump_json() + "\n"
        except Exception as e:
            logfire.error(f"Unexcpected error in chat endpoint: {str(e)}", exc_info=True)
            error_response = StreamResponse(
                type="error",
                message=f"An unexpected error occurred: {str(e)}"
            )
            yield error_response.model_dump_json() + "\n"
    return StreamingResponse(
        stream_updates(),
        media_type="application/x-ndjson"
    )
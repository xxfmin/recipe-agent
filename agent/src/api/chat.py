import json
import logfire
from typing import AsyncGenerator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from httpx import AsyncClient

from ..models.chat import ChatMessage, StreamResponse
from ..models.deps import Deps
from ..agents.orchestrator import orchestrator
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

                if deps.has_image:
                    # IMAGE WORKFLOW
                    logfire.info("Starting image workflow")

                    # Use the orchestrator agent to run the workflow
                    prompt = """
                    Analyze the fridge image and find recipes using these steps:
                    1. Use analyze_fridge_image to extract ingredients
                    2. Use format_ingredients_for_search to prepare them
                    3. Use search_recipes_by_ingredients to find recipes
                    4. Use get_recipe_details_for_ingredient_search to get full details
                    
                    Send progress updates as you complete each step.
                    """
                    
                    # Since we need to stream updates, we'll manually orchestrate the workflow
                    # but calling the functions through the deps service methods
                    
                    # 1) Analyze fridge image
                    response = StreamResponse(
                        type="step",
                        step="analyze_image",
                        status="in_progress",
                        message="Analyzing your fridge contents..."
                    )
                    yield response.model_dump_json() + "\n"
                    
                    try:
                        extracted = await deps.gemini.extract_ingredients_from_image(
                            deps.image_base64
                        )
                        deps.extracted_ingredients = extracted
                        
                        complete_response = StreamResponse(
                            type="step",
                            step="analyze_image",
                            status="complete",
                            message=f"Found {len(extracted.ingredients)} ingredients",
                            data={
                                "ingredients_count": len(extracted.ingredients),
                                "ingredients": extracted.ingredients[:10]
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
                    
                    # 2) Format ingredients
                    format_response = StreamResponse(
                        type="step",
                        step="format_ingredients",
                        status="in_progress",
                        message="Selecting the best ingredients for recipe search..."
                    )
                    yield format_response.model_dump_json() + "\n"
                    
                    try:
                        # Use the formatter agent
                        from ..agents.formatter import formatter_agent
                        result = await formatter_agent.run(
                            f"Format these ingredients: {', '.join(extracted.ingredients)}"
                        )
                        deps.formatted_ingredients = result.data.ingredients
                        
                        complete_response = StreamResponse(
                            type="step",
                            step="format_ingredients",
                            status="complete",
                            message="Ingredients formatted successfully"
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
                    
                    # 3) Search recipes
                    search_response = StreamResponse(
                        type="step",
                        step="search_recipes",
                        status="in_progress",
                        message="Searching for recipes you can make..."
                    )
                    yield search_response.model_dump_json() + "\n"
                    
                    try:
                        results = await deps.spoonacular.search_by_ingredients(
                            deps.formatted_ingredients
                        )
                        deps.ingredient_search_results = results
                        
                        if len(results) == 0:
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
                            message=f"Found {len(results)} recipes",
                            data={
                                "recipe_count": len(results)
                            }
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
                    
                    # 4) Get recipe details
                    details_response = StreamResponse(
                        type="step",
                        step="get_details",
                        status="in_progress",
                        message="Getting detailed recipe information..."
                    )
                    yield details_response.model_dump_json() + "\n"
                    
                    try:
                        recipe_ids = [r['id'] for r in results]
                        details = await deps.spoonacular.get_recipe_details_bulk(recipe_ids)
                        
                        # Map search results to enhance with ingredient match info
                        search_results_map = {r['id']: r for r in results}
                        enhanced_recipes = []
                        
                        for recipe in details:
                            recipe_dict = recipe.model_dump()
                            
                            # Add ingredient match info
                            if recipe.id in search_results_map:
                                search_result = search_results_map[recipe.id]
                                recipe_dict['usedIngredients'] = search_result.get('usedIngredients', [])
                                recipe_dict['missedIngredients'] = search_result.get('missedIngredients', [])
                                recipe_dict['usedIngredientCount'] = search_result.get('usedIngredientCount', 0)
                                recipe_dict['missedIngredientCount'] = search_result.get('missedIngredientCount', 0)
                            
                            enhanced_recipes.append(recipe_dict)
                        
                        # Sort by used ingredients count
                        enhanced_recipes.sort(
                            key=lambda r: r.get('usedIngredientCount', 0), 
                            reverse=True
                        )
                        
                        final_response = StreamResponse(
                            type="complete",
                            message=f"Found {len(enhanced_recipes)} delicious recipes you can make with your ingredients!",
                            recipes=enhanced_recipes,
                            summary={
                                "total_ingredients_found": len(extracted.ingredients),
                                "ingredients_used_for_search": deps.formatted_ingredients,
                                "total_recipes": len(enhanced_recipes)
                            }
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
                    logfire.info(f"Starting query workflow for: {deps.user_query}")

                    search_response = StreamResponse(
                        type="step",
                        step="search",
                        status="in_progress",
                        message=f"Searching for recipes: {deps.user_query}"
                    )
                    yield search_response.model_dump_json() + "\n"

                    try:
                        # Extract search parameters
                        from ..agents.query_extractor import query_extractor
                        extraction_result = await query_extractor.run(deps.user_query)
                        search_params = extraction_result.data
                        
                        # Search recipes
                        recipes = await deps.spoonacular.complex_search(search_params)
                        
                        if recipes:
                            recipe_dicts = [recipe.model_dump() for recipe in recipes]
                            
                            final_response = StreamResponse(
                                type="complete",
                                message=f"Found {len(recipe_dicts)} recipes matching '{search_params.query}'",
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
            logfire.error(f"Unexpected error in chat endpoint: {str(e)}", exc_info=True)
            error_response = StreamResponse(
                type="error",
                message=f"An unexpected error occurred: {str(e)}"
            )
            yield error_response.model_dump_json() + "\n"
            
    return StreamingResponse(
        stream_updates(),
        media_type="application/x-ndjson"
    )
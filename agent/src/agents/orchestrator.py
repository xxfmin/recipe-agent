from .fridge_agent import FridgeAgent
from .recipe_agent import RecipeAgent
from .qa_agent import qa_agent
from ..services.gemini import GeminiService
from ..services.spoonacular import SpoonacularService
from ..config import config

# initialize services and agents
_gemini_service = GeminiService(config.GEMINI_API_KEY)
_spoonacular_service = SpoonacularService(config.SPOONACULAR_API_KEY)
_recipe_agent = RecipeAgent(_spoonacular_service)
# FridgeAgent is initialized per request with deps

class Orchestrator:
    async def run(self, *, image_base64=None, user_query=None, deps=None):
        if image_base64:
            agent = FridgeAgent(deps)
            return agent.run(image_base64)  # returns an async generator
        elif user_query:
            # use LLM-based intent classification
            try:
                intent = await self.classify_intent_llm(user_query)
            except Exception as e:
                # fallback to keyword-based
                intent = await self.classify_intent_keywords(user_query)
            if intent == "fridge_image":
                agent = FridgeAgent(deps)
                return agent.run(image_base64)
            elif intent == "recipe_search":
                return await _recipe_agent.run(user_query)
            elif intent == "general_qa":
                result = await qa_agent.run(user_query)
                return {
                    "type": "complete",
                    "message": result.data.answer,
                    "recipes": []
                }
            else:
                return {
                    "type": "complete",
                    "message": "Sorry, I didn't understand your request.",
                    "recipes": []
                }
        else:
            return {
                "type": "complete",
                "message": "Welcome to Recipe Agent! Upload a photo or ask a question.",
                "recipes": []
            }

    async def classify_intent_llm(self, query: str) -> str:
        """
        Use Gemini LLM to classify the user query as 'fridge_image', 'recipe_search', or 'general_qa'.
        """
        prompt = (
            "Classify the following user query as one of: 'fridge_image', 'recipe_search', 'general_qa'. "
            "If the query is about uploading or analyzing a fridge image, return 'fridge_image'. "
            "If it's about searching for a recipe, return 'recipe_search'. "
            "If it's a general cooking question, return 'general_qa'. "
            "Only return one of these three labels.\n"
            f"Query: {query}"
        )
        response = await _gemini_service.answer_question(prompt)
        # extract the first valid label from the response
        for label in ["fridge_image", "recipe_search", "general_qa"]:
            if label in response.lower():
                return label
        return "general_qa"  # fallback

    async def classify_intent_keywords(self, query: str) -> str:
        keywords = ["recipe", "how to make", "how do I cook", "make", "prepare", "ingredients for"]
        if any(kw in query.lower() for kw in keywords):
            return "recipe_search"
        return "general_qa"

orchestrator = Orchestrator()

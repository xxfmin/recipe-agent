import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Recipe from "@/models/recipe";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: No user session found" },
        { status: 401 }
      );
    }

    // validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const recipeData = await request.json();

    // validate required fields
    if (!recipeData.id || typeof recipeData.id !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid recipe id" },
        { status: 400 }
      );
    }
    if (!recipeData.title || typeof recipeData.title !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid recipe title" },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(recipeData.ingredients) ||
      recipeData.ingredients.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid ingredients array" },
        { status: 400 }
      );
    }
    if (!Array.isArray(recipeData.analyzedInstructions)) {
      return NextResponse.json(
        { error: "Missing or invalid analyzedInstructions array" },
        { status: 400 }
      );
    }

    // ingredient mapping
    const ingredients = (recipeData.ingredients || []).map((ing: any) => ({
      name: ing.name || "",
      amount: typeof ing.amount === "number" ? ing.amount : 0,
      unit: typeof ing.unit === "string" ? ing.unit : "",
    }));

    // instructions mapping
    const instructions = recipeData.analyzedInstructions || [];
    const validInstructions = instructions
      .filter(
        (instruction: any) =>
          instruction &&
          typeof instruction.number === "number" &&
          typeof instruction.step === "string"
      )
      .map((instruction: any) => ({
        number: instruction.number,
        step: instruction.step,
        length: typeof instruction.length === "number" ? instruction.length : 0,
      }));

    const newRecipe = new Recipe({
      userId: session.user.id,
      spoonacularId: recipeData.id,
      title: recipeData.title,
      image: recipeData.image || "",
      readyInMinutes: recipeData.readyInMinutes || 0,
      preparationMinutes: recipeData.preparationMinutes,
      cookingMinutes: recipeData.cookingMinutes,
      nutrition: recipeData.nutrition || {},
      ingredients: ingredients,
      summary: recipeData.summary || "",
      analyzedInstructions: validInstructions,
    });

    await newRecipe.save();

    return NextResponse.json(
      {
        message: "Recipe saved successfully",
        recipe: newRecipe,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[ERROR] Save recipe error:", error);
    // duplicate error
    if (error instanceof Error && error.message.includes("E11000")) {
      return NextResponse.json(
        { error: "Recipe already saved" },
        { status: 409 }
      );
    }
    // mongoose validation error
    if (error?.name === "ValidationError") {
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 }
      );
    }
    // mongoose connection error
    if (
      error?.name === "MongooseServerSelectionError" ||
      error?.message?.includes("MONGODB_URI")
    ) {
      return NextResponse.json(
        { error: "Database connection error. Check MONGODB_URI and network." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: `Failed to save recipe: ${error?.message || error}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "-savedAt"; // newest first
    const search = searchParams.get("search") || "";

    const query: any = { userId: session.user.id };

    if (search) {
      query.$text = { $search: search };
    }

    const recipes = await Recipe.find(query).sort(sort).lean();

    return NextResponse.json({
      recipes,
      count: recipes.length,
    });
  } catch (error) {
    console.error("Get recipes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

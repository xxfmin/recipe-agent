import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Recipe from "@/models/recipe";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const spoonacularId = parseInt(id);

    if (isNaN(spoonacularId)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    await connectDB();

    const recipe = await Recipe.findOne({
      userId: session.user.id,
      spoonacularId: spoonacularId,
    }).lean();

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Get recipe error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const spoonacularId = parseInt(id);

    if (isNaN(spoonacularId)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    await connectDB();

    const deletedRecipe = await Recipe.findOneAndDelete({
      userId: session.user.id,
      spoonacularId: spoonacularId,
    });

    if (!deletedRecipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Recipe deleted successfully",
      recipe: deletedRecipe,
    });
  } catch (error) {
    console.error("Delete recipe error:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}

import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface INutrition {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

export interface IIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface IInstructionStep {
  number: number;
  step: string;
  length?: number; // in minutes
}

export interface IRecipe extends Document {
  userId: Types.ObjectId;
  spoonacularId: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  preparationMinutes?: number;
  cookingMinutes?: number;
  nutrition?: INutrition;
  ingredients: IIngredient[];
  summary?: string;
  analyzedInstructions: IInstructionStep[];
  savedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    spoonacularId: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    image: { type: String },
    readyInMinutes: { type: Number, min: 0 },
    preparationMinutes: { type: Number, min: 0 },
    cookingMinutes: { type: Number, min: 0 },
    nutrition: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbohydrates: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
    },
    ingredients: [
      {
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        unit: { type: String, default: "" },
      },
    ],
    summary: { type: String, maxLength: 2000 },
    analyzedInstructions: [
      {
        number: { type: Number, required: true, min: 1 },
        step: { type: String, required: true },
        length: { type: Number, min: 0 },
      },
    ],
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// unique index to prevent duplicate saves
RecipeSchema.index({ userId: 1, spoonacularId: 1 }, { unique: true });

const Recipe: Model<IRecipe> =
  mongoose.models.Recipe || mongoose.model<IRecipe>("Recipe", RecipeSchema);

export default Recipe;

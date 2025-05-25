// models/url.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IUrl extends Document {
  _id: mongoose.Types.ObjectId;
  "url-1": string;
  "url-2": string;
  createdAt?: Date;
  updatedAt?: Date;
}

const urlSchema = new Schema<IUrl>(
  {
    "url-1": {
      type: String,
      required: true,
      trim: true,
    },
    "url-2": {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "url", // This ensures it uses the 'url' collection name
  }
);

// Create indexes for better performance
urlSchema.index({ "url-1": 1 });
urlSchema.index({ "url-2": 1 });

export const Url = mongoose.model<IUrl>("Url", urlSchema);

// src/models/deviceToken.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  device: string;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
deviceTokenSchema.index({ userId: 1 });
deviceTokenSchema.index({ token: 1 }, { unique: true });

export const DeviceToken = mongoose.model<IDeviceToken>(
  "DeviceToken",
  deviceTokenSchema
);

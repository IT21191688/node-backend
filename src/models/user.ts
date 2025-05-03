import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { validateEmail } from "../utils";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "user" | "admin";
  fcmToken?: string; // Single FCM token for this user
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validateEmail,
        message: "Please provide a valid email",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Basic phone validation - can be customized based on your requirements
          return /^\+?[\d\s()-]{8,20}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    fcmToken: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password as string, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    const user = await this.model("User")
      .findById(this._id)
      .select("+password");
    if (!user) return false;

    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};
userSchema.set("toJSON", {
  transform: function (_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);

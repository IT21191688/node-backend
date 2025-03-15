import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { asyncHandler } from "../middleware/errorHandler";

export default class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await this.userService.getAllUsers();
    res.status(200).json({
      status: "success",
      data: { users },
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.getUserById(req.params.id);
    res.status(200).json({
      status: "success",
      data: { user },
    });
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.createUser(req.body);
    res.status(201).json({
      status: "success",
      data: { user },
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      data: { user },
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteUser(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
  /**
   * Get current user's profile
   */
  getProfile = asyncHandler(
    async (req: Request & { user?: { id: string } }, res: Response) => {
      if (!req.user?.id) {
        res.status(401).json({
          status: "fail",
          message: "Not authenticated",
        });
        return;
      }

      const user = await this.userService.getUserById(req.user.id);
      res.status(200).json({
        status: "success",
        data: { user },
      });
    }
  );

  /**
   * Update current user's profile
   */
  updateProfile = asyncHandler(
    async (req: Request & { user?: { id: string } }, res: Response) => {
      if (!req.user?.id) {
        res.status(401).json({
          status: "fail",
          message: "Not authenticated",
        });
        return;
      }

      // Only allow specific fields to be updated via profile
      const allowedFields = ["name", "email", "phone"];
      const updateData: Record<string, any> = {};

      Object.keys(req.body).forEach((key) => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const user = await this.userService.updateUser(req.user.id, updateData);
      res.status(200).json({
        status: "success",
        data: { user },
      });
    }
  );
}

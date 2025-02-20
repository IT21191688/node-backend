import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { asyncHandler } from '../middleware/errorHandler';

export default class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    /**
     * Get all users
     */
    getUsers = asyncHandler(async (req: Request, res: Response) => {
        const users = await this.userService.getAllUsers();
        res.status(200).json({
            status: 'success',
            data: { users }
        });
    });

    /**
     * Get user by ID
     */
    getUserById = asyncHandler(async (req: Request, res: Response) => {
        const user = await this.userService.getUserById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    });

    /**
     * Create new user
     */
    createUser = asyncHandler(async (req: Request, res: Response) => {
        const user = await this.userService.createUser(req.body);
        res.status(201).json({
            status: 'success',
            data: { user }
        });
    });

    /**
     * Update user
     */
    updateUser = asyncHandler(async (req: Request, res: Response) => {
        const user = await this.userService.updateUser(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    });

    /**
     * Delete user
     */
    deleteUser = asyncHandler(async (req: Request, res: Response) => {
        await this.userService.deleteUser(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    });
}
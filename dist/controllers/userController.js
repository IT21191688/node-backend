"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = require("../services/userService");
const errorHandler_1 = require("../middleware/errorHandler");
class UserController {
    constructor() {
        this.getUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const users = await this.userService.getAllUsers();
            res.status(200).json({
                status: "success",
                data: { users },
            });
        });
        this.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = await this.userService.getUserById(req.params.id);
            res.status(200).json({
                status: "success",
                data: { user },
            });
        });
        this.createUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = await this.userService.createUser(req.body);
            res.status(201).json({
                status: "success",
                data: { user },
            });
        });
        this.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = await this.userService.updateUser(req.params.id, req.body);
            res.status(200).json({
                status: "success",
                data: { user },
            });
        });
        this.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            await this.userService.deleteUser(req.params.id);
            res.status(204).json({
                status: "success",
                data: null,
            });
        });
        this.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        });
        this.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user?.id) {
                res.status(401).json({
                    status: "fail",
                    message: "Not authenticated",
                });
                return;
            }
            const allowedFields = ["name", "email", "phone"];
            const updateData = {};
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
        });
        this.userService = new userService_1.UserService();
    }
}
exports.default = UserController;
//# sourceMappingURL=userController.js.map
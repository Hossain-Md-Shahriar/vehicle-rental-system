import { Request, Response } from "express";
import { userServices } from "./user.service";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await userServices.getAllUsers();

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const requestingUser = req.user as Record<string, unknown>;

    if (
      requestingUser.role === "customer" &&
      String(requestingUser.id) !== userId
    ) {
      res.status(403).json({
        success: false,
        message: "Forbidden, You can only update your own profile",
      });
      return;
    }

    if (requestingUser.role === "customer" && req.body.role !== undefined) {
      req.body.role = undefined;
    }

    const result = await userServices.updateUser(userId, req.body);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const deleted = await userServices.deleteUser(req.params.userId as string);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err: any) {
    if (err.message === "Cannot delete user with active bookings") {
      res.status(400).json({
        success: false,
        message: err.message,
        errors: err.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

export const userControllers = {
  getAllUsers,
  updateUser,
  deleteUser,
};

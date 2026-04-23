import { Request, Response } from "express";
import { vehicleServices } from "./vehicle.service";

const createVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.createVehicle(req.body);

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
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

const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.getAllVehicles();

    res.status(200).json({
      success: true,
      message:
        result.rows.length === 0
          ? "No vehicles found"
          : "Vehicles retrieved successfully",
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

const getVehicleById = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.getVehicleById(
      req.params.vehicleId as string
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Vehicle retrieved successfully",
        data: result.rows[0],
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

const updateVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.updateVehicle(
      req.params.vehicleId as string,
      req.body
    );

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Vehicle updated successfully",
        data: result.rows[0],
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const deleted = await vehicleServices.deleteVehicle(
      req.params.vehicleId as string
    );

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (err: any) {
    if (err.message === "Cannot delete vehicle with active bookings") {
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

export const vehicleControllers = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};

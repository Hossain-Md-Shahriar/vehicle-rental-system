import { Request, Response } from "express";
import { bookingServices } from "./booking.service";

const createBooking = async (req: Request, res: Response) => {
  try {
    const result = await bookingServices.createBooking(req.body);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: result,
    });
  } catch (err: any) {
    const clientErrors = [
      "Vehicle not found",
      "Vehicle is not available for booking",
      "Invalid date format",
      "End date must be after start date",
    ];
    const status = clientErrors.includes(err.message) ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

const getBookings = async (req: Request, res: Response) => {
  try {
    const requestingUser = req.user!;
    const role = requestingUser.role as string;
    const userId = requestingUser.id as number;

    if (role === "admin") {
      const result = await bookingServices.getAllBookings();
      res.status(200).json({
        success: true,
        message: "Bookings retrieved successfully",
        data: result,
      });
    } else {
      const result = await bookingServices.getBookingsByCustomer(userId);
      res.status(200).json({
        success: true,
        message: "Your bookings retrieved successfully",
        data: result,
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

const updateBooking = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const { status } = req.body;
    const requestingUser = req.user!;
    const role = requestingUser.role as string;
    const userId = requestingUser.id as number;

    if (!status) {
      res.status(400).json({
        success: false,
        message: "status field is required",
        errors: "status field is required",
      });
      return;
    }

    const result = await bookingServices.updateBooking(
      bookingId,
      status,
      role,
      userId
    );

    if (status === "cancelled") {
      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: result.booking,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Booking marked as returned. Vehicle is now available",
        data: {
          ...result.booking,
          vehicle: result.vehicle,
        },
      });
    }
  } catch (err: any) {
    if (err.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own bookings",
        errors: err.message,
      });
      return;
    }
    if (err.message === "Booking not found") {
      res.status(404).json({
        success: false,
        message: err.message,
        errors: err.message,
      });
      return;
    }
    const clientErrors = [
      "Customers can only cancel bookings",
      "Only active bookings can be cancelled",
      "Bookings can only be cancelled before the start date",
      "Admins can only mark bookings as returned",
      "Only active bookings can be marked as returned",
    ];
    const status = clientErrors.includes(err.message) ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

export const bookingControllers = {
  createBooking,
  getBookings,
  updateBooking,
};

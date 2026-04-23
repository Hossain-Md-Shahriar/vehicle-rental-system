import express, { Request, Response } from "express";
import initDB from "./config/db";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/users/user.routes";
import { vehicleRoutes } from "./modules/vehicles/vehicle.routes";
import { bookingRoutes } from "./modules/bookings/booking.routes";

const app = express();

// parser
app.use(express.json());

// initializing DB
initDB();

app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Vehicle Rental App is running",
  });
});

// auth routes
app.use("/api/v1/auth", authRoutes);

// user routes
app.use("/api/v1/users", userRoutes);

// Vehicle routes
app.use("/api/v1/vehicles", vehicleRoutes);

// booking routes
app.use("/api/v1/bookings", bookingRoutes);

// 404 not found route
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

export default app;

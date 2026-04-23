import { Router } from "express";
import { bookingControllers } from "./booking.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/", auth("admin", "customer"), bookingControllers.createBooking);

router.get("/", auth("admin", "customer"), bookingControllers.getBookings);

router.put(
  "/:bookingId",
  auth("admin", "customer"),
  bookingControllers.updateBooking
);

export const bookingRoutes = router;

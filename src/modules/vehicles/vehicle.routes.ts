import { Router } from "express";
import { vehicleControllers } from "./vehicle.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/", auth("admin"), vehicleControllers.createVehicle);

router.get("/", vehicleControllers.getAllVehicles);

router.get("/:vehicleId", vehicleControllers.getVehicleById);

router.put("/:vehicleId", auth("admin"), vehicleControllers.updateVehicle);

router.delete("/:vehicleId", auth("admin"), vehicleControllers.deleteVehicle);

export const vehicleRoutes = router;

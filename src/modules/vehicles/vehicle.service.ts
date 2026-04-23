import { pool } from "../../config/db";

const createVehicle = async (payload: Record<string, unknown>) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = payload;

  if (!["car", "bike", "van", "SUV"].includes(type as string)) {
    throw new Error("Invalid Vehicle type");
  }

  if (Number(daily_rent_price) <= 0) {
    throw new Error("Price must be positive");
  }

  if (!["available", "booked"].includes(availability_status as string)) {
    throw new Error("Invalid availability status");
  }

  const result = await pool.query(
    `INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    ]
  );

  return result;
};

const getAllVehicles = async () => {
  const result = await pool.query(`
       SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status
       FROM vehicles
    `);
  return result;
};

const getVehicleById = async (vehicleId: string) => {
  const result = await pool.query(
    `
       SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status
       FROM vehicles
       WHERE id=$1
    `,
    [vehicleId]
  );
  return result;
};

const updateVehicle = async (
  vehicleId: string,
  payload: Record<string, unknown>
) => {
  const vehicle = await pool.query(
    `
        SELECT vehicle_name, type, registration_number, daily_rent_price, availability_status
        FROM vehicles
        WHERE id=$1
    `,
    [vehicleId]
  );

  if (vehicle.rows.length === 0) {
    return null;
  }

  const currentVehicleInfo = vehicle.rows[0];

  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = {
    vehicle_name: payload?.vehicle_name ?? currentVehicleInfo.vehicle_name,
    type: payload?.type ?? currentVehicleInfo.type,
    registration_number:
      payload?.registration_number ?? currentVehicleInfo.registration_number,
    daily_rent_price:
      payload?.daily_rent_price ?? currentVehicleInfo.daily_rent_price,
    availability_status:
      payload?.availability_status ?? currentVehicleInfo.availability_status,
  };

  if (!["car", "bike", "van", "SUV"].includes(type as string)) {
    throw new Error("Invalid Vehicle type");
  }

  if (Number(daily_rent_price) <= 0) {
    throw new Error("Price must be positive");
  }

  if (!["available", "booked"].includes(availability_status as string)) {
    throw new Error("Invalid availability status");
  }

  const result = await pool.query(
    `
    UPDATE vehicles
    SET vehicle_name=$1, type=$2, registration_number=$3, daily_rent_price=$4, availability_status=$5
    WHERE id=$6
    RETURNING *
  `,
    [
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
      vehicleId,
    ]
  );

  return result;
};

const deleteVehicle = async (vehicleId: string) => {
  const activeCheck = await pool.query(
    `SELECT id FROM bookings WHERE vehicle_id = $1 AND status = 'active'`,
    [vehicleId]
  );

  if ((activeCheck.rowCount ?? 0) > 0) {
    throw new Error("Cannot delete vehicle with active bookings");
  }

  const result = await pool.query(
    `DELETE FROM vehicles WHERE id = $1 RETURNING id`,
    [vehicleId]
  );

  return (result.rowCount ?? 0) > 0;
};

export const vehicleServices = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
};

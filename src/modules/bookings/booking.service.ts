import { pool } from "../../config/db";

const createBooking = async (payload: Record<string, unknown>) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

  const vehicleResult = await pool.query(
    `SELECT id, vehicle_name, daily_rent_price, availability_status FROM vehicles WHERE id = $1`,
    [vehicle_id]
  );

  if (vehicleResult.rows.length === 0) {
    throw new Error("Vehicle not found");
  }

  const vehicle = vehicleResult.rows[0];

  if (vehicle.availability_status !== "available") {
    throw new Error("Vehicle is not available for booking");
  }

  const startDate = new Date(rent_start_date as string);
  const endDate = new Date(rent_end_date as string);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date format");
  }

  if (endDate <= startDate) {
    throw new Error("End date must be after start date");
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const numberOfDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / msPerDay
  );
  const totalPrice = Number(vehicle.daily_rent_price) * numberOfDays;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [customer_id, vehicle_id, rent_start_date, rent_end_date, totalPrice]
    );

    await client.query(
      `UPDATE vehicles SET availability_status = 'booked' WHERE id = $1`,
      [vehicle_id]
    );

    await client.query("COMMIT");

    const booking = bookingResult.rows[0];

    return {
      ...booking,
      vehicle: {
        vehicle_name: vehicle.vehicle_name,
        daily_rent_price: vehicle.daily_rent_price,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const autoReturnExpiredBookings = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const expired = await client.query(
      `UPDATE bookings
         SET status = 'returned'
         WHERE status = 'active' AND rent_end_date < CURRENT_DATE
         RETURNING vehicle_id`
    );

    // Set each returned vehicle back to available
    for (const row of expired.rows) {
      await client.query(
        `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
        [row.vehicle_id]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getAllBookings = async () => {
  await autoReturnExpiredBookings();

  const result = await pool.query(
    `SELECT
         b.id,
         b.customer_id,
         b.vehicle_id,
         b.rent_start_date,
         b.rent_end_date,
         b.total_price,
         b.status,
         u.name  AS customer_name,
         u.email AS customer_email,
         v.vehicle_name,
         v.registration_number
       FROM bookings b
       JOIN users    u ON b.customer_id = u.id
       JOIN vehicles v ON b.vehicle_id  = v.id
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    customer_id: row.customer_id,
    vehicle_id: row.vehicle_id,
    rent_start_date: row.rent_start_date,
    rent_end_date: row.rent_end_date,
    total_price: row.total_price,
    status: row.status,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
    },
    vehicle: {
      vehicle_name: row.vehicle_name,
      registration_number: row.registration_number,
    },
  }));
};

const getBookingsByCustomer = async (customerId: number) => {
  await autoReturnExpiredBookings();

  const result = await pool.query(
    `SELECT
         b.id,
         b.vehicle_id,
         b.rent_start_date,
         b.rent_end_date,
         b.total_price,
         b.status,
         v.vehicle_name,
         v.registration_number,
         v.type
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.customer_id = $1
    `,
    [customerId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    vehicle_id: row.vehicle_id,
    rent_start_date: row.rent_start_date,
    rent_end_date: row.rent_end_date,
    total_price: row.total_price,
    status: row.status,
    vehicle: {
      vehicle_name: row.vehicle_name,
      registration_number: row.registration_number,
      type: row.type,
    },
  }));
};

const getBookingById = async (bookingId: string) => {
  const result = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [
    bookingId,
  ]);
  return result.rows[0] ?? null;
};

const updateBooking = async (
  bookingId: string,
  newStatus: string,
  requestingRole: string,
  requestingUserId: number
) => {
  const booking = await getBookingById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Customer: can only cancel their own active booking before start date
  if (requestingRole === "customer") {
    if (booking.customer_id !== requestingUserId) {
      throw new Error("Forbidden");
    }
    if (newStatus !== "cancelled") {
      throw new Error("Customers can only cancel bookings");
    }
    if (booking.status !== "active") {
      throw new Error("Only active bookings can be cancelled");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.rent_start_date);
    startDate.setHours(0, 0, 0, 0);
    if (startDate <= today) {
      throw new Error("Bookings can only be cancelled before the start date");
    }
  }

  // Admin: can only mark active bookings as returned
  if (requestingRole === "admin") {
    if (newStatus !== "returned") {
      throw new Error("Admins can only mark bookings as returned");
    }
    if (booking.status !== "active") {
      throw new Error("Only active bookings can be marked as returned");
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updated = await client.query(
      `UPDATE bookings
         SET status = $1
         WHERE id = $2
         RETURNING *`,
      [newStatus, bookingId]
    );

    // When cancelled or returned -> free up the vehicle
    if (newStatus === "cancelled" || newStatus === "returned") {
      await client.query(
        `UPDATE vehicles
           SET availability_status = 'available'
           WHERE id = $1`,
        [booking.vehicle_id]
      );
    }

    await client.query("COMMIT");

    const result = updated.rows[0];

    if (newStatus === "returned") {
      return {
        booking: {
          ...result,
          total_price: result.total_price,
        },
        vehicle: { availability_status: "available" },
      };
    }

    return {
      booking: {
        ...result,
        total_price: result.total_price,
      },
      vehicle: null,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const bookingServices = {
  createBooking,
  getAllBookings,
  getBookingsByCustomer,
  updateBooking,
};

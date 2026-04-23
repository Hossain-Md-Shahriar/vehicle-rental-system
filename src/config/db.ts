import { Pool, types } from "pg";
import config from ".";

types.setTypeParser(1082, (val) => val);

export const pool = new Pool({
  connectionString: `${config.connection_str}`,
});

const initDB = async () => {
  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      phone       VARCHAR(20) NOT NULL,
      role        VARCHAR(20) NOT NULL
    )
  `);

  // Vehicles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id                    SERIAL PRIMARY KEY,
      vehicle_name          VARCHAR(200) NOT NULL,
      type                  VARCHAR(50) NOT NULL,
      registration_number   VARCHAR(100) UNIQUE NOT NULL,
      daily_rent_price      NUMERIC NOT NULL,
      availability_status   VARCHAR(20) NOT NULL
    )
  `);

  // Bookings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id                SERIAL PRIMARY KEY,
      customer_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id        INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      rent_start_date   DATE NOT NULL,
      rent_end_date     DATE NOT NULL,
      total_price       NUMERIC NOT NULL,
      status            VARCHAR(20) NOT NULL
    )
  `);
};

export default initDB;

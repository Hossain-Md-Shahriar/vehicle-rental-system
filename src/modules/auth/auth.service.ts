import bcrypt from "bcryptjs";
import { pool } from "../../config/db";
import jwt from "jsonwebtoken";
import config from "../../config";

const signup = async (payload: Record<string, unknown>) => {
  const { name, email, password, phone, role } = payload;

  if (email !== (email as string).toLowerCase()) {
    throw new Error("Email must be in lowercase");
  }

  if ((password as string).length < 6) {
    throw new Error("Password must be of minimum 6 characters");
  }

  if (!["customer", "admin"].includes(role as string)) {
    throw new Error("Invalid Role");
  }

  const hashedPassword = await bcrypt.hash(password as string, 10);

  const result = await pool.query(
    `
        INSERT INTO users (name, email, password, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, phone, role
    `,
    [name, email, hashedPassword, phone, role]
  );

  return result;
};

const signin = async (email: string, password: string) => {
  const result = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
    `,
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return false;
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret as string,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

export const authServices = {
  signup,
  signin,
};

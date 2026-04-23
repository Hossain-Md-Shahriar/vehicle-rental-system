import { pool } from "../../config/db";

const getAllUsers = async () => {
  const result = await pool.query(`
        SELECT id, name, email, phone, role FROM users
    `);
  return result;
};

const updateUser = async (userId: string, payload: Record<string, unknown>) => {
  const user = await pool.query(
    `
        SELECT name, email, phone, role FROM users WHERE id=$1
    `,
    [userId]
  );

  if (user.rows.length === 0) {
    return null;
  }

  const currentUserInfo = user.rows[0];

  const { name, email, phone, role } = {
    name: payload?.name ?? currentUserInfo.name,
    email: payload?.email ?? currentUserInfo.email,
    phone: payload?.phone ?? currentUserInfo.phone,
    role: payload?.role ?? currentUserInfo.role,
  };

  const result = await pool.query(
    `
        UPDATE users SET name=$1, email=$2, phone=$3, role=$4
        WHERE id=$5 RETURNING id, name, email, phone, role
    `,
    [name, email, phone, role, userId]
  );

  return result;
};

const deleteUser = async (userId: string) => {
  const activeCheck = await pool.query(
    `SELECT id FROM bookings WHERE customer_id = $1 AND status = 'active'`,
    [userId]
  );

  if ((activeCheck.rowCount ?? 0) > 0) {
    throw new Error("Cannot delete user with active bookings");
  }

  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [userId]
  );

  return (result.rowCount ?? 0) > 0;
};

export const userServices = {
  getAllUsers,
  updateUser,
  deleteUser,
};

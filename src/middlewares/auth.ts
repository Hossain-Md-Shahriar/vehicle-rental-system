import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          success: false,
          message: "unauthorized",
        });
        return;
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const decoded = jwt.verify(
        token,
        config.jwtSecret as string
      ) as JwtPayload;

      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
        });
        return;
      }

      next();
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
  };
};

export default auth;

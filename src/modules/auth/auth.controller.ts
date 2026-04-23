import { Request, Response } from "express";
import { authServices } from "./auth.service";

const signup = async (req: Request, res: Response) => {
  try {
    const result = await authServices.signup(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authServices.signin(email, password);

    if (result === null) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errors: "No user found with this email",
      });
      return;
    }

    if (result === false) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errors: "Password does not match",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      errors: err.message,
    });
  }
};

export const authControllers = {
  signup,
  signin,
};

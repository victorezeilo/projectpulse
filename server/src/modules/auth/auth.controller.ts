import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../types';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await AuthService.register(input);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Registration successful',
    };

    res.status(201).json(response);
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await AuthService.login(input);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Login successful',
    };

    res.status(200).json(response);
  });

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    const result = await AuthService.refreshToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  });

  static me = asyncHandler(async (req: Request, res: Response) => {
    const user = await AuthService.getProfile(req.user!.id);

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    res.status(200).json(response);
  });
}
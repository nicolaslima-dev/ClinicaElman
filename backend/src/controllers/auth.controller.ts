import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.authenticate(email, password);
      
      res.status(200).json({
        message: 'Login bem-sucedido',
        data: result
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Falha na autenticação' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: 'Not Implemented' });
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: 'Not Implemented' });
  }
}

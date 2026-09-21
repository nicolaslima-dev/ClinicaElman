export class AuthService {
  static async authenticate(email: string, password?: string): Promise<any> {
    // Mock da regra de negócio de autenticação
    if (email === 'admin@elman.com') {
      return {
        user: { id: 1, email, role: 'admin' },
        token: 'mock-jwt-token-123'
      };
    }
    throw new Error('Credenciais inválidas');
  }
}

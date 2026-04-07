import { UserRole } from '@prisma/client';

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  nif: string;
  role: UserRole;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUserResponse;
}
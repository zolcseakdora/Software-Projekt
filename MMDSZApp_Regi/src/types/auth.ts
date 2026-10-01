import type { User } from 'firebase/auth';

export type UserRole =
  | 'Csapattag'
  | 'Alcsapatkapitány'
  | 'Csapatkapitány'
  | 'Szervező'
  | 'Főszervező';

export type UserProfile = {
  name: string;
  email: string;
  team: string;
  role: UserRole;
  igazolas?: string;
  isVerified: boolean;
  profileImage?: string | null;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
};

export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  team: string;
};

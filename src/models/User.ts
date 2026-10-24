import { IUserData } from './types';

/**
 * OOP Principle: Encapsulation
 * The User class encapsulates the user's identity and credential state,
 * preventing direct unauthorized manipulation of internal fields.
 */
export class User {
  private _id: string;
  private _username: string;
  private _passwordHash: string;
  private _createdAt: string;

  constructor(id: string, username: string, passwordHash: string, createdAt?: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('User ID cannot be empty.');
    }
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty.');
    }
    if (!passwordHash || passwordHash.trim().length === 0) {
      throw new Error('Password hash cannot be empty.');
    }

    this._id = id.trim();
    this._username = username.trim();
    this._passwordHash = passwordHash;
    this._createdAt = createdAt || new Date().toISOString();
  }

  // Getters (Encapsulation: Read-only access to identity properties)
  public get id(): string {
    return this._id;
  }

  public get username(): string {
    return this._username;
  }

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public set passwordHash(newHash: string) {
    if (!newHash || newHash.trim().length === 0) {
      throw new Error('Password hash cannot be empty.');
    }
    this._passwordHash = newHash;
  }

  public get createdAt(): string {
    return this._createdAt;
  }

  // Compatibility getters
  public get role(): string {
    return 'member';
  }

  public get email(): string {
    return `${this._username}@fitforge.io`;
  }

  /**
   * Verifies if candidate plain-text password hashes to stored passwordHash
   */
  public verifyPassword(candidateHash: string): boolean {
    return this._passwordHash === candidateHash;
  }

  public toJSON(): IUserData {
    return {
      id: this._id,
      username: this._username,
      passwordHash: this._passwordHash,
      createdAt: this._createdAt,
      role: 'member',
      email: `${this._username}@fitforge.io`,
    };
  }

  public static fromJSON(data: IUserData): User {
    return new User(data.id, data.username, data.passwordHash, data.createdAt);
  }
}

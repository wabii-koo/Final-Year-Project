import { User } from '../types';

// In-memory storage for registered users (in production, this would be a database)
const registeredUsers: User[] = [];

export class UserService {
  static saveUser(user: User): void {
    // Check if user already exists
    const existingUserIndex = registeredUsers.findIndex(u => u.email === user.email);
    if (existingUserIndex !== -1) {
      // update existing user
      registeredUsers[existingUserIndex] = user;
    } else {
      // add new user
      registeredUsers.push(user);
    }
    
    console.log('User saved:', user);
    console.log('Total registered users:', registeredUsers.length);
  }

  static findUserByEmail(email: string): User | null {
    const user = registeredUsers.find(u => u.email === email);
    return user || null;
  }

  static getAllUsers(): User[] {
    return registeredUsers;
  }
}

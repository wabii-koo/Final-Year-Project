import { UserRole } from '../types';

export const permissions = {
  // User Management
  'users.view': ['director', 'registrar'],
  'users.create': ['director'],
  'users.update': ['director'],
  'users.delete': ['director'],
  
  // Guardian Management
  'guardians.register': ['public'],
  'guardians.approve': ['registrar'],
  'guardians.reject': ['registrar'],
  
  // Communication
  'messages.send': ['homeroom_teacher', 'guardian'],
  'messages.receive': ['homeroom_teacher', 'guardian'],
  
  // Notifications
  'notifications.create': ['director', 'registrar'],
  'notifications.send': ['director'],
  'notifications.receive': ['all'],
  
  // Events
  'events.create': ['director'],
  'events.update': ['director'],
  'events.delete': ['director'],
  'events.view': ['all'],
  
  // Homework
  'homework.assign': ['teacher', 'homeroom_teacher'],
  'homework.view': ['teacher', 'homeroom_teacher', 'guardian'],
  'homework.feedback': ['guardian'],
  
  // Report Cards
  'reportcards.create': ['homeroom_teacher'],
  'reportcards.approve': ['director'],
  'reportcards.view': ['director', 'teacher', 'homeroom_teacher', 'guardian'],
  
  // Pickup
  'pickup.request': ['guardian'],
  'pickup.verify': ['teacher', 'homeroom_teacher'],
  'pickup.process': ['teacher', 'homeroom_teacher']
};

export const getPermissionsForRole = (role: string): string[] => {
  const rolePermissions: Record<UserRole, string[]> = {
    director: [
      'users.view', 'users.create', 'users.update', 'users.delete',
      'guardians.approve', 'guardians.reject',
      'notifications.create', 'notifications.send',
      'events.create', 'events.update', 'events.delete',
      'reportcards.approve', 'reportcards.unlock',
      'pickup.process'
    ],
    registrar: [
      'guardians.approve', 'guardians.reject',
      'notifications.create'
    ],
    homeroom_teacher: [
      'messages.send', 'messages.receive',
      'homework.assign', 'homework.view',
      'reportcards.create', 'reportcards.view',
      'pickup.verify', 'pickup.process'
    ],
    teacher: [
      'messages.send', 'messages.receive',
      'homework.assign', 'homework.view',
      'pickup.verify', 'pickup.process'
    ],
    guardian: [
      'messages.receive', 'messages.send',
      'notifications.receive',
      'events.view',
      'homework.view', 'homework.feedback',
      'reportcards.view',
      'pickup.request'
    ]
  };

  return rolePermissions[role as UserRole] || [];
};

export const hasPermission = (userRole: string, permission: string): boolean => {
  const userPermissions = getPermissionsForRole(userRole);
  return userPermissions.includes(permission) || userPermissions.includes('all');
};

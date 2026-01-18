/**
 * Authentication and User Types
 */

export type UserRole = 'super_admin' | 'project_admin' | 'org_admin' | 'supervisor' | 'enumerator';

export interface User {
  id: number;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthedUser extends User {
  token: string;
}

export interface ProjectMembership {
  id: number;
  userId: number;
  projectId: number;
  organizationId: number;
  role: UserRole;
  supervisorId: number | null;
  createdAt: string;
}

export interface Organization {
  id: number;
  projectId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

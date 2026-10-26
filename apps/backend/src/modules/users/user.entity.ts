import { Role } from './role.enum'

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

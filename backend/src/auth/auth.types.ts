import type { Permission } from './permissions.js'

export interface AuthUser {
  id: string
  username: string
  fullName: string
  roleKey: string
  roleName: string
  permissions: Permission[]
}

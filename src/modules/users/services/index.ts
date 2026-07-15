import * as api from '../api'
import type { QueryParams } from '@/shared/types'
import type { UserFormData } from '../schemas'

export const UserService = {
  async fetchUsers(params?: QueryParams) {
    return api.getUsers(params)
  },

  async fetchUserById(id: string) {
    return api.getUserById(id)
  },

  async createUser(data: UserFormData) {
    return api.createUser(data)
  },

  async updateUser(id: string, data: Partial<UserFormData>) {
    return api.updateUser(id, data)
  },

  async deleteUser(id: string) {
    return api.deleteUser(id)
  },
}
export default UserService

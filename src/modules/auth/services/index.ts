import { postLogin, postLogout } from '../api'
import type { LoginFormData } from '../schemas'
import type { LoginResponse } from '../types'

export const AuthService = {
  /**
   * Handle user login authentication
   */
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    // Perform any client-side preprocessing/formatting here
    return postLogin(credentials)
  },

  /**
   * Handle user session logout
   */
  async logout(): Promise<void> {
    return postLogout()
  },
}
export default AuthService

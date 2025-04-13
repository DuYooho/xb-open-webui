import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: null,
    userInfo: null
  }),
  actions: {
    setToken(token) {
      this.token = token
    },
    clearToken() {
      this.token = null
    }
  }
})
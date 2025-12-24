// pages/login/login.js
const app = getApp()
const { userApi } = require('../../utils/api')

Page({
  data: {
    username: '',
    password: '',
    showPassword: false,
    loading: false,
    canLogin: false
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('token')
    if (token) {
      wx.redirectTo({ url: '/pages/admin/admin' })
    }
  },

  onUsernameInput(e) {
    const username = e.detail.value
    this.setData({ 
      username,
      canLogin: username.length > 0 && this.data.password.length > 0
    })
  },

  onPasswordInput(e) {
    const password = e.detail.value
    this.setData({ 
      password,
      canLogin: this.data.username.length > 0 && password.length > 0
    })
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  async handleLogin() {
    if (!this.data.canLogin || this.data.loading) return

    const { username, password } = this.data

    this.setData({ loading: true })

    try {
      const result = await userApi.login(username, password)

      // API 直接返回 {token, user}
      if (result.token && result.user) {
        // 保存登录信息
        wx.setStorageSync('token', result.token)
        wx.setStorageSync('userInfo', result.user)
        app.globalData.token = result.token
        app.globalData.userInfo = result.user

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        setTimeout(() => {
          // 所有登录用户都进入后台管理
          wx.redirectTo({ url: '/pages/admin/admin' })
        }, 1000)
      } else {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('登录错误', err)
      wx.showToast({
        title: err.message || '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})


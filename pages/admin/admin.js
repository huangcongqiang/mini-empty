// pages/admin/admin.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    showQR: false,
    qrCodeUrl: ''
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo
    if (userInfo) {
      this.setData({ userInfo })
    }
  },

  // 导航到商品管理
  goToProducts() {
    wx.navigateTo({ url: '/pages/admin/products/products' })
  },

  // 导航到分类管理
  goToCategories() {
    wx.navigateTo({ url: '/pages/admin/categories/categories' })
  },

  // 导航到生成记录
  goToGenerated() {
    wx.navigateTo({ url: '/pages/admin/generated/generated' })
  },

  // 导航到设置
  goToSettings() {
    wx.navigateTo({ url: '/pages/admin/settings/settings' })
  },

  // 预览店铺（顾客视角）
  previewStore() {
    const { userInfo } = this.data
    if (!userInfo) return
    wx.navigateTo({
      url: `/pages/tryon/tryon?store=${userInfo.username}`
    })
  },

  // 复制店铺链接
  copyStoreLink() {
    const { userInfo } = this.data
    if (!userInfo) return
    const link = `${app.globalData.apiBase.replace('/api', '')}/store/${userInfo.username}`
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  // 显示二维码
  showQRCode() {
    // TODO: 生成真实的小程序码
    this.setData({ showQR: true })
  },

  hideQRCode() {
    this.setData({ showQR: false })
  },

  saveQRCode() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('currentStore')
          app.globalData.token = null
          app.globalData.userInfo = null
          app.globalData.currentStore = null
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  }
})


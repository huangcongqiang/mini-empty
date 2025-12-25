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
    const { userInfo } = this.data
    if (!userInfo) return

    // 使用 GET 接口直接获取小程序码图片
    const qrCodeUrl = `${app.globalData.apiBase}/wxcode/image/${userInfo.username}`

    this.setData({
      showQR: true,
      qrCodeUrl: qrCodeUrl
    })
  },

  hideQRCode() {
    this.setData({ showQR: false })
  },

  saveQRCode() {
    const { qrCodeUrl } = this.data
    if (!qrCodeUrl) {
      wx.showToast({ title: '二维码未生成', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 下载图片到本地临时路径
    wx.downloadFile({
      url: qrCodeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading()
              wx.showToast({ title: '已保存到相册', icon: 'success' })
            },
            fail: (err) => {
              wx.hideLoading()
              if (err.errMsg.includes('auth deny')) {
                wx.showModal({
                  title: '提示',
                  content: '需要授权保存图片到相册',
                  confirmText: '去设置',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting()
                    }
                  }
                })
              } else {
                wx.showToast({ title: '保存失败', icon: 'none' })
              }
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '下载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '下载失败', icon: 'none' })
      }
    })
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


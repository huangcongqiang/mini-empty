// pages/stores/stores.js
const app = getApp()
const { storeApi } = require('../../utils/api')

Page({
  data: {
    loading: true,
    stores: []
  },

  onLoad() {
    this.loadStores()
  },

  onShow() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' })
    }
  },

  async loadStores() {
    this.setData({ loading: true })

    try {
      // API 直接返回店铺数组
      const stores = await storeApi.getList()

      this.setData({
        stores: Array.isArray(stores) ? stores : [],
        loading: false
      })
    } catch (err) {
      console.error('加载店铺失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    }
  },

  selectStore(e) {
    const store = e.currentTarget.dataset.store
    
    // 保存选中的店铺
    app.globalData.currentStore = store
    app.globalData.storeUsername = store.username
    wx.setStorageSync('currentStore', store)

    // 跳转到试穿页面
    wx.navigateTo({
      url: '/pages/tryon/tryon'
    })
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('currentStore')
          app.globalData.token = null
          app.globalData.userInfo = null
          app.globalData.currentStore = null

          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})


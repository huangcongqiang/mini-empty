// pages/admin/settings/settings.js
const app = getApp()
const { userApi } = require('../../../utils/api')

Page({
  data: {
    storeName: '',
    username: '',
    storeLink: '',
    saving: false
  },

  onLoad() {
    this.loadSettings()
  },

  loadSettings() {
    const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo || {}
    const baseUrl = app.globalData.apiBase.replace('/api', '')
    this.setData({
      storeName: userInfo.storeName || '',
      username: userInfo.username || '',
      storeLink: `${baseUrl}/store/${userInfo.username}`
    })
  },

  onInputStoreName(e) {
    this.setData({ storeName: e.detail.value })
  },

  copyLink() {
    wx.setClipboardData({
      data: this.data.storeLink,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  async saveSettings() {
    const { storeName } = this.data
    if (!storeName.trim()) {
      return wx.showToast({ title: '请输入店铺名称', icon: 'none' })
    }

    this.setData({ saving: true })
    try {
      await userApi.updateStoreName(storeName)
      
      // 更新本地存储
      const userInfo = wx.getStorageSync('userInfo') || {}
      userInfo.storeName = storeName
      wx.setStorageSync('userInfo', userInfo)
      app.globalData.userInfo = userInfo

      wx.showToast({ title: '保存成功', icon: 'success' })
    } catch (err) {
      console.error('保存失败', err)
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})


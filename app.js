// app.js
App({
  onLaunch() {
    console.log('AI试衣间小程序启动')

    // 恢复登录状态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const currentStore = wx.getStorageSync('currentStore')

    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }

    if (currentStore) {
      this.globalData.currentStore = currentStore
      this.globalData.storeUsername = currentStore.username
    }
  },

  globalData: {
    // API 基础地址
    apiBase: 'https://cyxss.xyz/api',

    // 用户登录信息
    token: null,
    userInfo: null,

    // 当前店铺
    currentStore: null,
    storeUsername: null,

    // 拍摄的照片
    capturedImage: null,

    // 已选择的商品
    selectedProducts: [],

    // 试穿结果图
    resultImage: null
  }
})


// pages/admin/generated/generated.js
const { generatedApi } = require('../../../utils/api')

Page({
  data: {
    loading: true,
    images: []
  },

  onLoad() {
    this.loadImages()
  },

  async loadImages() {
    this.setData({ loading: true })
    try {
      const images = await generatedApi.getList()
      this.setData({ images: Array.isArray(images) ? images : [], loading: false })
    } catch (err) {
      console.error('加载失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.images.map(img => img.result_image)
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  }
})


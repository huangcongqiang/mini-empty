// pages/tryon/tryon.js
const app = getApp()
const { storeApi, tryonApi } = require('../../utils/api')

Page({
  data: {
    store: null,
    categories: [],
    products: [],
    selectedCategory: '',
    
    // 相机状态
    cameraPosition: 'front',
    countdown: 0,
    
    // 图片状态
    capturedImage: null,
    resultImage: null,
    showOriginal: false,
    
    // 商品选择
    showProducts: false,
    selectedProducts: [],
    triedProducts: [],
    
    // 加载状态
    loading: true,
    processing: false,
    error: '',

    // 引导弹窗
    showGuide: false,

    // 胶囊按钮适配
    statusBarHeight: 20,
    headerPaddingTop: 88
  },

  onLoad(options) {
    // 获取胶囊按钮位置，用于适配顶部导航
    this.initMenuButton()

    // 支持通过参数传入店铺用户名（顾客扫码进入）
    if (options.store) {
      this.isFromScan = true  // 标记是扫码进入
      this.loadStoreByUsername(options.store)
    } else {
      // 从全局状态获取（店铺老板预览）
      this.isFromScan = false
      this.loadStore()
    }
  },

  // 初始化胶囊按钮位置
  initMenuButton() {
    try {
      const menuButton = wx.getMenuButtonBoundingClientRect()
      const systemInfo = wx.getSystemInfoSync()
      const statusBarHeight = systemInfo.statusBarHeight || 20

      // 计算自定义导航栏需要的顶部padding
      const headerPaddingTop = menuButton.top + menuButton.height + 10

      this.setData({
        statusBarHeight,
        headerPaddingTop,
        menuButtonHeight: menuButton.height,
        menuButtonTop: menuButton.top
      })
    } catch (e) {
      console.error('获取胶囊按钮位置失败', e)
      // 使用默认值
      this.setData({
        statusBarHeight: 20,
        headerPaddingTop: 88
      })
    }
  },

  // 返回按钮
  goBack() {
    if (this.isFromScan) {
      // 扫码进入的顾客，提示无法返回
      wx.showToast({ title: '长按右上角可退出', icon: 'none' })
    } else {
      // 店铺老板，返回后台
      wx.navigateBack({
        fail: () => {
          wx.redirectTo({ url: '/pages/admin/admin' })
        }
      })
    }
  },

  // 通过用户名加载店铺（顾客扫码入口）
  async loadStoreByUsername(username) {
    this.setData({ loading: true })
    try {
      const [storeInfo, categories] = await Promise.all([
        storeApi.getStore(username),
        storeApi.getCategories(username)
      ])

      this.setData({
        store: storeInfo,
        categories,
        loading: false
      })

      this.checkShowGuide(username)
    } catch (err) {
      console.error('加载店铺失败', err)
      this.setData({ loading: false, error: '店铺不存在' })
      wx.showToast({ title: '店铺不存在', icon: 'none' })
    }
  },

  // 检查是否显示引导
  checkShowGuide(username) {
    const storeUsername = username || (this.data.store && this.data.store.username)
    if (!storeUsername) return

    const guideKey = `tryon-guide-${storeUsername}`
    const shown = wx.getStorageSync(guideKey)
    if (!shown) {
      this.setData({ showGuide: true })
      wx.setStorageSync(guideKey, true)
    }
  },

  showGuideModal() {
    this.setData({ showGuide: true })
  },

  hideGuide() {
    this.setData({ showGuide: false })
  },

  // 加载店铺信息（店铺老板预览）
  async loadStore() {
    const store = app.globalData.currentStore
    if (!store) {
      // 如果没有店铺信息，返回后台
      wx.redirectTo({ url: '/pages/admin/admin' })
      return
    }

    this.setData({ store, loading: true })

    try {
      const [storeInfo, categories] = await Promise.all([
        storeApi.getStore(store.username),
        storeApi.getCategories(store.username)
      ])

      this.setData({
        store: storeInfo,
        categories,
        loading: false
      })

      this.checkShowGuide(store.username)
    } catch (err) {
      console.error('加载店铺失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 获取完整图片URL
  getFullImageUrl(imagePath) {
    if (!imagePath) return ''
    // 如果已经是完整URL则直接返回
    if (imagePath.startsWith('http')) return imagePath
    // 拼接基础URL（去掉/api后缀）
    const baseUrl = app.globalData.apiBase.replace('/api', '')
    return baseUrl + imagePath
  },

  // 处理商品数据，添加完整图片URL
  processProducts(products) {
    return products.map(p => ({
      ...p,
      _fullImageUrl: this.getFullImageUrl(p.image_path)
    }))
  },

  // 加载商品列表
  async loadProducts() {
    const { store, selectedCategory } = this.data
    if (!store) return

    try {
      const rawProducts = await storeApi.getProducts(store.username, selectedCategory)
      const products = this.processProducts(rawProducts)
      this.setData({ products }, () => {
        this.updateProductsState()
      })
    } catch (err) {
      console.error('加载商品失败', err)
    }
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id || ''
    this.setData({ selectedCategory: categoryId })
    this.loadProducts()
  },

  // 拍照
  takePhoto() {
    if (this.data.countdown > 0) return
    
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({ capturedImage: res.tempImagePath })
        this.loadProducts()
      },
      fail: (err) => {
        console.error('拍照失败', err)
        wx.showToast({ title: '拍照失败', icon: 'none' })
      }
    })
  },

  // 从相册选择
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({ capturedImage: res.tempFiles[0].tempFilePath })
        this.loadProducts()
      }
    })
  },

  // 切换前后摄像头
  switchCamera() {
    this.setData({
      cameraPosition: this.data.cameraPosition === 'front' ? 'back' : 'front'
    })
  },

  // 相机错误
  onCameraError(e) {
    console.error('相机错误', e)
    wx.showToast({ title: '无法使用相机', icon: 'none' })
  },

  // 重拍
  handleRetake() {
    this.setData({
      capturedImage: null,
      resultImage: null,
      triedProducts: [],
      selectedProducts: [],
      error: ''
    })
  },

  // 显示商品弹窗
  showProductsModal() {
    this.setData({ showProducts: true })
    if (this.data.products.length === 0) {
      this.loadProducts()
    }
  },

  // 隐藏商品弹窗
  hideProductsModal() {
    this.setData({
      showProducts: false,
      selectedProducts: []
    })
  },

  // 获取商品分类名
  getCategoryName(product) {
    return product.category_name || ''
  },

  // 根据类别去重（同类别只保留最新的）
  deduplicateByCategory(products, newProduct) {
    const newCategoryName = this.getCategoryName(newProduct)
    const filtered = products.filter(p => this.getCategoryName(p) !== newCategoryName)
    return [...filtered, newProduct]
  },

  // 更新商品的选中状态（用于 wxml 显示）
  updateProductsState() {
    const { products, selectedProducts } = this.data
    const selectedIds = new Set(selectedProducts.map(p => p.id))
    const selectedCategories = new Set(selectedProducts.map(p => this.getCategoryName(p)))

    const updatedProducts = products.map(p => ({
      ...p,
      _selected: selectedIds.has(p.id),
      _replaceable: selectedCategories.has(this.getCategoryName(p)) && !selectedIds.has(p.id)
    }))

    this.setData({ products: updatedProducts })
  },

  // 切换商品选中状态
  toggleProduct(e) {
    const product = e.currentTarget.dataset.product
    const { selectedProducts } = this.data

    const isSelected = selectedProducts.some(p => p.id === product.id)

    let newSelected
    if (isSelected) {
      // 取消选中
      newSelected = selectedProducts.filter(p => p.id !== product.id)
    } else {
      // 选中（同类别去重）
      newSelected = this.deduplicateByCategory(selectedProducts, product)
    }

    this.setData({ selectedProducts: newSelected }, () => {
      this.updateProductsState()
    })
  },

  // 移除已选商品
  removeSelectedProduct(e) {
    const id = e.currentTarget.dataset.id
    const newSelected = this.data.selectedProducts.filter(p => p.id !== id)
    this.setData({ selectedProducts: newSelected }, () => {
      this.updateProductsState()
    })
  },

  // 开始试穿
  async startTryOn() {
    const { selectedProducts, capturedImage, triedProducts } = this.data
    if (selectedProducts.length === 0) return

    this.setData({
      showProducts: false,
      processing: true,
      error: ''
    })

    try {
      // 合并已试穿商品和新选择的商品（同类别去重）
      let allProducts = [...triedProducts]
      for (const product of selectedProducts) {
        allProducts = this.deduplicateByCategory(allProducts, product)
      }

      // 构建服装数据（使用完整图片URL）
      const clothingItems = allProducts.map(p => ({
        imagePath: p._fullImageUrl || this.getFullImageUrl(p.image_path),
        categoryName: p.category_name || '服装'
      }))

      // 调用 AI 试穿接口（会自动根据图片尺寸计算最佳宽高比）
      const result = await tryonApi.generate(capturedImage, clothingItems)

      if (result.success && result.image) {
        this.setData({
          resultImage: result.image,
          triedProducts: allProducts,
          selectedProducts: [],
          processing: false
        })
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (err) {
      console.error('试穿失败', err)
      this.setData({
        processing: false,
        error: err.message || '生成失败，请重试'
      })
    }
  },

  // 重试生成
  retryGenerate() {
    this.setData({ error: '' })
    this.showProductsModal()
  },

  // 点击预览大图
  async previewImage() {
    const { capturedImage, resultImage, processing, error } = this.data
    if (processing || error) return

    const current = resultImage || capturedImage
    if (!current) return

    // 如果是 base64 图片，先保存为临时文件
    if (current.startsWith('data:image')) {
      try {
        wx.showLoading({ title: '加载中...' })
        const tempFilePath = await this.base64ToTempFile(current)
        wx.hideLoading()

        wx.previewImage({
          current: tempFilePath,
          urls: [tempFilePath]
        })
      } catch (err) {
        wx.hideLoading()
        console.error('转换图片失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
      return
    }

    wx.previewImage({
      current,
      urls: [capturedImage, resultImage].filter(Boolean)
    })
  },

  // base64 转临时文件
  base64ToTempFile(base64Data) {
    return new Promise((resolve, reject) => {
      // 提取 base64 数据
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const filePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.jpg`

      const fs = wx.getFileSystemManager()
      fs.writeFile({
        filePath,
        data: base64,
        encoding: 'base64',
        success: () => resolve(filePath),
        fail: reject
      })
    })
  },

  // 长按显示原图
  onImageTouchStart() {
    if (this.data.resultImage) {
      this.setData({ showOriginal: true })
    }
  },

  onImageTouchEnd() {
    this.setData({ showOriginal: false })
  },

  // 保存到相册
  saveToAlbum() {
    const { resultImage } = this.data
    if (!resultImage) return

    wx.saveImageToPhotosAlbum({
      filePath: resultImage,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要权限',
            content: '请允许保存图片到相册',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `来${this.data.store?.storeName || 'AI试衣间'}体验虚拟试穿`,
      path: `/pages/login/login`,
      imageUrl: this.data.resultImage || this.data.capturedImage
    }
  }
})


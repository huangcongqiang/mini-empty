// pages/admin/products/products.js
const app = getApp()
const { categoryApi, productApi } = require('../../../utils/api')

Page({
  data: {
    loading: true,
    categories: [],
    products: [],
    selectedCategory: '',
    showModal: false,
    editingProduct: null,
    saving: false,
    formData: {
      name: '',
      description: '',
      link: '',
      imagePath: '',
      localImagePath: '', // 本地选择的图片
      categoryIndex: 0
    }
  },

  onLoad() {
    this.loadData()
  },

  // 获取完整图片URL
  getFullImageUrl(path) {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('wxfile://')) return path
    return `${app.globalData.apiBase}${path}`
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [categories, products] = await Promise.all([
        categoryApi.getList(),
        productApi.getList()
      ])
      // 为商品添加完整图片URL
      const productsWithUrl = products.map(p => ({
        ...p,
        _fullImageUrl: this.getFullImageUrl(p.image_path)
      }))
      this.setData({ categories, products: productsWithUrl, loading: false })
    } catch (err) {
      console.error('加载失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadProducts() {
    try {
      const products = await productApi.getList(this.data.selectedCategory)
      const productsWithUrl = products.map(p => ({
        ...p,
        _fullImageUrl: this.getFullImageUrl(p.image_path)
      }))
      this.setData({ products: productsWithUrl })
    } catch (err) {
      console.error('加载商品失败', err)
    }
  },

  selectCategory(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ selectedCategory: id }, () => this.loadProducts())
  },

  showAddModal() {
    const { categories } = this.data
    if (categories.length === 0) {
      wx.showToast({ title: '请先添加分类', icon: 'none' })
      return
    }
    this.setData({
      showModal: true,
      editingProduct: null,
      formData: { name: '', description: '', link: '', imagePath: '', localImagePath: '', categoryIndex: 0 }
    })
  },

  editProduct(e) {
    const product = e.currentTarget.dataset.product
    const { categories } = this.data
    const categoryIndex = categories.findIndex(c => c.id === product.category_id)
    this.setData({
      showModal: true,
      editingProduct: product,
      formData: {
        name: product.name,
        description: product.description || '',
        link: product.link || '',
        imagePath: product._fullImageUrl || this.getFullImageUrl(product.image_path), // 显示用完整URL
        localImagePath: '', // 本地新选择的图片
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
      }
    })
  },

  hideModal() {
    this.setData({ showModal: false, editingProduct: null })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const localPath = res.tempFiles[0].tempFilePath
        this.setData({
          'formData.imagePath': localPath,
          'formData.localImagePath': localPath
        })
      }
    })
  },

  onInputName(e) { this.setData({ 'formData.name': e.detail.value }) },
  onInputDesc(e) { this.setData({ 'formData.description': e.detail.value }) },
  onInputLink(e) { this.setData({ 'formData.link': e.detail.value }) },
  onCategoryChange(e) { this.setData({ 'formData.categoryIndex': e.detail.value }) },

  async saveProduct() {
    const { formData, categories, editingProduct } = this.data
    if (!formData.name.trim()) {
      return wx.showToast({ title: '请输入商品名称', icon: 'none' })
    }
    if (!formData.imagePath && !editingProduct) {
      return wx.showToast({ title: '请选择商品图片', icon: 'none' })
    }

    this.setData({ saving: true })
    try {
      const category = categories[formData.categoryIndex]
      const data = {
        name: formData.name,
        description: formData.description,
        link: formData.link,
        categoryId: category.id
      }

      if (editingProduct) {
        // 更新商品 - 检查是否有新选择的本地图片
        if (formData.localImagePath) {
          // 有新图片，上传新图片
          await productApi.updateWithImage(editingProduct.id, formData.localImagePath, data)
        } else {
          // 没有新图片，只更新其他信息
          await productApi.update(editingProduct.id, data)
        }
        wx.showToast({ title: '更新成功', icon: 'success' })
      } else {
        // 创建商品
        await productApi.create(formData.imagePath, data)
        wx.showToast({ title: '添加成功', icon: 'success' })
      }
      this.hideModal()
      this.loadProducts()
    } catch (err) {
      console.error('保存失败', err)
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  deleteProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await productApi.delete(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadProducts()
          } catch (err) {
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})


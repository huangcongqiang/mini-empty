// pages/admin/categories/categories.js
const { categoryApi } = require('../../../utils/api')

Page({
  data: {
    loading: true,
    categories: [],
    showModal: false,
    editingItem: null,
    saving: false,
    formData: { name: '', icon: '👔' },
    iconList: ['👔', '👕', '👖', '👗', '👘', '👙', '👚', '🧥', '🥼', '👞', '👟', '👠', '👡', '👢', '🧢', '👒', '🎩', '👜', '👝', '🎒', '👓', '🕶️', '💍', '⌚', '🧣', '🧤', '🧦', '👙', '🩱', '🩲', '🩳']
  },

  onLoad() {
    this.loadCategories()
  },

  async loadCategories() {
    this.setData({ loading: true })
    try {
      const categories = await categoryApi.getList()
      this.setData({ categories, loading: false })
    } catch (err) {
      console.error('加载失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  showAddModal() {
    this.setData({
      showModal: true,
      editingItem: null,
      formData: { name: '', icon: '👔' }
    })
  },

  editCategory(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showModal: true,
      editingItem: item,
      formData: { name: item.name, icon: item.icon }
    })
  },

  hideModal() {
    this.setData({ showModal: false, editingItem: null })
  },

  selectIcon(e) {
    this.setData({ 'formData.icon': e.currentTarget.dataset.icon })
  },

  onInputName(e) {
    this.setData({ 'formData.name': e.detail.value })
  },

  async saveCategory() {
    const { formData, editingItem } = this.data
    if (!formData.name.trim()) {
      return wx.showToast({ title: '请输入分类名称', icon: 'none' })
    }

    this.setData({ saving: true })
    try {
      if (editingItem) {
        await categoryApi.update(editingItem.id, formData.name, formData.icon)
        wx.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await categoryApi.create(formData.name, formData.icon)
        wx.showToast({ title: '添加成功', icon: 'success' })
      }
      this.hideModal()
      this.loadCategories()
    } catch (err) {
      console.error('保存失败', err)
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  deleteCategory(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类"${item.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await categoryApi.delete(item.id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadCategories()
          } catch (err) {
            wx.showToast({ title: err.message || '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})


// API 服务模块
const app = getApp()

// 获取 API 基础地址
const getApiBase = () => app.globalData.apiBase

// 获取 Token
const getToken = () => wx.getStorageSync('token') || app.globalData.token

// 通用请求函数
const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    // 自动添加 Token
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    wx.request({
      url: `${getApiBase()}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // Token 失效，跳转登录
          wx.removeStorageSync('token')
          wx.redirectTo({ url: '/pages/login/login' })
          reject(new Error('登录已过期'))
        } else {
          reject(new Error(res.data?.error || '请求失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

// 文件上传函数
const uploadFile = (url, filePath, formData = {}) => {
  return new Promise((resolve, reject) => {
    const token = getToken()
    wx.uploadFile({
      url: `${getApiBase()}${url}`,
      filePath,
      name: 'image',
      formData,
      header: token ? { 'Authorization': `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(res.data))
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '上传失败'))
    })
  })
}

// 用户相关接口
const userApi = {
  // 登录
  login: (username, password) => {
    return request('/auth/login', {
      method: 'POST',
      data: { username, password }
    })
  },

  // 获取用户信息
  getProfile: () => request('/auth/me'),

  // 更新店铺名称
  updateStoreName: (storeName) => request('/auth/store-name', {
    method: 'PUT',
    data: { storeName }
  }),

  // 退出登录
  logout: () => request('/auth/logout', { method: 'POST' })
}

// 店铺相关接口
const storeApi = {
  // 获取店铺列表（仅管理员可用）
  getList: () => request('/auth/stores'),

  // 获取店铺信息
  getStore: (username) => request(`/store/${username}`),

  // 获取店铺分类
  getCategories: (username) => request(`/store/${username}/categories`),

  // 获取店铺商品
  getProducts: (username, categoryId) => {
    let url = `/store/${username}/products`
    if (categoryId) {
      url += `?categoryId=${categoryId}`
    }
    return request(url)
  },

  // 获取单个商品
  getProduct: (username, productId) =>
    request(`/store/${username}/products/${productId}`)
}

// 将本地图片文件转为 base64
const fileToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        // 添加 data URL 前缀
        const ext = filePath.split('.').pop().toLowerCase()
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
        resolve(`data:${mimeType};base64,${res.data}`)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '读取文件失败'))
      }
    })
  })
}

// 获取图片尺寸
const getImageInfo = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: filePath,
      success: (res) => resolve({ width: res.width, height: res.height }),
      fail: (err) => reject(new Error(err.errMsg || '获取图片信息失败'))
    })
  })
}

// 支持的宽高比列表
const SUPPORTED_ASPECT_RATIOS = [
  "21:9", "16:9", "4:3", "3:2", "1:1", "9:16", "3:4", "2:3", "5:4", "4:5"
]

// 根据图片尺寸计算最接近的支持宽高比
const getClosestAspectRatio = (width, height) => {
  const imageRatio = width / height
  const ratioValues = SUPPORTED_ASPECT_RATIOS.map(ratio => {
    const [w, h] = ratio.split(':').map(Number)
    return { ratio, value: w / h }
  })

  let closest = ratioValues[0]
  let minDiff = Math.abs(imageRatio - closest.value)

  for (const r of ratioValues) {
    const diff = Math.abs(imageRatio - r.value)
    if (diff < minDiff) {
      minDiff = diff
      closest = r
    }
  }

  return closest.ratio
}

// AI 试穿接口
const tryonApi = {
  // 生成试穿效果图（后端期望 base64 格式）
  generate: async (personImagePath, clothingItems) => {
    // 获取图片尺寸并计算最佳宽高比
    const imageInfo = await getImageInfo(personImagePath)
    const aspectRatio = getClosestAspectRatio(imageInfo.width, imageInfo.height)
    console.log(`图片尺寸: ${imageInfo.width}x${imageInfo.height}, 使用宽高比: ${aspectRatio}`)

    // 将本地临时文件转为 base64
    const personImage = await fileToBase64(personImagePath)

    // 发送 JSON 请求
    return request('/tryon/generate', {
      method: 'POST',
      data: {
        personImage,
        clothingItems,
        aspectRatio
      }
    })
  }
}

// 保存生成图片接口
const generatedApi = {
  save: (data) => request('/generated/save', {
    method: 'POST',
    data
  }),
  // 获取生成记录
  getList: () => request('/generated')
}

// 分类管理接口（需登录）
const categoryApi = {
  // 获取我的分类
  getList: () => request('/categories'),

  // 创建分类
  create: (name, icon) => request('/categories', {
    method: 'POST',
    data: { name, icon }
  }),

  // 更新分类
  update: (id, name, icon) => request(`/categories/${id}`, {
    method: 'PUT',
    data: { name, icon }
  }),

  // 删除分类
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' })
}

// 商品管理接口（需登录）
const productApi = {
  // 获取我的商品
  getList: (categoryId) => {
    let url = '/products'
    if (categoryId) url += `?categoryId=${categoryId}`
    return request(url)
  },

  // 创建商品（带图片上传）
  create: (filePath, data) => uploadFile('/products', filePath, data),

  // 更新商品
  update: (id, data) => request(`/products/${id}`, {
    method: 'PUT',
    data
  }),

  // 更新商品（带图片）
  updateWithImage: (id, filePath, data) => uploadFile(`/products/${id}`, filePath, { ...data, _method: 'PUT' }),

  // 删除商品
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' })
}

module.exports = {
  userApi,
  storeApi,
  tryonApi,
  generatedApi,
  categoryApi,
  productApi
}


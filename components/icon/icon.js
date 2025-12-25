// components/icon/icon.js
Component({
  properties: {
    name: {
      type: String,
      value: ''
    },
    size: {
      type: String,
      value: '48rpx'
    },
    className: {
      type: String,
      value: ''
    },
    customStyle: {
      type: String,
      value: ''
    },
    // 无障碍属性
    ariaLabel: {
      type: String,
      value: ''
    },
    ariaHidden: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 默认的图标无障碍标签映射
    defaultLabels: {
      camera: '相机',
      switch: '切换',
      album: '相册',
      check: '勾选',
      save: '保存',
      clothes: '服装',
      share: '分享',
      user: '用户',
      store: '店铺',
      loading: '加载中',
      magic: 'AI魔法',
      back: '返回',
      tip: '提示',
      compare: '对比',
      package: '商品',
      category: '分类',
      image: '图片',
      setting: '设置',
      plus: '添加',
      edit: '编辑',
      delete: '删除',
      qrcode: '二维码',
      eye: '查看',
      link: '链接',
      copy: '复制',
      close: '关闭',
      help: '帮助'
    }
  },

  computed: {},

  lifetimes: {
    attached() {
      this.updateAriaLabel();
    }
  },

  observers: {
    'name, ariaLabel': function() {
      this.updateAriaLabel();
    }
  },

  methods: {
    updateAriaLabel() {
      const { name, ariaLabel } = this.properties;
      const { defaultLabels } = this.data;
      const label = ariaLabel || defaultLabels[name] || name;
      this.setData({ computedAriaLabel: label });
    }
  }
})


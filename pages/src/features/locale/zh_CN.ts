import { SORT_ORDER, OPEN_MODE } from '@/const'

const lang = {
  name: '简体中文',
  shorName: 'zh_CN',
  languageName: 'Chinese (Simplified)',
  errorPage: {
    error: '发送时发生错误。',
    afterShortTime: '请稍后再试。',
  },
  commandShare: {
    title: '分享命令',
    formTitle: '命令分享表单',
  },
  tagPicker: {
    notFound: '未找到',
    create: '创建？',
  },
  inputForm: {
    title: {
      label: '标题',
      description: '将显示为命令的标题。',
      placeholder: '命令标题',
      message: {
        min3: '标题至少需要3个字符。',
        max100: '标题最多100个字符。',
      },
    },
    searchUrl: {
      label: '搜索URL',
      description: '将`%s`替换为选中的文本。',
      placeholder: '搜索URL',
      faviconAlt: '搜索URL的网站图标',
      message: {
        url: 'URL格式不正确。',
        unique: '已经注册。',
      },
    },
    description: {
      label: '命令说明',
      description: '将显示为命令的说明。',
      placeholder: '命令说明',
      message: {
        max200: '说明最多200个字符。',
      },
    },
    tags: {
      label: '标签',
      description: '将显示为命令的分类。',
      message: {
        max5: '标签最多20个字符。',
        max20: '最多允许5个标签。',
      },
    },
    iconUrl: {
      label: '图标URL',
      description: '将显示为菜单中的图标。',
      placeholder: '图标URL',
      message: {
        url: 'URL格式不正确。',
      },
    },
    openMode: {
      label: '打开模式',
      description: '结果的显示方式。',
      options: {
        [OPEN_MODE.POPUP]: '弹出窗口',
        [OPEN_MODE.WINDOW]: '窗口',
        [OPEN_MODE.TAB]: '标签页',
        [OPEN_MODE.PAGE_ACTION]: '页面操作',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + 点击',
      description: 'Ctrl + 点击时的结果显示方式。',
    },
    spaceEncoding: {
      label: '空格编码',
      description: '替换选中文本中的空格。',
      options: {
        plus: '加号(+)',
        percent: '百分号(%20)',
      },
    },
    formDescription: '请求分享命令。',
    formOptions: '选项',
    confirm: '确认输入',
    pageAction: {
      label: '页面操作',
      description: '要执行的操作',
    },
    PageActionOption: {
      startUrl: {
        label: '起始页面URL',
        description: '页面操作将开始的页面URL。',
        faviconAlt: '起始页面URL的网站图标',
      },
    },
  },
  confirmForm: {
    formDescription: '以下信息是否正确？',
    caution: '※ 发送的信息将在此网站上发布。\n请不要分享个人信息或机密信息。',
    back: '编辑',
    submit: '分享',
  },
  SendingForm: {
    sending: '发送中...',
  },
  completeForm: {
    formDescription: '发送完成。',
    thanks:
      '感谢您分享您的命令！\n开发者可能需要2-3天才能在网站上反映。\n请等待发布。',
    aboudDelete: '如需在发送后请求删除，请使用以下链接。',
    supportHub: '前往支持中心',
  },
  errorForm: {
    formDescription: '发送时发生错误...',
    message: '请稍后重试或通过以下链接联系开发者。',
    supportHub: '前往支持中心',
  },
  notFound: {
    title: '页面未找到',
    message: '您尝试访问的页面不存在。\n请检查URL。',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: '搜索URL',
    [SORT_ORDER.title]: '标题',
    [SORT_ORDER.download]: '下载次数',
    [SORT_ORDER.star]: '星标数',
    [SORT_ORDER.addedAt]: '注册日期',
    new: '新',
    old: '旧',
  },
  about: {
    terms: '使用条款',
    privacy: '隐私政策',
    cookie: 'Cookie政策',
  },
  cookieConsent: {
    title: '关于Cookie的使用',
    message:
      '本网站使用Cookie以提供更好的体验。有关详细信息，请参阅我们的Cookie政策。',
    accept: '接受',
    decline: '拒绝',
  },
  uninstallForm: {
    title: '卸载完成。',
    description:
      '感谢您一直使用Selection Command。很遗憾您要离开，但为了将来改进扩展，如果您能回答以下调查，我们将不胜感激。',
    reinstall: '如果您不小心卸载，可以通过以下链接重新安装。',
    reasonTitle: '您为什么卸载？(多选)',
    otherReasonPlaceholder: '请说明原因',
    detailsTitle: '如果可以，请提供更多详细信息。',
    detailsPlaceholder:
      '卸载原因的详细信息，\n您想要做什么或遇到什么困难，\n在哪些网站上不起作用等',
    submit: '发送',
    submitting: '发送中...',
    success: {
      title: '调查已成功发送。',
      message:
        '感谢您的回答。我们重视您的宝贵反馈。\n如果您有除此表单之外的更多反馈，请发送邮件至takeda.yujiro@gmail.com，并注明主题。',
    },
    error: '发送失败。请稍后重试。',
    reasons: {
      difficult_to_use: '不知道如何使用',
      not_user_friendly: '使用不便',
      not_working: '不能按预期工作',
      missing_features: '缺少所需功能',
      too_many_permissions: '需要太多权限',
      found_better: '找到了更好的替代品',
      no_longer_needed: '不再需要',
      language_not_supported: '不支持所需语言',
      other: '其他',
    },
  },
}
export default lang

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 支持的语言类型
export type Language = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP'

// 语言资源接口
interface LanguageResources {
  common: {
    save: string
    cancel: string
    confirm: string
    loading: string
    error: string
    success: string
    back: string
    next: string
    submit: string
    delete: string
    edit: string
    view: string
  }
  auth: {
    login: string
    register: string
    logout: string
    email: string
    password: string
    confirmPassword: string
    forgotPassword: string
    rememberMe: string
    loginSuccess: string
    registerSuccess: string
    invalidCredentials: string
    emailExists: string
    passwordMismatch: string
    weakPassword: string
    verifyEmail: string
    emailVerified: string
  }
  navigation: {
    dashboard: string
    profile: string
    settings: string
    security: string
    admin: string
    social: string
  }
  dashboard: {
    title: string
    welcome: string
    stats: string
    recentActivity: string
  }
  settings: {
    title: string
    description: string
    appearance: string
    appearanceDesc: string
    notifications: string
    notificationsDesc: string
    privacy: string
    privacyDesc: string
    language: string
    languageDesc: string
    theme: string
    lightMode: string
    darkMode: string
    autoMode: string
    lightModeDesc: string
    darkModeDesc: string
    autoModeDesc: string
    emailNotifications: string
    emailNotificationsDesc: string
    browserNotifications: string
    browserNotificationsDesc: string
    marketingNotifications: string
    marketingNotificationsDesc: string
    profileVisible: string
    profileVisibleDesc: string
    activityVisible: string
    activityVisibleDesc: string
    dataCollection: string
    dataCollectionDesc: string
    interfaceLanguage: string
    timezoneSettings: string
    autoSaveEnabled: string
    autoSaveDesc: string
    immediately: string
    autoSave: string
    saving: string
  }
  security: {
    title: string
    description: string
    loginNotifications: string
    loginNotificationsDesc: string
    passwordSecurity: string
    changePassword: string
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
    loginHistory: string
    noLoginHistory: string
    device: string
    location: string
    time: string
    ipAddress: string
  }
  profile: {
    title: string
    description: string
    personalInfo: string
    avatar: string
    name: string
    bio: string
    lastLogin: string
    memberSince: string
    uploadAvatar: string
    removeAvatar: string
    maxFileSize: string
    supportedFormats: string
    never: string
  }
  admin: {
    title: string
    userManagement: string
    emailSystem: string
    systemStats: string
    sendEmail: string
    totalUsers: string
    activeUsers: string
    emailsSent: string
  }
  social: {
    title: string
    description: string
    friends: string
    friendsDesc: string
    messages: string
    messagesDesc: string
    posts: string
    postsDesc: string
    activities: string
    activitiesDesc: string
    findFriends: string
    sendMessage: string
    createPost: string
    viewProfile: string
    addFriend: string
    removeFriend: string
    acceptRequest: string
    rejectRequest: string
    pendingRequests: string
    sentRequests: string
    friendsList: string
    noFriends: string
    noMessages: string
    noPosts: string
    searchPlaceholder: string
    messageContent: string
    postContent: string
    postPlaceholder: string
    messagePlaceholder: string
    sendPost: string
    reply: string
    like: string
    share: string
    comment: string
    online: string
    offline: string
    lastSeen: string
    mutual: string
    mutualFriends: string
    newPost: string
    newMessage: string
    friendRequest: string
    activity: string
    notifications: string
    markAsRead: string
    deletePost: string
    editPost: string
    reportUser: string
    blockUser: string
  }
  errors: {
    networkError: string
    unauthorized: string
    notFound: string
    serverError: string
    validationError: string
    uploadError: string
    emailSendError: string
  }
}

// 语言资源定义
const languageResources: Record<Language, LanguageResources> = {
  'zh-CN': {
    common: {
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      back: '返回',
      next: '下一步',
      submit: '提交',
      delete: '删除',
      edit: '编辑',
      view: '查看'
    },
    auth: {
      login: '登录',
      register: '注册',
      logout: '退出登录',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      forgotPassword: '忘记密码',
      rememberMe: '记住我',
      loginSuccess: '登录成功',
      registerSuccess: '注册成功',
      invalidCredentials: '邮箱或密码错误',
      emailExists: '邮箱已存在',
      passwordMismatch: '密码不匹配',
      weakPassword: '密码强度不够',
      verifyEmail: '验证邮箱',
      emailVerified: '邮箱已验证'
    },
    navigation: {
      dashboard: '仪表板',
      profile: '个人资料',
      settings: '系统设置',
      security: '安全中心',
      admin: '管理员',
      social: '社交中心'
    },
    dashboard: {
      title: '仪表板',
      welcome: '欢迎回来',
      stats: '统计数据',
      recentActivity: '最近活动'
    },
    settings: {
      title: '系统设置',
      description: '个性化您的账户体验和偏好设置',
      appearance: '外观设置',
      appearanceDesc: '自定义界面主题和显示偏好',
      notifications: '通知设置',
      notificationsDesc: '管理您接收通知的方式和类型',
      privacy: '隐私设置',
      privacyDesc: '控制您的个人信息可见性和数据收集偏好',
      language: '语言和地区',
      languageDesc: '设置界面语言和时区偏好(支持性较差)',
      theme: '主题模式',
      lightMode: '浅色模式',
      darkMode: '深色模式',
      autoMode: '跟随系统',
      lightModeDesc: '始终使用浅色主题',
      darkModeDesc: '始终使用深色主题',
      autoModeDesc: '根据系统设置自动切换',
      emailNotifications: '邮件通知',
      emailNotificationsDesc: '接收重要账户信息和安全提醒',
      browserNotifications: '浏览器通知',
      browserNotificationsDesc: '在浏览器中显示实时通知',
      marketingNotifications: '营销推广',
      marketingNotificationsDesc: '接收产品更新和促销信息',
      profileVisible: '公开个人资料',
      profileVisibleDesc: '允许其他用户查看您的基本信息',
      activityVisible: '显示活动状态',
      activityVisibleDesc: '显示您的在线状态和最后活动时间',
      dataCollection: '数据收集',
      dataCollectionDesc: '允许收集匿名使用数据以改善服务',
      interfaceLanguage: '界面语言',
      timezoneSettings: '时区设置',
      autoSaveEnabled: '自动保存已启用',
      autoSaveDesc: '您的设置会自动保存。主题更改立即生效，其他设置在修改后1秒内保存。',
      immediately: '立即生效',
      autoSave: '自动保存',
      saving: '正在保存...'
    },
    security: {
      title: '安全中心',
      description: '管理您的账户安全设置和登录记录',
      loginNotifications: '登录通知',
      loginNotificationsDesc: '当有新设备登录时发送邮件通知',
      passwordSecurity: '密码安全',
      changePassword: '修改密码',
      currentPassword: '当前密码',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      loginHistory: '登录历史',
      noLoginHistory: '暂无登录记录',
      device: '设备',
      location: '位置',
      time: '时间',
      ipAddress: 'IP地址'
    },
    profile: {
      title: '个人资料',
      description: '查看和编辑您的个人信息',
      personalInfo: '个人信息',
      avatar: '头像',
      name: '姓名',
      bio: '个人简介',
      lastLogin: '最后登录',
      memberSince: '注册时间',
      uploadAvatar: '上传头像',
      removeAvatar: '移除头像',
      maxFileSize: '最大文件大小：2MB',
      supportedFormats: '支持格式：JPG, PNG, GIF',
      never: '从未'
    },
    admin: {
      title: '管理员面板',
      userManagement: '用户管理',
      emailSystem: '邮件系统',
      systemStats: '系统统计',
      sendEmail: '发送邮件',
      totalUsers: '总用户数',
      activeUsers: '活跃用户',
      emailsSent: '已发送邮件'
    },
    social: {
      title: '社交中心',
      description: '与好友互动，分享动态和消息',
      friends: '好友管理',
      friendsDesc: '查看和管理您的好友列表',
      messages: '私信聊天',
      messagesDesc: '与好友进行私密对话',
      posts: '动态分享',
      postsDesc: '发布和查看社交动态',
      activities: '活动动态',
      activitiesDesc: '查看好友的最新活动',
      findFriends: '寻找好友',
      sendMessage: '发送消息',
      createPost: '发布动态',
      viewProfile: '查看资料',
      addFriend: '添加好友',
      removeFriend: '删除好友',
      acceptRequest: '接受请求',
      rejectRequest: '拒绝请求',
      pendingRequests: '待处理请求',
      sentRequests: '已发送请求',
      friendsList: '好友列表',
      noFriends: '暂无好友，快去添加一些吧！',
      noMessages: '暂无消息',
      noPosts: '暂无动态',
      searchPlaceholder: '搜索用户或内容...',
      messageContent: '消息内容',
      postContent: '动态内容',
      postPlaceholder: '分享你的想法...',
      messagePlaceholder: '输入消息...',
      sendPost: '发布',
      reply: '回复',
      like: '点赞',
      share: '分享',
      comment: '评论',
      online: '在线',
      offline: '离线',
      lastSeen: '最后在线',
      mutual: '共同',
      mutualFriends: '共同好友',
      newPost: '新动态',
      newMessage: '新消息',
      friendRequest: '好友请求',
      activity: '活动',
      notifications: '通知',
      markAsRead: '标为已读',
      deletePost: '删除动态',
      editPost: '编辑动态',
      reportUser: '举报用户',
      blockUser: '拉黑用户'
    },
    errors: {
      networkError: '网络连接错误',
      unauthorized: '未授权访问',
      notFound: '页面未找到',
      serverError: '服务器错误',
      validationError: '数据验证失败',
      uploadError: '上传失败',
      emailSendError: '邮件发送失败'
    }
  },
  'zh-TW': {
    common: {
      save: '儲存',
      cancel: '取消',
      confirm: '確認',
      loading: '載入中...',
      error: '錯誤',
      success: '成功',
      back: '返回',
      next: '下一步',
      submit: '提交',
      delete: '刪除',
      edit: '編輯',
      view: '檢視'
    },
    auth: {
      login: '登入',
      register: '註冊',
      logout: '登出',
      email: '電子郵件',
      password: '密碼',
      confirmPassword: '確認密碼',
      forgotPassword: '忘記密碼',
      rememberMe: '記住我',
      loginSuccess: '登入成功',
      registerSuccess: '註冊成功',
      invalidCredentials: '電子郵件或密碼錯誤',
      emailExists: '電子郵件已存在',
      passwordMismatch: '密碼不匹配',
      weakPassword: '密碼強度不足',
      verifyEmail: '驗證電子郵件',
      emailVerified: '電子郵件已驗證'
    },
    navigation: {
      dashboard: '儀表板',
      profile: '個人資料',
      settings: '系統設定',
      security: '安全中心',
      admin: '管理員',
      social: '社交中心'
    },
    dashboard: {
      title: '儀表板',
      welcome: '歡迎回來',
      stats: '統計資料',
      recentActivity: '最近活動'
    },
    settings: {
      title: '系統設定',
      description: '個人化您的帳戶體驗和偏好設定',
      appearance: '外觀設定',
      appearanceDesc: '自訂介面主題和顯示偏好',
      notifications: '通知設定',
      notificationsDesc: '管理您接收通知的方式和類型',
      privacy: '隱私設定',
      privacyDesc: '控制您的個人資訊可見性和資料收集偏好',
      language: '語言和地區',
      languageDesc: '設定介面語言和時區偏好(支持性較差)',
      theme: '主題模式',
      lightMode: '淺色模式',
      darkMode: '深色模式',
      autoMode: '跟隨系統',
      lightModeDesc: '始終使用淺色主題',
      darkModeDesc: '始終使用深色主題',
      autoModeDesc: '根據系統設定自動切換',
      emailNotifications: '電子郵件通知',
      emailNotificationsDesc: '接收重要帳戶資訊和安全提醒',
      browserNotifications: '瀏覽器通知',
      browserNotificationsDesc: '在瀏覽器中顯示即時通知',
      marketingNotifications: '行銷推廣',
      marketingNotificationsDesc: '接收產品更新和促銷資訊',
      profileVisible: '公開個人資料',
      profileVisibleDesc: '允許其他使用者檢視您的基本資訊',
      activityVisible: '顯示活動狀態',
      activityVisibleDesc: '顯示您的線上狀態和最後活動時間',
      dataCollection: '資料收集',
      dataCollectionDesc: '允許收集匿名使用資料以改善服務',
      interfaceLanguage: '介面語言',
      timezoneSettings: '時區設定',
      autoSaveEnabled: '自動儲存已啟用',
      autoSaveDesc: '您的設定會自動儲存。主題變更立即生效，其他設定在修改後1秒內儲存。',
      immediately: '立即生效',
      autoSave: '自動儲存',
      saving: '正在儲存...'
    },
    security: {
      title: '安全中心',
      description: '管理您的帳戶安全設定和登入記錄',
      loginNotifications: '登入通知',
      loginNotificationsDesc: '當有新裝置登入時發送電子郵件通知',
      passwordSecurity: '密碼安全',
      changePassword: '修改密碼',
      currentPassword: '目前密碼',
      newPassword: '新密碼',
      confirmNewPassword: '確認新密碼',
      loginHistory: '登入歷史',
      noLoginHistory: '暫無登入記錄',
      device: '裝置',
      location: '位置',
      time: '時間',
      ipAddress: 'IP位址'
    },
    profile: {
      title: '個人資料',
      description: '檢視和編輯您的個人資訊',
      personalInfo: '個人資訊',
      avatar: '頭像',
      name: '姓名',
      bio: '個人簡介',
      lastLogin: '最後登入',
      memberSince: '註冊時間',
      uploadAvatar: '上傳頭像',
      removeAvatar: '移除頭像',
      maxFileSize: '最大檔案大小：2MB',
      supportedFormats: '支援格式：JPG, PNG, GIF',
      never: '從未'
    },
    admin: {
      title: '管理員面板',
      userManagement: '使用者管理',
      emailSystem: '電子郵件系統',
      systemStats: '系統統計',
      sendEmail: '發送電子郵件',
      totalUsers: '總使用者數',
      activeUsers: '活躍使用者',
      emailsSent: '已發送電子郵件'
    },
    social: {
      title: '社交中心',
      description: '與好友互動，分享動態和訊息',
      friends: '好友管理',
      friendsDesc: '檢視和管理您的好友清單',
      messages: '私訊聊天',
      messagesDesc: '與好友進行私密對話',
      posts: '動態分享',
      postsDesc: '發布和檢視社交動態',
      activities: '活動動態',
      activitiesDesc: '檢視好友的最新活動',
      findFriends: '尋找好友',
      sendMessage: '發送訊息',
      createPost: '發布動態',
      viewProfile: '檢視資料',
      addFriend: '添加好友',
      removeFriend: '刪除好友',
      acceptRequest: '接受請求',
      rejectRequest: '拒絕請求',
      pendingRequests: '待處理請求',
      sentRequests: '已發送請求',
      friendsList: '好友清單',
      noFriends: '暫無好友，快去添加一些吧！',
      noMessages: '暫無訊息',
      noPosts: '暫無動態',
      searchPlaceholder: '搜尋使用者或內容...',
      messageContent: '訊息內容',
      postContent: '動態內容',
      postPlaceholder: '分享你的想法...',
      messagePlaceholder: '輸入訊息...',
      sendPost: '發布',
      reply: '回復',
      like: '按讚',
      share: '分享',
      comment: '評論',
      online: '線上',
      offline: '離線',
      lastSeen: '最後在線',
      mutual: '共同',
      mutualFriends: '共同好友',
      newPost: '新動態',
      newMessage: '新訊息',
      friendRequest: '好友請求',
      activity: '活動',
      notifications: '通知',
      markAsRead: '標為已讀',
      deletePost: '刪除動態',
      editPost: '編輯動態',
      reportUser: '舉報使用者',
      blockUser: '封鎖使用者'
    },
    errors: {
      networkError: '網路連線錯誤',
      unauthorized: '未授權存取',
      notFound: '頁面未找到',
      serverError: '伺服器錯誤',
      validationError: '資料驗證失敗',
      uploadError: '上傳失敗',
      emailSendError: '電子郵件發送失敗'
    }
  },
  'en-US': {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password',
      rememberMe: 'Remember Me',
      loginSuccess: 'Login successful',
      registerSuccess: 'Registration successful',
      invalidCredentials: 'Invalid email or password',
      emailExists: 'Email already exists',
      passwordMismatch: 'Passwords do not match',
      weakPassword: 'Password is too weak',
      verifyEmail: 'Verify Email',
      emailVerified: 'Email verified'
    },
    navigation: {
      dashboard: 'Dashboard',
      profile: 'Profile',
      settings: 'Settings',
      security: 'Security',
      admin: 'Admin',
      social: 'Social'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      stats: 'Statistics',
      recentActivity: 'Recent Activity'
    },
    settings: {
      title: 'Settings',
      description: 'Personalize your account experience and preferences',
      appearance: 'Appearance',
      appearanceDesc: 'Customize interface theme and display preferences',
      notifications: 'Notifications',
      notificationsDesc: 'Manage how and what notifications you receive',
      privacy: 'Privacy',
      privacyDesc: 'Control your personal information visibility and data collection preferences',
      language: 'Language & Region',
      languageDesc: 'Set interface language and timezone preferences(Support is poor)',
      theme: 'Theme Mode',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      autoMode: 'Auto Mode',
      lightModeDesc: 'Always use light theme',
      darkModeDesc: 'Always use dark theme',
      autoModeDesc: 'Switch automatically based on system settings',
      emailNotifications: 'Email Notifications',
      emailNotificationsDesc: 'Receive important account information and security alerts',
      browserNotifications: 'Browser Notifications',
      browserNotificationsDesc: 'Show real-time notifications in browser',
      marketingNotifications: 'Marketing',
      marketingNotificationsDesc: 'Receive product updates and promotional information',
      profileVisible: 'Public Profile',
      profileVisibleDesc: 'Allow other users to view your basic information',
      activityVisible: 'Activity Status',
      activityVisibleDesc: 'Show your online status and last activity time',
      dataCollection: 'Data Collection',
      dataCollectionDesc: 'Allow collection of anonymous usage data to improve service',
      interfaceLanguage: 'Interface Language',
      timezoneSettings: 'Timezone Settings',
      autoSaveEnabled: 'Auto-save enabled',
      autoSaveDesc: 'Your settings are automatically saved. Theme changes take effect immediately, other settings are saved within 1 second after modification.',
      immediately: 'Immediate',
      autoSave: 'Auto-save',
      saving: 'Saving...'
    },
    security: {
      title: 'Security Center',
      description: 'Manage your account security settings and login records',
      loginNotifications: 'Login Notifications',
      loginNotificationsDesc: 'Send email notifications when new devices sign in',
      passwordSecurity: 'Password Security',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      loginHistory: 'Login History',
      noLoginHistory: 'No login records yet',
      device: 'Device',
      location: 'Location',
      time: 'Time',
      ipAddress: 'IP Address'
    },
    profile: {
      title: 'Profile',
      description: 'View and edit your personal information',
      personalInfo: 'Personal Information',
      avatar: 'Avatar',
      name: 'Name',
      bio: 'Bio',
      lastLogin: 'Last Login',
      memberSince: 'Member Since',
      uploadAvatar: 'Upload Avatar',
      removeAvatar: 'Remove Avatar',
      maxFileSize: 'Max file size: 2MB',
      supportedFormats: 'Supported formats: JPG, PNG, GIF',
      never: 'Never'
    },
    admin: {
      title: 'Admin Panel',
      userManagement: 'User Management',
      emailSystem: 'Email System',
      systemStats: 'System Statistics',
      sendEmail: 'Send Email',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      emailsSent: 'Emails Sent'
    },
    social: {
      title: 'Social Hub',
      description: 'Connect with friends, share updates and messages',
      friends: 'Friends',
      friendsDesc: 'View and manage your friends list',
      messages: 'Messages',
      messagesDesc: 'Private conversations with friends',
      posts: 'Posts',
      postsDesc: 'Share and view social updates',
      activities: 'Activities',
      activitiesDesc: 'See latest updates from friends',
      findFriends: 'Find Friends',
      sendMessage: 'Send Message',
      createPost: 'Create Post',
      viewProfile: 'View Profile',
      addFriend: 'Add Friend',
      removeFriend: 'Remove Friend',
      acceptRequest: 'Accept Request',
      rejectRequest: 'Reject Request',
      pendingRequests: 'Pending Requests',
      sentRequests: 'Sent Requests',
      friendsList: 'Friends List',
      noFriends: 'No friends yet, go add some!',
      noMessages: 'No messages',
      noPosts: 'No posts',
      searchPlaceholder: 'Search users or content...',
      messageContent: 'Message content',
      postContent: 'Post content',
      postPlaceholder: 'Share your thoughts...',
      messagePlaceholder: 'Type a message...',
      sendPost: 'Post',
      reply: 'Reply',
      like: 'Like',
      share: 'Share',
      comment: 'Comment',
      online: 'Online',
      offline: 'Offline',
      lastSeen: 'Last seen',
      mutual: 'Mutual',
      mutualFriends: 'Mutual friends',
      newPost: 'New Post',
      newMessage: 'New Message',
      friendRequest: 'Friend Request',
      activity: 'Activity',
      notifications: 'Notifications',
      markAsRead: 'Mark as read',
      deletePost: 'Delete Post',
      editPost: 'Edit Post',
      reportUser: 'Report User',
      blockUser: 'Block User'
    },
    errors: {
      networkError: 'Network connection error',
      unauthorized: 'Unauthorized access',
      notFound: 'Page not found',
      serverError: 'Server error',
      validationError: 'Data validation failed',
      uploadError: 'Upload failed',
      emailSendError: 'Email send failed'
    }
  },
  'ja-JP': {
    common: {
      save: '保存',
      cancel: 'キャンセル',
      confirm: '確認',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      back: '戻る',
      next: '次へ',
      submit: '送信',
      delete: '削除',
      edit: '編集',
      view: '表示'
    },
    auth: {
      login: 'ログイン',
      register: '登録',
      logout: 'ログアウト',
      email: 'メールアドレス',
      password: 'パスワード',
      confirmPassword: 'パスワード確認',
      forgotPassword: 'パスワードを忘れた',
      rememberMe: 'ログイン状態を保持',
      loginSuccess: 'ログイン成功',
      registerSuccess: '登録成功',
      invalidCredentials: 'メールアドレスまたはパスワードが正しくありません',
      emailExists: 'メールアドレスは既に存在します',
      passwordMismatch: 'パスワードが一致しません',
      weakPassword: 'パスワードが弱すぎます',
      verifyEmail: 'メール認証',
      emailVerified: 'メールが認証されました'
    },
    navigation: {
      dashboard: 'ダッシュボード',
      profile: 'プロフィール',
      settings: '設定',
      security: 'セキュリティ',
      admin: '管理者',
      social: 'ソーシャル'
    },
    dashboard: {
      title: 'ダッシュボード',
      welcome: 'おかえりなさい',
      stats: '統計',
      recentActivity: '最近のアクティビティ'
    },
    settings: {
      title: '設定',
      description: 'アカウントエクスペリエンスと設定をカスタマイズ',
      appearance: '外観設定',
      appearanceDesc: 'インターフェーステーマと表示設定をカスタマイズ',
      notifications: '通知設定',
      notificationsDesc: '通知の受信方法と種類を管理',
      privacy: 'プライバシー設定',
      privacyDesc: '個人情報の可視性とデータ収集設定を制御',
      language: '言語と地域',
      languageDesc: 'インターフェース言語とタイムゾーン設定(サポート性は低い)',
      theme: 'テーマモード',
      lightMode: 'ライトモード',
      darkMode: 'ダークモード',
      autoMode: '自動モード',
      lightModeDesc: '常にライトテーマを使用',
      darkModeDesc: '常にダークテーマを使用',
      autoModeDesc: 'システム設定に基づいて自動切り替え',
      emailNotifications: 'メール通知',
      emailNotificationsDesc: '重要なアカウント情報とセキュリティ警告を受信',
      browserNotifications: 'ブラウザ通知',
      browserNotificationsDesc: 'ブラウザでリアルタイム通知を表示',
      marketingNotifications: 'マーケティング',
      marketingNotificationsDesc: '製品アップデートとプロモーション情報を受信',
      profileVisible: '公開プロフィール',
      profileVisibleDesc: '他のユーザーが基本情報を表示できるようにする',
      activityVisible: 'アクティビティ状況',
      activityVisibleDesc: 'オンライン状況と最終アクティビティ時間を表示',
      dataCollection: 'データ収集',
      dataCollectionDesc: 'サービス向上のための匿名使用データ収集を許可',
      interfaceLanguage: 'インターフェース言語',
      timezoneSettings: 'タイムゾーン設定',
      autoSaveEnabled: '自動保存が有効',
      autoSaveDesc: '設定は自動的に保存されます。テーマ変更は即座に反映され、その他の設定は変更後1秒以内に保存されます。',
      immediately: '即座に反映',
      autoSave: '自動保存',
      saving: '保存中...'
    },
    security: {
      title: 'セキュリティセンター',
      description: 'アカウントセキュリティ設定とログイン記録を管理',
      loginNotifications: 'ログイン通知',
      loginNotificationsDesc: '新しいデバイスでログインした際にメール通知を送信',
      passwordSecurity: 'パスワードセキュリティ',
      changePassword: 'パスワード変更',
      currentPassword: '現在のパスワード',
      newPassword: '新しいパスワード',
      confirmNewPassword: '新しいパスワード確認',
      loginHistory: 'ログイン履歴',
      noLoginHistory: 'ログイン記録がありません',
      device: 'デバイス',
      location: '場所',
      time: '時間',
      ipAddress: 'IPアドレス'
    },
    profile: {
      title: 'プロフィール',
      description: '個人情報の表示と編集',
      personalInfo: '個人情報',
      avatar: 'アバター',
      name: '名前',
      bio: '自己紹介',
      lastLogin: '最終ログイン',
      memberSince: '登録日',
      uploadAvatar: 'アバターアップロード',
      removeAvatar: 'アバター削除',
      maxFileSize: '最大ファイルサイズ：2MB',
      supportedFormats: '対応形式：JPG, PNG, GIF',
      never: 'なし'
    },
    admin: {
      title: '管理者パネル',
      userManagement: 'ユーザー管理',
      emailSystem: 'メールシステム',
      systemStats: 'システム統計',
      sendEmail: 'メール送信',
      totalUsers: '総ユーザー数',
      activeUsers: 'アクティブユーザー',
      emailsSent: '送信済みメール'
    },
    social: {
      title: 'ソーシャルハブ',
      description: '友達と交流し、更新やメッセージを共有',
      friends: 'フレンド',
      friendsDesc: 'フレンドリストの表示と管理',
      messages: 'メッセージ',
      messagesDesc: '友達とのプライベート会話',
      posts: '投稿',
      postsDesc: 'ソーシャル更新の共有と表示',
      activities: 'アクティビティ',
      activitiesDesc: '友達の最新更新を確認',
      findFriends: 'フレンドを探す',
      sendMessage: 'メッセージ送信',
      createPost: '投稿作成',
      viewProfile: 'プロフィール表示',
      addFriend: 'フレンド追加',
      removeFriend: 'フレンド削除',
      acceptRequest: 'リクエスト承認',
      rejectRequest: 'リクエスト拒否',
      pendingRequests: '保留中のリクエスト',
      sentRequests: '送信済みリクエスト',
      friendsList: 'フレンドリスト',
      noFriends: 'まだフレンドがいません。追加しましょう！',
      noMessages: 'メッセージがありません',
      noPosts: '投稿がありません',
      searchPlaceholder: 'ユーザーやコンテンツを検索...',
      messageContent: 'メッセージ内容',
      postContent: '投稿内容',
      postPlaceholder: 'あなたの考えを共有...',
      messagePlaceholder: 'メッセージを入力...',
      sendPost: '投稿',
      reply: '返信',
      like: 'いいね',
      share: 'シェア',
      comment: 'コメント',
      online: 'オンライン',
      offline: 'オフライン',
      lastSeen: '最後のアクセス',
      mutual: '共通',
      mutualFriends: '共通の友達',
      newPost: '新しい投稿',
      newMessage: '新しいメッセージ',
      friendRequest: 'フレンドリクエスト',
      activity: 'アクティビティ',
      notifications: '通知',
      markAsRead: '既読にする',
      deletePost: '投稿削除',
      editPost: '投稿編集',
      reportUser: 'ユーザー報告',
      blockUser: 'ユーザーブロック'
    },
    errors: {
      networkError: 'ネットワーク接続エラー',
      unauthorized: '認証されていないアクセス',
      notFound: 'ページが見つかりません',
      serverError: 'サーバーエラー',
      validationError: 'データ検証に失敗しました',
      uploadError: 'アップロードに失敗しました',
      emailSendError: 'メール送信に失敗しました'
    }
  }
}

// 时区配置
export const timezoneConfig = {
  'Asia/Shanghai': { offset: '+08:00', name: '北京时间' },
  'Asia/Tokyo': { offset: '+09:00', name: '东京时间' },
  'America/New_York': { offset: '-05:00', name: '纽约时间' },
  'Europe/London': { offset: '+00:00', name: '伦敦时间' }
}

interface LanguageContextType {
  language: Language
  timezone: string
  t: LanguageResources
  setLanguage: (lang: Language) => void
  setTimezone: (tz: string) => void
  formatDate: (date: Date | string, format?: 'date' | 'time' | 'datetime') => string
  formatRelativeTime: (date: Date | string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh-CN')
  const [timezone, setTimezone] = useState<string>('Asia/Shanghai')

  // 初始化语言和时区设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/user/user-settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            if (data.settings.language) {
              setLanguage(data.settings.language as Language)
            }
            if (data.settings.timezone) {
              setTimezone(data.settings.timezone)
            }
          }
        }
      } catch (error) {
        console.error('加载语言设置失败:', error)
      }
    }

    loadSettings()
  }, [])

  // 格式化日期时间
  const formatDate = (date: Date | string, format: 'date' | 'time' | 'datetime' = 'datetime'): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone
    }

    switch (format) {
      case 'date':
        options.year = 'numeric'
        options.month = 'long'
        options.day = 'numeric'
        break
      case 'time':
        options.hour = '2-digit'
        options.minute = '2-digit'
        break
      case 'datetime':
        options.year = 'numeric'
        options.month = 'short'
        options.day = 'numeric'
        options.hour = '2-digit'
        options.minute = '2-digit'
        break
    }

    return new Intl.DateTimeFormat(language, options).format(d)
  }

  // 格式化相对时间
  const formatRelativeTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    const t = languageResources[language]

    if (diffSec < 60) {
      return language === 'zh-CN' ? '刚刚' : 
             language === 'zh-TW' ? '剛剛' :
             language === 'en-US' ? 'Just now' : 'たった今'
    } else if (diffMin < 60) {
      return language === 'zh-CN' ? `${diffMin}分钟前` :
             language === 'zh-TW' ? `${diffMin}分鐘前` :
             language === 'en-US' ? `${diffMin} minutes ago` : `${diffMin}分前`
    } else if (diffHour < 24) {
      return language === 'zh-CN' ? `${diffHour}小时前` :
             language === 'zh-TW' ? `${diffHour}小時前` :
             language === 'en-US' ? `${diffHour} hours ago` : `${diffHour}時間前`
    } else if (diffDay < 7) {
      return language === 'zh-CN' ? `${diffDay}天前` :
             language === 'zh-TW' ? `${diffDay}天前` :
             language === 'en-US' ? `${diffDay} days ago` : `${diffDay}日前`
    } else {
      return formatDate(d, 'date')
    }
  }

  const value: LanguageContextType = {
    language,
    timezone,
    t: languageResources[language],
    setLanguage,
    setTimezone,
    formatDate,
    formatRelativeTime
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center mb-8">
            <Link
              to="/register"
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回注册
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="mx-logo-large mx-auto mb-4">
                <img 
                  src="/logo.svg" 
                  alt="MX Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                隐私政策
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                MXacc 统一账号管理系统
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                最后更新：{new Date().toLocaleDateString('zh-CN')}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>信息收集</h2>
              <p>
                我们收集您在使用 MXacc 服务时提供的信息，包括但不限于：
              </p>
              <ul>
                <li><strong>账户信息</strong>：用户名、邮箱地址、密码（加密存储）</li>
                <li><strong>个人资料</strong>：昵称、头像、个人简介等可选信息</li>
                <li><strong>使用数据</strong>：登录记录、操作日志、设备信息</li>
                <li><strong>技术信息</strong>：IP地址、浏览器类型、操作系统信息</li>
              </ul>

              <h2>信息使用</h2>
              <p>我们使用收集的信息用于：</p>
              <ul>
                <li>提供和维护 MXacc 服务</li>
                <li>验证用户身份和确保账户安全</li>
                <li>改进我们的服务质量</li>
                <li>向您发送重要的服务通知</li>
                <li>防止欺诈和滥用行为</li>
              </ul>

              <h2>信息保护</h2>
              <p>
                我们采取多种安全措施来保护您的个人信息：
              </p>
              <ul>
                <li><strong>加密传输</strong>：所有数据传输均使用 HTTPS 加密</li>
                <li><strong>密码安全</strong>：密码使用 bcrypt 算法加密存储</li>
                <li><strong>访问控制</strong>：严格限制对个人数据的访问权限</li>
                <li><strong>定期审计</strong>：定期进行安全审计和漏洞检测</li>
              </ul>

              <h2>信息共享</h2>
              <p>
                我们承诺不会出售、出租或以其他方式向第三方透露您的个人信息，除非：
              </p>
              <ul>
                <li>获得您的明确同意</li>
                <li>法律法规要求</li>
                <li>保护我们的合法权益</li>
                <li>防止紧急情况下的人身伤害</li>
              </ul>

              <h2>Cookie 使用</h2>
              <p>
                我们使用 Cookie 和类似技术来：
              </p>
              <ul>
                <li>保持您的登录状态</li>
                <li>记住您的偏好设置</li>
                <li>分析网站使用情况</li>
                <li>提供个性化体验</li>
              </ul>

              <h2>您的权利</h2>
              <p>您有权：</p>
              <ul>
                <li><strong>访问权</strong>：查看我们持有的您的个人信息</li>
                <li><strong>更正权</strong>：要求更正不准确的个人信息</li>
                <li><strong>删除权</strong>：要求删除您的个人信息</li>
                <li><strong>限制处理权</strong>：限制我们处理您的个人信息</li>
                <li><strong>数据可携带权</strong>：获取您的个人信息副本</li>
              </ul>

              <h2>儿童隐私</h2>
              <p>
                我们的服务不面向 13 岁以下的儿童。如果我们发现收集了儿童的个人信息，
                我们将立即删除这些信息。
              </p>

              <h2>政策更新</h2>
              <p>
                我们可能会不时更新本隐私政策。重大变更时，我们会通过邮件或网站通知您。
                请定期查看本页面以了解最新的隐私政策。
              </p>

              <h2>联系我们</h2>
              <p>
                如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
              </p>
              <ul>
                <li><strong>邮箱</strong>：privacy@mxacc.com</li>
                <li><strong>地址</strong>：梦锡工作室</li>
              </ul>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-0">
                  <strong>重要提醒：</strong>
                  使用 MXacc 服务即表示您同意本隐私政策。如果您不同意本政策，请停止使用我们的服务。
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} 梦锡工作室 MXacc. 保留所有权利。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
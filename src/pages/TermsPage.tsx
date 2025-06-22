import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
                服务条款
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
              <h2>1. 服务接受</h2>
              <p>
                欢迎使用 MXacc 统一账号管理系统（以下简称"本服务"）。本服务由梦锡工作室（以下简称"我们"）提供。
                通过注册、访问或使用本服务，您表示同意受本服务条款的约束。
              </p>

              <h2>2. 服务描述</h2>
              <p>
                MXacc 是一个统一的账号管理平台，提供以下功能：
              </p>
              <ul>
                <li>用户账号注册、登录和管理</li>
                <li>个人资料设置和维护</li>
                <li>账户安全和隐私设置</li>
                <li>邮箱验证和通知服务</li>
                <li>其他相关的账号管理功能</li>
              </ul>

              <h2>3. 用户账户</h2>
              <h3>3.1 账户注册</h3>
              <ul>
                <li>您必须提供准确、完整和最新的注册信息</li>
                <li>您有责任维护账户信息的准确性</li>
                <li>每个用户只能注册一个账户</li>
                <li>您必须年满13岁才能注册账户</li>
              </ul>

              <h3>3.2 账户安全</h3>
              <ul>
                <li>您有责任保护您的账户密码和登录凭据</li>
                <li>您对使用您账户进行的所有活动负责</li>
                <li>如发现账户被盗用，请立即联系我们</li>
                <li>不得与他人分享账户信息</li>
              </ul>

              <h2>4. 用户行为规范</h2>
              <p>使用本服务时，您同意：</p>
              <ul>
                <li><strong>合法使用</strong>：仅出于合法目的使用本服务</li>
                <li><strong>准确信息</strong>：提供真实、准确的个人信息</li>
                <li><strong>尊重他人</strong>：不骚扰、威胁或冒充他人</li>
                <li><strong>安全行为</strong>：不试图破坏或干扰服务的安全性</li>
                <li><strong>合规使用</strong>：遵守适用的法律法规</li>
              </ul>

              <h2>5. 禁止行为</h2>
              <p>您不得：</p>
              <ul>
                <li>使用自动化工具（机器人、爬虫等）访问服务</li>
                <li>尝试获取其他用户的账户信息</li>
                <li>上传或传播恶意软件、病毒等有害内容</li>
                <li>进行任何可能损害服务稳定性的活动</li>
                <li>违反任何适用的法律或法规</li>
                <li>侵犯我们或第三方的知识产权</li>
              </ul>

              <h2>6. 服务可用性</h2>
              <ul>
                <li>我们努力保持服务的稳定运行，但不保证100%的可用性</li>
                <li>我们可能因维护、升级等原因暂时中断服务</li>
                <li>我们会提前通知计划内的服务中断</li>
                <li>对于服务中断造成的损失，我们不承担责任</li>
              </ul>

              <h2>7. 数据和隐私</h2>
              <ul>
                <li>我们重视您的隐私，详情请参阅我们的<Link to="/privacy" className="text-blue-600 dark:text-blue-400">隐私政策</Link></li>
                <li>我们可能收集和处理您的个人数据以提供服务</li>
                <li>您同意我们按照隐私政策处理您的数据</li>
                <li>您有权访问、更正或删除您的个人数据</li>
              </ul>

              <h2>8. 知识产权</h2>
              <ul>
                <li>本服务及其所有内容均受知识产权法保护</li>
                <li>您仅获得使用服务的有限许可</li>
                <li>未经授权，不得复制、修改或分发服务内容</li>
                <li>MXacc、梦锡工作室的商标和标识归我们所有</li>
              </ul>

              <h2>9. 免责声明</h2>
              <ul>
                <li>本服务按"现状"提供，我们不提供任何明示或暗示的担保</li>
                <li>我们不保证服务完全无错误或持续可用</li>
                <li>您使用服务的风险由您自行承担</li>
                <li>我们不对因使用服务而产生的任何损失负责</li>
              </ul>

              <h2>10. 责任限制</h2>
              <ul>
                <li>在法律允许的最大范围内，我们的责任限于提供服务本身</li>
                <li>我们不对间接、偶然或后果性损害承担责任</li>
                <li>我们的总责任不超过您在过去12个月内向我们支付的费用</li>
              </ul>

              <h2>11. 服务终止</h2>
              <h3>11.1 您的终止权</h3>
              <ul>
                <li>您可以随时停止使用服务</li>
                <li>您可以要求删除您的账户</li>
              </ul>

              <h3>11.2 我们的终止权</h3>
              <ul>
                <li>如您违反本条款，我们可以暂停或终止您的账户</li>
                <li>我们可以随时终止或停止提供服务</li>
                <li>服务终止后，您无权继续使用服务</li>
              </ul>

              <h2>12. 条款变更</h2>
              <ul>
                <li>我们可能不时更新本服务条款</li>
                <li>重大变更将通过邮件或网站通知您</li>
                <li>继续使用服务表示您接受更新后的条款</li>
                <li>如不同意变更，请停止使用服务</li>
              </ul>

              <h2>13. 适用法律</h2>
              <ul>
                <li>本条款受中华人民共和国法律管辖</li>
                <li>任何争议将在我们所在地的法院解决</li>
                <li>如条款的任何部分无效，其余部分仍然有效</li>
              </ul>

              <h2>14. 联系我们</h2>
              <p>
                如果您对本服务条款有任何疑问，请通过以下方式联系我们：
              </p>
              <ul>
                <li><strong>邮箱</strong>：legal@mxacc.com</li>
                <li><strong>地址</strong>：梦锡工作室</li>
              </ul>

              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-0">
                  <strong>重要提醒：</strong>
                  请仔细阅读并理解本服务条款。注册账户即表示您已阅读、理解并同意遵守本条款的所有内容。
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
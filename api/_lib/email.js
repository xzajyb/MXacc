// 简单的邮件发送模拟器
// 在生产环境中，这里应该使用真实的邮件服务（如 SendGrid, Nodemailer 等）

const sendVerificationEmail = async (email, username, verificationCode) => {
  // 在开发环境中，我们只是记录到控制台
  console.log(`发送验证邮件给 ${email}:`);
  console.log(`用户名: ${username}`);
  console.log(`验证码: ${verificationCode}`);
  
  // 模拟发送邮件的延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 在实际应用中，这里应该调用真实的邮件服务API
  // 例如：
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransporter({...});
  // await transporter.sendMail({...});
  
  return true;
};

const sendPasswordResetEmail = async (email, username, resetToken) => {
  console.log(`发送密码重置邮件给 ${email}:`);
  console.log(`用户名: ${username}`);
  console.log(`重置令牌: ${resetToken}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
}; 
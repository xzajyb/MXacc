const mongoose = require('mongoose');
const { Schema } = mongoose;

// 积分类型模型
const pointTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: [30, '积分类型名称不能超过30个字符']
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    maxlength: [10, '积分符号不能超过10个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '积分描述不能超过200个字符']
  },
  color: {
    type: String,
    default: '#3B82F6' // 默认蓝色
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  enabled: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// 积分交易记录模型
const pointTransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pointTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'PointType',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['award', 'deduct', 'exchange', 'expire', 'adjust'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, '原因不能超过200个字符']
  },
  reference: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 索引
pointTypeSchema.index({ name: 1 });
pointTypeSchema.index({ isDefault: 1 });
pointTransactionSchema.index({ userId: 1, pointTypeId: 1 });
pointTransactionSchema.index({ createdAt: -1 });

// 模型导出
const PointType = mongoose.model('PointType', pointTypeSchema);
const PointTransaction = mongoose.model('PointTransaction', pointTransactionSchema);

module.exports = {
  PointType,
  PointTransaction
}; 
const mongoose = require('mongoose');

const expensePayerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount_paid: { type: Number, required: true },
});

const expenseSplitSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount_owed: { type: Number, required: true },
  settled: { type: Boolean, default: false },
  settled_at: { type: Date },
});

const expenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    category: { type: String, default: 'general' },
    date: { type: Date, default: Date.now },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    receipt_url: { type: String },
    notes: { type: String },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payers: [expensePayerSchema],
    splits: [expenseSplitSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

expenseSchema.index({ group_id: 1 });
expenseSchema.index({ created_by: 1 });
expenseSchema.index({ date: 1 });

expenseSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Expense', expenseSchema);

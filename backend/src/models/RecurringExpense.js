const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema({
  expense_template: { type: mongoose.Schema.Types.Mixed, required: true },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  interval: { type: Number, default: 1 },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  next_occurrence: { type: Date, required: true },
  active: { type: Boolean, default: true },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

recurringExpenseSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    expense_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment_text: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);

commentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Comment', commentSchema);

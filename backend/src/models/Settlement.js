const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    from_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    payment_method: { type: String },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    notes: { type: String },
  },
  { timestamps: { createdAt: 'created_at' } }
);

settlementSchema.index({ from_user_id: 1 });
settlementSchema.index({ to_user_id: 1 });

settlementSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Settlement', settlementSchema);

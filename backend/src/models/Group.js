const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joined_at: { type: Date, default: Date.now },
});

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['home', 'trip', 'couple', 'other'],
      required: true,
    },
    image_url: { type: String },
    currency: { type: String, default: 'USD' },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    simplify_debts: { type: Boolean, default: false },
    members: [groupMemberSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

groupSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Group', groupSchema);

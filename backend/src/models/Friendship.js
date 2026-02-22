const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    user_id_1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_id_2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      required: true,
      default: 'pending',
    },
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

friendshipSchema.index({ user_id_1: 1, user_id_2: 1 }, { unique: true });
friendshipSchema.index({ status: 1 });

friendshipSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Friendship', friendshipSchema);

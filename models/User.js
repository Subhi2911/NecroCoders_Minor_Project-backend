const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Microsoft Identity
    microsoftId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    profilePic: {
      type: String,
      default: "",
    },

    // Role for your system
    role: {
      type: String,
      enum: ["admin", "authority", "staff"],
      default: "staff",
    },


    // Activity tracking
    lastLogin: {
      type: Date,
      default: Date.now,
    },

    // Notifications (optional, since you mentioned notifications feature)
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
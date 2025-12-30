// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    message: String,
    fromRole: String,
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
    },
    toRoles: [String],
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);

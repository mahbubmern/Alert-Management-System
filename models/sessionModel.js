import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sessionUsers: [
    {
      sessionUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      sessionStartTime: {
        type: Date,
        default: null,
      },
      sessionEndTime: {
        type: Date,
        default: null,
      },
      sessionNotes: {
        type: String,
        default: "",
      },
    },
  ],
});

export default mongoose.model("Session", sessionSchema);

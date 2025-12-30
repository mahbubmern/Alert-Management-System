import mongoose from "mongoose";

const toolStatusSchema = new mongoose.Schema({
  tools: { type: String, required: true },
  loginStatus: {
    type: String,
    enum: ["successful", "failed"],

    required: true,
  },
  operationalStatus: {
    type: String,
    enum: ["operational", "degraded", "offline", "specialIssue"],

    required: true,
  },
});

const monitoringToolsSchema = new mongoose.Schema(
  {
    sessionUserId: { type: String, required: true },
    sessionUserName: { type: String, required: true },
    sessionTools: [toolStatusSchema], // array of tools
  },
  { timestamps: true }
);

export default mongoose.model("MonitoringTool", monitoringToolsSchema);
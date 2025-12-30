import mongoose from "mongoose";

//create schema
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    index: {
      type: String,
      trim: true,
    },
    ho: {
      type: String,
      trim: true,
    },
    // po: {
    //   type: String,
    //   trim: true,
    // },
    branch: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
      default: null,
    },

    email: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    password: {
      type: String,
      required: true,
    },

    photo: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      default: "user",
    },

    accessToken: {
      type: String,
      trim: true,
      default: null,
    },
    isActivate: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "Active",
    },

    trash: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for scale
userSchema.index({ createdAt: -1, _id: -1 }); // stable latest-first sorting
userSchema.index({ branch: 1 });              // role-based filtering
userSchema.index({ name: 1 });
userSchema.index({ role: 1 });
userSchema.index({ index: 1 });



//text index for search
userSchema.index({ name: "text", role: "text", index: "text", branch: "text", email: "text", status: "text" });

//export user schema

export default mongoose.model("User", userSchema);

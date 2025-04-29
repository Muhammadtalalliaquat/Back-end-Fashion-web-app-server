import mongoose from "mongoose";

const feedBackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    feedBackMessage: {
      type: String,
      required: true,
      minlength: 10,
    },
  },
  { timestamps: true }
);

const FeedBack = mongoose.model("FeedBack", feedBackSchema);

export default FeedBack;
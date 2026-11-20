import mongoose from 'mongoose';

const questSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Поле title є обов'язковим"],
      trim: true,
      unique: true,
      minlength: [2, 'title: щонайменше 2 символи'],
      maxlength: [100, 'title: не більше 100 символів'],
    },
    priority: {
      type: String,
      required: [true, "Поле priority є обов'язковим"],
      trim: true,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'priority: допустимі значення low, medium, high',
      },
    },
    done: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'У запису має бути власник'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id;
      },
    },
  }
);

export default mongoose.model('Quest', questSchema);
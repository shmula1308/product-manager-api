const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },

    qty: {
      type: Number,
      required: true,
      default: 1,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.methods.toJSON = function () {
  const product = this;
  const productObject = product.toObject();

  delete productObject.owner;

  return productObject;
};
const Product = mongoose.model("Product", productSchema);

module.exports = Product;

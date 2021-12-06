const express = require("express");
const Product = require("../models/product");
const auth = require("../middleware/auth");

const router = new express.Router();

// Create a product
router.post("/products", auth, async (req, res) => {
  const product = new Product({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await product.save(); //in order to have methods available on instances, you have to use the Product constructor. Prototype chain will make those methods available to instances
    res.status(201).send(product);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get all products

router.get("/products", auth, async (req, res) => {
  const user = req.user;
  try {
    await user.populate("products");
    res.send(user.products);
  } catch (e) {
    res.status(500).send();
  }
});

// Get a single product
router.get("/products/:id", auth, async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.findOne({ _id: id, owner: req.user._id });
    if (!product) {
      res.status(404).send(e);
    }
    res.status(200).send(product);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Update product

router.patch("/products/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["qty"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    res.status(400).send({ message: "Invalid update!" });
  }

  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });

    if (!product) {
      res.status(404).send(product);
    }

    updates.forEach((update) => (product[update] = req.body[update]));

    await product.save();
    res.status(200).send(product);
  } catch (e) {
    res.status(500).send();
  }
});

// Delete a product

router.delete("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndRemove({ _id: req.params.id, owner: req.user._id });

    if (!product) {
      res.status(404).send();
    }

    res.status(200).send(product);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;

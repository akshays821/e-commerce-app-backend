import Product from "../models/product.js";

export const createProduct = async (req, res) => {
  try {
    let imageUrl = null;
    console.log("--- Create Product Request ---");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("----------------------------");

    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    } else {
      return res.status(400).json({ message: "Image is required" });
    }
    
    
    const product = await Product.create({
      ...req.body,
      image: imageUrl
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


export const getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
};

export const updateProduct = async (req, res) => {
  let updateData = req.body;
  if (req.file) {
    updateData.image = req.file.path;
  }
  const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
};

export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};

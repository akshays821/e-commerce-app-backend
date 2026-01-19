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
    
    
    const productData = { ...req.body };

    // Parse category if it's sent as a JSON string (FormData)
    if (productData.category && typeof productData.category === 'string') {
        try {
            productData.category = JSON.parse(productData.category);
        } catch (e) {
            // fallback if simple comma separated or single string
            productData.category = productData.category.split(',').map(c => c.trim());
        }
    }

    // Parse tags if it's sent as a JSON string
    if (productData.tags && typeof productData.tags === 'string') {
        try {
            productData.tags = JSON.parse(productData.tags);
        } catch (e) {
             productData.tags = productData.tags.split(',').map(t => t.trim());
        }
    }

    const product = await Product.create({
      ...productData,
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



export const updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };
    
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Helper to safely parse JSON or array-like strings
    const parseField = (fieldValue) => {
        if (!fieldValue) return [];
        if (Array.isArray(fieldValue)) return fieldValue;
        if (typeof fieldValue === 'string') {
            try {
                const parsed = JSON.parse(fieldValue);
                if (Array.isArray(parsed)) return parsed;
                return [parsed];
            } catch (e) {
                return fieldValue.split(',').map(item => item.trim()).filter(Boolean);
            }
        }
        return [fieldValue];
    };

    // Robustly parse category
    if (updateData.category !== undefined) {
        updateData.category = parseField(updateData.category);
    }

    // Robustly parse tags
    if (updateData.tags !== undefined) {
        updateData.tags = parseField(updateData.tags);
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!updated) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.json(updated);
  } catch (err) {
      console.error("Update Error:", err);
      res.status(400).json({ message: err.message });
  }
};


export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};

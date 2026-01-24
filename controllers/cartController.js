import Cart from "../models/cart.js";
import Product from "../models/product.js";

// Get User Cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json([]);
    }

    res.status(200).json(cart.products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add to Cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, name, image, price, size, quantity } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, products: [] });
    }

    // Check if item exists
    const itemIndex = cart.products.findIndex(
      (p) => p.productId.toString() === productId && String(p.size || "") === String(size || "")
    );

    if (itemIndex > -1) {
      // Product exists, update quantity
      cart.products[itemIndex].quantity += quantity;
    } else {
      // Add new product
      cart.products.push({
        productId,
        name,
        image,
        price,
        size: size || "", // Normalize to empty string if null
        quantity,
      });
    }

    await cart.save();
    res.status(200).json(cart.products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Remove from Cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, size } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.products = cart.products.filter(
      (p) => !(p.productId.toString() === productId && String(p.size || "") === String(size || ""))
    );

    await cart.save();
    res.status(200).json(cart.products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update Quantity
export const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, size, quantity } = req.body;

    let cart = await Cart.findOne({ userId });
    
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId && String(p.size || "") === String(size || "")
    );

    if (itemIndex > -1) {
        cart.products[itemIndex].quantity = quantity;
        await cart.save();
        res.status(200).json(cart.products);
    } else {
        res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Sync Local Cart to Backend (Merge)
export const syncCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { localCartItems } = req.body; // Array of items from frontend

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, products: [] });
        }

        // Simple merge strategy: Add local items to backend
        // In production, we might want smarter merging
        localCartItems.forEach(localItem => {
            const itemIndex = cart.products.findIndex(
                (p) => p.productId.toString() === localItem._id && p.size === localItem.selectedSize
            );
            
            if (itemIndex > -1) {
                // Determine which qty to keep? Or sum them? 
                // Let's max them or just take local if newer?
                // Let's act like "adding" local cart to backend cart
                // Actually, often users prefer local cart to OVERRIDE or MERGE.
                // Let's MERGE: if exists, keep the backend one? or add? 
                // Let's just Add local qty to backend qty for simplicity
                cart.products[itemIndex].quantity += localItem.quantity;
            } else {
                 cart.products.push({
                    productId: localItem._id,
                    name: localItem.name,
                    image: localItem.image,
                    price: localItem.price,
                    size: localItem.selectedSize,
                    quantity: localItem.quantity,
                });
            }
        });

        await cart.save();
        res.status(200).json(cart.products);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Clear Entire Cart
export const clearUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.findOneAndDelete({ userId });
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


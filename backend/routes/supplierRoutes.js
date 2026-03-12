import express from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const router = express.Router();

const extractSupplierId = (req) => {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
};

// GET /api/supplier/profile
router.get('/profile', async (req, res) => {
  try {
    const supplierId = extractSupplierId(req);
    if (!supplierId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    let objectId;
    try {
      objectId = new ObjectId(supplierId);
    } catch {
      return res.status(400).json({ message: 'Invalid supplier ID.' });
    }

    const supplierCollection = mongoose.connection.db.collection('Supplier');
    const supplier = await supplierCollection.findOne({ _id: objectId });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    return res.status(200).json({
      supplierName: supplier.supplierName || supplier.name || '',
      companyName: supplier.companyName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      materialsSupplied: supplier.materialsSupplied || supplier.products || '',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load profile.', error: error.message });
  }
});

// PUT /api/supplier/profile
router.put('/profile', async (req, res) => {
  try {
    const supplierId = extractSupplierId(req);
    if (!supplierId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    let objectId;
    try {
      objectId = new ObjectId(supplierId);
    } catch {
      return res.status(400).json({ message: 'Invalid supplier ID.' });
    }

    const { supplierName, companyName, email, phone, address, materialsSupplied, password } = req.body;

    const updateFields = { updatedAt: new Date() };

    if (supplierName) {
      updateFields.supplierName = supplierName;
      updateFields.name = supplierName;
    }
    if (companyName) updateFields.companyName = companyName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (materialsSupplied !== undefined) {
      updateFields.materialsSupplied = materialsSupplied;
      updateFields.products = materialsSupplied;
    }
    if (password && password.trim()) updateFields.password = password.trim();

    const supplierCollection = mongoose.connection.db.collection('Supplier');

    const result = await supplierCollection.updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
});

export default router;

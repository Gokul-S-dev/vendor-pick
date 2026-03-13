import express from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const router = express.Router();
const BCRYPT_ROUNDS = 10;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^\d{10,15}$/.test(String(value || '').replace(/\D/g, ''));

const extractSupplierId = (req) => {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
};

// POST /api/supplier/register
router.post('/register', async (req, res) => {
  try {
    const supplierName = String(req.body?.supplierName || '').trim();
    const companyName = String(req.body?.companyName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').replace(/\D/g, '').trim();
    const address = String(req.body?.address || '').trim();
    const materialsSupplied = String(req.body?.materialsSupplied || '').trim();
    const password = String(req.body?.password || '').trim();

    if (!supplierName || !companyName || !email || !phone || !address || !materialsSupplied || !password) {
      return res.status(400).json({
        message: 'Supplier name, company name, email, phone, address, materials supplied, and password are required.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Phone number must be between 10 and 15 digits.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const supplierCollection = mongoose.connection.db.collection('Supplier');
    const existingSupplier = await supplierCollection.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingSupplier) {
      return res.status(409).json({ message: 'Supplier with this email or phone already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const now = new Date();
    const supplierDoc = {
      supplierName,
      name: supplierName,
      companyName,
      email,
      phone,
      address,
      materialsSupplied,
      products: materialsSupplied,
      password: hashedPassword,
      role: 'supplier',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const result = await supplierCollection.insertOne(supplierDoc);

    return res.status(201).json({
      message: 'Supplier registration completed successfully.',
      supplier: {
        id: String(result.insertedId),
        supplierName: supplierDoc.supplierName,
        companyName: supplierDoc.companyName,
        email: supplierDoc.email,
        phone: supplierDoc.phone,
        address: supplierDoc.address,
        materialsSupplied: supplierDoc.materialsSupplied,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to register supplier.',
      error: error.message,
    });
  }
});

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
    if (password && password.trim()) {
      updateFields.password = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
    }

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

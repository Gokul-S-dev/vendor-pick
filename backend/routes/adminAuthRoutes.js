import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^[0-9]{10}$/.test(value);

const findLoginAccount = async (email) => {
  const adminCollection = mongoose.connection.db.collection('AdminLogin');
  const admin = await adminCollection.findOne({ email });

  if (admin) {
    return {
      role: 'admin',
      redirectTo: '/admin/dashboard',
      token: 'temp-admin-token',
      id: String(admin._id),
      email: admin.email,
      password: String(admin.password || admin.pass || '').trim(),
    };
  }

  const supplierCollection = mongoose.connection.db.collection('Supplier');
  const supplier = await supplierCollection.findOne({ email });

  if (supplier) {
    return {
      role: 'supplier',
      redirectTo: '/dashboard',
      token: 'temp-supplier-token',
      id: String(supplier._id),
      email: supplier.email,
      password: String(supplier.password || supplier.pass || '').trim(),
    };
  }

  return null;
};

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const account = await findLoginAccount(email);

    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Temporary plain-text check. Replace with bcrypt compare when password hashes are used.
    if (!account.password || account.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.status(200).json({
      token: account.token,
      role: account.role,
      redirectTo: account.redirectTo,
      user: {
        id: account.id,
        email: account.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Login failed.',
      error: error.message,
    });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplierName = String(req.body?.supplierName || req.body?.name || '').trim();
    const companyName = String(req.body?.companyName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '').trim();
    const gstNumber = String(req.body?.gstNumber || '').trim();
    const address = String(req.body?.address || '').trim();

    if (!supplierName || !companyName || !email || !phone || !password) {
      return res.status(400).json({
        message: 'Supplier name, company name, email, phone, and password are required.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Phone number must be 10 digits.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const supplierCollection = mongoose.connection.db.collection('Supplier');

    const existingSupplier = await supplierCollection.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingSupplier) {
      return res.status(409).json({
        message: 'Supplier with this email or phone already exists.',
      });
    }

    const now = new Date();
    const supplierDoc = {
      supplierName,
      name: supplierName,
      companyName,
      email,
      phone,
      password,
      gstNumber,
      address,
      products: String(req.body?.products || '').trim(),
      role: 'supplier',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await supplierCollection.insertOne(supplierDoc);

    return res.status(201).json({
      message: 'Supplier added successfully.',
      supplier: {
        id: String(insertResult.insertedId),
        supplierName: supplierDoc.supplierName,
        companyName: supplierDoc.companyName,
        email: supplierDoc.email,
        phone: supplierDoc.phone,
        products: supplierDoc.products,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to add supplier.',
      error: error.message,
    });
  }
});

router.get('/suppliers', async (req, res) => {
  try {
    const supplierCollection = mongoose.connection.db.collection('Supplier');

    const suppliers = await supplierCollection
      .find({})
      .project({
        _id: 1,
        supplierName: 1,
        name: 1,
        companyName: 1,
        email: 1,
        phone: 1,
        gstNumber: 1,
        address: 1,
        products: 1,
        status: 1,
        createdAt: 1,
      })
      .toArray();

    const mappedSuppliers = suppliers.map((supplier) => ({
      id: String(supplier._id),
      supplierName: supplier.supplierName || supplier.name || '',
      companyName: supplier.companyName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      gstNumber: supplier.gstNumber || '',
      address: supplier.address || '',
      products: supplier.products || '',
      status: supplier.status || 'active',
      createdAt: supplier.createdAt,
    }));

    return res.status(200).json({
      message: 'Suppliers retrieved successfully.',
      suppliers: mappedSuppliers,
      count: mappedSuppliers.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve suppliers.',
      error: error.message,
    });
  }
});

export default router;

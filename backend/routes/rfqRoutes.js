import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// POST /api/admin/rfq - Admin creates RFQ and auto-matches suppliers
router.post('/admin/create', async (req, res) => {
  try {
    const product = String(req.body?.product || '').trim();
    const price = Number(req.body?.price || 0);
    const unit = String(req.body?.unit || '').trim();
    const quantity = Number(req.body?.quantity || 0);
    const deliveryTime = String(req.body?.deliveryTime || '').trim();
    const location = String(req.body?.location || '').trim();

    if (!product || !price || !unit || !quantity || !deliveryTime || !location) {
      return res.status(400).json({
        message: 'Product, price, unit, quantity, delivery time, and location are required.',
      });
    }

    if (price < 0 || quantity < 0) {
      return res.status(400).json({ message: 'Price and quantity must be positive.' });
    }

    // Find suppliers whose products match this RFQ
    const supplierCollection = mongoose.connection.db.collection('Supplier');
    const suppliers = await supplierCollection
      .find({
        products: { $regex: product, $options: 'i' },
        status: 'active',
      })
      .project({ _id: 1, supplierName: 1, email: 1, phone: 1, products: 1 })
      .toArray();

    const matchedSupplierIds = suppliers.map((s) => String(s._id));

    const now = new Date();
    const rfqDoc = {
      rfqId: `RFQ-${Date.now().toString().slice(-6)}`,
      product,
      price,
      unit,
      quantity,
      deliveryTime,
      location,
      status: 'Pending',
      matchedSuppliers: matchedSupplierIds,
      supplierDetails: suppliers.map((s) => ({
        id: String(s._id),
        name: s.supplierName,
        email: s.email,
        phone: s.phone,
        products: s.products,
      })),
      createdAt: now,
      updatedAt: now,
    };

    const rfqCollection = mongoose.connection.db.collection('RFQ');
    const insertResult = await rfqCollection.insertOne(rfqDoc);

    return res.status(201).json({
      message: 'RFQ created successfully and matched with suppliers.',
      rfq: {
        id: String(insertResult.insertedId),
        rfqId: rfqDoc.rfqId,
        product: rfqDoc.product,
        price: rfqDoc.price,
        unit: rfqDoc.unit,
        quantity: rfqDoc.quantity,
        deliveryTime: rfqDoc.deliveryTime,
        location: rfqDoc.location,
        matchedCount: matchedSupplierIds.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create RFQ.',
      error: error.message,
    });
  }
});

// POST /api/rfq/send-to-supplier - Admin sends RFQ to a specific supplier
router.post('/send-to-supplier', async (req, res) => {
  try {
    const product = String(req.body?.product || '').trim();
    const price = Number(req.body?.price || 0);
    const unit = String(req.body?.unit || '').trim();
    const quantity = Number(req.body?.quantity || 1);
    const deliveryTime = String(req.body?.deliveryTime || '').trim();
    const location = String(req.body?.location || '').trim();
    const supplierId = String(req.body?.supplierId || '').trim();
    const supplierName = String(req.body?.supplierName || '').trim();

    // Validate all required fields
    if (!product || !price || !unit || !deliveryTime || !location || !supplierId || !supplierName) {
      return res.status(400).json({
        message: 'Product, price, unit, delivery time, location, supplier ID, and supplier name are required.',
      });
    }

    if (price < 0 || quantity < 0) {
      return res.status(400).json({ message: 'Price and quantity must be positive.' });
    }

    // Verify supplier exists
    const supplierCollection = mongoose.connection.db.collection('Supplier');
    const supplier = await supplierCollection.findOne({
      _id: new mongoose.Types.ObjectId(supplierId),
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    const now = new Date();
    const rfqDoc = {
      rfqId: `RFQ-${Date.now().toString().slice(-6)}`,
      supplierId: supplierId,
      supplierName: supplierName,
      product,
      price,
      unit,
      quantity,
      deliveryTime,
      location,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    const rfqCollection = mongoose.connection.db.collection('RFQ');
    const insertResult = await rfqCollection.insertOne(rfqDoc);

    return res.status(201).json({
      message: 'RFQ sent to supplier successfully.',
      rfq: {
        id: String(insertResult.insertedId),
        rfqId: rfqDoc.rfqId,
        product: rfqDoc.product,
        price: rfqDoc.price,
        unit: rfqDoc.unit,
        quantity: rfqDoc.quantity,
        deliveryTime: rfqDoc.deliveryTime,
        location: rfqDoc.location,
        supplierName: rfqDoc.supplierName,
        status: rfqDoc.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to send RFQ to supplier.',
      error: error.message,
    });
  }
});

// GET /api/rfq/supplier - Fetch RFQs for a specific supplier
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const supplierId = String(req.params?.supplierId || '').trim();

    if (!supplierId) {
      return res.status(400).json({ message: 'Supplier ID is required.' });
    }

    // Get the supplier's details to know what products they provide
    const supplierCollection = mongoose.connection.db.collection('Supplier');
    const supplier = await supplierCollection.findOne(
      { _id: new mongoose.Types.ObjectId(supplierId) },
      { projection: { products: 1, supplierName: 1, email: 1 } }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    // Find RFQs sent to this specific supplier
    const rfqCollection = mongoose.connection.db.collection('RFQ');
    const rfqs = await rfqCollection
      .find({
        supplierId: supplierId,
        status: { $in: ['Pending', 'In Review', 'Approved'] },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const mappedRfqs = rfqs.map((rfq) => ({
      _id: String(rfq._id),
      rfqId: rfq.rfqId,
      material: rfq.product,
      quantity: rfq.quantity,
      unit: rfq.unit,
      deadline: rfq.deliveryTime,
      price: rfq.price,
      location: rfq.location,
      status: rfq.status,
      createdAt: rfq.createdAt,
    }));

    return res.status(200).json({
      message: 'RFQs retrieved successfully.',
      rfqs: mappedRfqs,
      count: mappedRfqs.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve RFQs.',
      error: error.message,
    });
  }
});

// GET /api/rfq/all - Fetch all RFQs (admin view)
router.get('/all', async (req, res) => {
  try {
    const rfqCollection = mongoose.connection.db.collection('RFQ');
    const rfqs = await rfqCollection.find({}).sort({ createdAt: -1 }).toArray();

    const mappedRfqs = rfqs.map((rfq) => ({
      id: String(rfq._id),
      rfqId: rfq.rfqId,
      product: rfq.product,
      price: rfq.price,
      unit: rfq.unit,
      quantity: rfq.quantity,
      deliveryTime: rfq.deliveryTime,
      location: rfq.location,
      status: rfq.status,
      matchedCount: rfq.matchedSuppliers?.length || 0,
      createdAt: rfq.createdAt,
    }));

    return res.status(200).json({
      message: 'RFQs retrieved successfully.',
      rfqs: mappedRfqs,
      count: mappedRfqs.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve RFQs.',
      error: error.message,
    });
  }
});

export default router;

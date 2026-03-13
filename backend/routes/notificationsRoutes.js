import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const extractSupplierId = (req) => {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
};

router.get('/supplier', async (req, res) => {
  try {
    const supplierId = extractSupplierId(req);

    if (!supplierId) {
      return res.status(401).json({ message: 'Unauthorized supplier request.' });
    }

    const notificationCollection = mongoose.connection.db.collection('Notification');
    const notifications = await notificationCollection
      .find({ supplierId })
      .sort({ createdAt: -1 })
      .toArray();

    const mapped = notifications.map((item) => ({
      _id: String(item._id),
      supplierId: item.supplierId,
      type: item.type || 'RFQ',
      message: item.message || '',
      referenceId: item.referenceId || '',
      createdAt: item.createdAt || item.updatedAt || null,
      read: Boolean(item.read),
    }));

    return res.status(200).json({
      message: 'Notifications retrieved successfully.',
      notifications: mapped,
      count: mapped.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve notifications.',
      error: error.message,
    });
  }
});

export default router;
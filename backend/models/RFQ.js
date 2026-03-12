import mongoose from 'mongoose'

const rfqSchema = new mongoose.Schema({
  rfqId: {
    type: String,
    unique: true,
    required: true,
  },
  supplierId: {
    type: String,
    required: true,
  },
  supplierName: {
    type: String,
    required: true,
  },
  product: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  deliveryTime: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Review', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('RFQ', rfqSchema)
import mongoose from 'mongoose'

const quotationSchema = new mongoose.Schema(
	{
		quotationId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		rfqId: {
			type: String,
			required: true,
			trim: true,
		},
		product: {
			type: String,
			required: true,
			trim: true,
		},
		urgencyTag: {
			type: String,
			enum: ['Normal', 'High', 'Critical'],
			default: 'Normal',
		},
		supplierId: {
			type: String,
			required: true,
			trim: true,
		},
		supplierName: {
			type: String,
			required: true,
			trim: true,
		},
		pricePerUnit: {
			type: Number,
			required: true,
		},
		shippingCost: {
			type: Number,
			required: true,
		},
		deliveryLeadTime: {
			type: Number,
			required: true,
		},
		tax: {
			type: Number,
			default: 0,
		},
		notes: {
			type: String,
			default: '',
			trim: true,
		},
		status: {
			type: String,
			enum: ['Pending', 'Accepted', 'Rejected'],
			default: 'Pending',
		},
	},
	{
		timestamps: true,
	}
)

export default mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema)
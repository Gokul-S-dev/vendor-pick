import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

router.post('/submit', async (req, res) => {
	try {
		const rfqId = String(req.body?.rfqId || '').trim()
		const supplierId = String(req.body?.supplierId || '').trim()
		const pricePerUnit = Number(req.body?.pricePerUnit || 0)
		const shippingCost = Number(req.body?.shippingCost || 0)
		const deliveryLeadTime = Number(req.body?.deliveryLeadTime || 0)
		const tax = Number(req.body?.tax || 0)
		const notes = String(req.body?.notes || '').trim()

		if (!rfqId || !supplierId || pricePerUnit <= 0 || shippingCost < 0 || deliveryLeadTime <= 0) {
			return res.status(400).json({
				message: 'RFQ, supplier, price per unit, shipping cost, and delivery lead time are required.',
			})
		}

		const rfqCollection = mongoose.connection.db.collection('RFQ')
		const supplierCollection = mongoose.connection.db.collection('Supplier')
		const quotationCollection = mongoose.connection.db.collection('Quotation')

		const rfq = await rfqCollection.findOne({ rfqId })

		if (!rfq) {
			return res.status(404).json({ message: 'RFQ not found.' })
		}

		if (String(rfq.supplierId || '') !== supplierId) {
			return res.status(403).json({ message: 'This RFQ is not assigned to the current supplier.' })
		}

		const supplier = await supplierCollection.findOne({ _id: new mongoose.Types.ObjectId(supplierId) })

		if (!supplier) {
			return res.status(404).json({ message: 'Supplier not found.' })
		}

		const existingQuote = await quotationCollection.findOne({ rfqId, supplierId })

		if (existingQuote) {
			return res.status(409).json({ message: 'Quotation already submitted for this RFQ.' })
		}

		const quotationDoc = {
			quotationId: `QT-${Date.now().toString().slice(-6)}`,
			rfqId,
			product: String(rfq.product || '').trim(),
			supplierId,
			supplierName: String(supplier.supplierName || supplier.name || '').trim(),
			pricePerUnit,
			shippingCost,
			deliveryLeadTime,
			tax,
			notes,
			status: 'Pending',
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		const result = await quotationCollection.insertOne(quotationDoc)

		await rfqCollection.updateOne(
			{ rfqId },
			{
				$set: {
					status: 'In Review',
					updatedAt: new Date(),
				},
			}
		)

		return res.status(201).json({
			message: 'Quotation submitted successfully.',
			quotation: {
				id: String(result.insertedId),
				quotationId: quotationDoc.quotationId,
				rfqId: quotationDoc.rfqId,
				product: quotationDoc.product,
				supplierName: quotationDoc.supplierName,
				status: quotationDoc.status,
			},
		})
	} catch (error) {
		return res.status(500).json({
			message: 'Failed to submit quotation.',
			error: error.message,
		})
	}
})

router.get('/supplier/:supplierId', async (req, res) => {
	try {
		const supplierId = String(req.params?.supplierId || '').trim()

		if (!supplierId) {
			return res.status(400).json({ message: 'Supplier ID is required.' })
		}

		const quotationCollection = mongoose.connection.db.collection('Quotation')
		const quotations = await quotationCollection.find({ supplierId }).sort({ createdAt: -1 }).toArray()

		const mappedQuotations = quotations.map((quotation) => ({
			_id: String(quotation._id),
			quotationId: quotation.quotationId,
			rfqId: quotation.rfqId,
			material: quotation.product,
			pricePerUnit: quotation.pricePerUnit,
			shippingCost: quotation.shippingCost,
			deliveryLeadTime: quotation.deliveryLeadTime,
			tax: quotation.tax,
			notes: quotation.notes,
			status: quotation.status,
			createdAt: quotation.createdAt,
		}))

		return res.status(200).json({
			message: 'Supplier quotations retrieved successfully.',
			quotations: mappedQuotations,
			count: mappedQuotations.length,
		})
	} catch (error) {
		return res.status(500).json({
			message: 'Failed to retrieve quotations.',
			error: error.message,
		})
	}
})

router.get('/admin', async (_req, res) => {
	try {
		const quotationCollection = mongoose.connection.db.collection('Quotation')
		const quotations = await quotationCollection.find({}).sort({ createdAt: -1 }).toArray()

		const mappedQuotations = quotations.map((quotation) => ({
			id: String(quotation._id),
			quotationId: quotation.quotationId,
			rfqId: quotation.rfqId,
			product: quotation.product,
			supplierId: quotation.supplierId,
			supplierName: quotation.supplierName,
			pricePerUnit: quotation.pricePerUnit,
			shippingCost: quotation.shippingCost,
			deliveryLeadTime: quotation.deliveryLeadTime,
			tax: quotation.tax,
			notes: quotation.notes,
			status: quotation.status,
			createdAt: quotation.createdAt,
		}))

		return res.status(200).json({
			message: 'All quotations retrieved successfully.',
			quotations: mappedQuotations,
			count: mappedQuotations.length,
		})
	} catch (error) {
		return res.status(500).json({
			message: 'Failed to retrieve admin quotations.',
			error: error.message,
		})
	}
})

router.patch('/:quotationId/approve', async (req, res) => {
	try {
		const quotationId = String(req.params?.quotationId || '').trim()

		if (!quotationId) {
			return res.status(400).json({ message: 'Quotation ID is required.' })
		}

		const quotationCollection = mongoose.connection.db.collection('Quotation')
		const rfqCollection = mongoose.connection.db.collection('RFQ')
		const notificationCollection = mongoose.connection.db.collection('Notification')

		const targetQuotation = await quotationCollection.findOne({ _id: new mongoose.Types.ObjectId(quotationId) })

		if (!targetQuotation) {
			return res.status(404).json({ message: 'Quotation not found.' })
		}

		await quotationCollection.updateOne(
			{ _id: targetQuotation._id },
			{
				$set: {
					status: 'Accepted',
					updatedAt: new Date(),
				},
			}
		)

		await rfqCollection.updateOne(
			{ rfqId: targetQuotation.rfqId },
			{
				$set: {
					status: 'Approved',
					updatedAt: new Date(),
				},
			}
		)

		await notificationCollection.insertOne({
			supplierId: targetQuotation.supplierId,
			type: 'Accepted',
			message: `Your quotation ${targetQuotation.quotationId} for ${targetQuotation.product} has been approved by admin.`,
			referenceId: targetQuotation.quotationId,
			read: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		return res.status(200).json({
			message: 'Quotation approved successfully.',
			quotationId,
			status: 'Accepted',
		})
	} catch (error) {
		return res.status(500).json({
			message: 'Failed to approve quotation.',
			error: error.message,
		})
	}
})

export default router
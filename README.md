# Vendor Picker

Vendor Picker is a full-stack procurement workflow application with AI-assisted quotation comparison.

It helps teams:
- onboard suppliers,
- send RFQs,
- collect supplier quotations,
- score and compare quotations with urgency-aware AI logic,
- approve the best quotation and notify suppliers.

## Project Structure

- `frontend/` - React + Vite UI for admin and supplier flows
- `backend/` - Express + MongoDB API
- `ai-model/` - Python training pipeline + Flask prediction API

## Key Features

### Admin
- Supplier onboarding and management
- Send RFQ to specific supplier
- RFQ history with urgency tags (Normal, High, Critical)
- View all quotations
- AI comparison table with ranking, score bars, recommendation badge
- Approve quotation and trigger supplier notification

### Supplier
- Login and profile management
- View assigned RFQs
- See urgency tag in RFQ cards/details
- Submit quotation for RFQ
- Track submitted quotations
- View notifications

### AI Comparison
- Predicts supplier suitability score using trained regression model
- Blends ML score with normalized price, shipping, and delivery metrics
- Applies different weight profiles based on urgency tag
- Returns recommended quotation id and per-row recommendation flag

## Tech Stack

### Frontend
- React 19
- Vite
- Axios
- AG Grid Community
- Bootstrap / React-Bootstrap
- Framer Motion + React Spring + Swiper

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- bcrypt for password hashing
- CORS + Morgan

### AI Service
- Python 3
- Flask
- NumPy, Pandas, scikit-learn, joblib

## Architecture

1. User interacts with frontend.
2. Frontend calls backend APIs at http://localhost:3000 (direct or via Vite proxy).
3. Admin comparison screen calls AI service at http://localhost:5001/predict.
4. Backend persists RFQ/quotation/supplier/notification data in MongoDB.
5. AI service reads model artifact from ai-model/supplier_model.pkl.

## Urgency-Aware Scoring Logic

Urgency tags:
- Normal
- High
- Critical

Weight profile used for final score:
- Normal: model 0.55, price 0.20, shipping 0.15, delivery 0.10
- High: model 0.45, price 0.18, shipping 0.12, delivery 0.25
- Critical: model 0.35, price 0.10, shipping 0.10, delivery 0.45

Interpretation:
- Higher urgency increases delivery influence.
- Normal urgency gives more influence to ML model and cost factors.

## API Surface (Summary)

### Backend Base
- http://localhost:3000

### Admin/Auth
- POST /api/admin/login
- POST /api/admin/suppliers
- GET /api/admin/suppliers
- PATCH /api/admin/suppliers/:supplierId/rating

### RFQ
- POST /api/rfq/admin/create
- POST /api/rfq/send-to-supplier
- GET /api/rfq/supplier/:supplierId
- GET /api/rfq/history
- GET /api/rfq/all

### Quotations
- POST /api/quotation/submit
- GET /api/quotation/supplier/:supplierId
- GET /api/quotation/admin
- PATCH /api/quotation/:quotationId/approve

### Supplier Profile
- POST /api/supplier/register
- GET /api/supplier/profile
- PUT /api/supplier/profile

### Notifications
- GET /api/notifications/supplier

### AI Service Base
- http://localhost:5001
- POST /predict

## Data Model Highlights

### RFQ
Core fields include:
- rfqId
- supplierId, supplierName (for direct supplier RFQ)
- product, price, unit, quantity, deliveryTime, location
- urgencyTag (Normal/High/Critical)
- status
- createdAt, updatedAt

### Quotation
Core fields include:
- quotationId, rfqId
- product, supplierId, supplierName
- pricePerUnit, shippingCost, deliveryLeadTime, tax, notes
- urgencyTag (copied from RFQ)
- status
- createdAt, updatedAt

## Setup and Run

## 1) Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB running locally or reachable via connection string

## 2) Backend Setup
Working directory: backend

Install packages:
- npm install

Create backend/.env with one of:
- MONGODB_URI=<your-mongodb-uri>
- or MONGOURI=<your-mongodb-uri>

Run backend server:
- npm run dev

Expected:
- API on http://localhost:3000

## 3) Frontend Setup
Working directory: frontend

Install packages:
- npm install

Run frontend:
- npm run dev

Expected:
- Vite dev server URL in terminal (commonly http://localhost:5173)
- /api routes proxied to http://localhost:3000 via vite.config.js

## 4) AI Model Setup
Working directory: ai-model

Install Python dependencies (inside your venv):
- pip install flask joblib numpy pandas scikit-learn

Train model artifact:
- python train_model.py

Run Flask AI service:
- python ai_service.py

Expected:
- AI API on http://localhost:5001
- model file generated at ai-model/supplier_model.pkl

## End-to-End Flow

1. Admin creates/sends RFQ with urgency tag.
2. Supplier sees RFQ and submits quotation.
3. Admin opens quotations comparison.
4. Frontend sends selected group to AI /predict.
5. AI returns ranked rows and recommended quotation.
6. Admin approves quotation.
7. Supplier receives approval notification.

## Training Notes

train_model.py behavior:
- Uses training_data.csv if present and valid.
- Falls back to synthetic dataset when file is absent.
- Augments with synthetic rows if real dataset is too small.
- Compares RandomForest, ExtraTrees, GradientBoosting with 5-fold CV.
- Stores best model artifact with metadata.

## Known Defaults

- Backend port: 3000
- AI service port: 5001
- MongoDB database name in Mongoose connect: Vendor_Picker

## Troubleshooting

### Backend does not start
- Verify backend/.env exists and MongoDB URI is valid.
- Ensure MongoDB is reachable.

### Frontend API errors
- Confirm backend is running on port 3000.
- Confirm Vite proxy config exists in frontend/vite.config.js.

### AI recommendation not loading
- Confirm ai_service.py is running on port 5001.
- Confirm supplier_model.pkl exists (run train_model.py).

### CORS or network issues
- Backend uses CORS middleware.
- AI service includes CORS headers in Flask after_request hook.

## Suggested Improvements

- Add JWT authentication and role-based authorization middleware.
- Add centralized env config for frontend API and AI service URLs.
- Add tests (backend integration tests, frontend component tests, AI endpoint tests).
- Add Docker Compose for one-command startup.
- Add Swagger/OpenAPI documentation for backend APIs.

## License

No explicit license file is currently included.

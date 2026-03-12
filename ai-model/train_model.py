import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib

# Step 1: Create sample dataset
data = {
    "price":[95,100,92,97,94,98,93,101,96,99],
    "shipping":[500,300,400,350,450,320,380,310,360,340],
    "delivery":[10,5,12,7,9,6,11,4,8,6],
    "score":[0.80,0.88,0.75,0.85,0.82,0.87,0.76,0.90,0.84,0.86]
}

# Step 2: Convert to DataFrame
df = pd.DataFrame(data)

# Step 3: Define inputs and output
X = df[["price","shipping","delivery"]]
y = df["score"]

# Step 4: Split training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Step 5: Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Step 6: Test prediction
test_prediction = model.predict([[95,500,10]])
print("Example Supplier Score:", test_prediction)

# Step 7: Save model
joblib.dump(model, "supplier_model.pkl")

print("Model trained and saved as supplier_model.pkl")
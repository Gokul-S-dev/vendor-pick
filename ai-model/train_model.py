from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor, GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_validate, train_test_split

FEATURE_COLUMNS = ["price", "shipping", "delivery"]
TARGET_COLUMN = "score"
MODEL_FILE = Path(__file__).resolve().parent / "supplier_model.pkl"
DATA_FILE = Path(__file__).resolve().parent / "training_data.csv"


def build_synthetic_dataset(rows=6000, random_state=42):
    rng = np.random.default_rng(random_state)

    price = rng.uniform(75, 135, rows)
    shipping = rng.uniform(150, 900, rows)
    delivery = rng.uniform(2, 20, rows)

    # Simulated procurement utility: lower price/shipping/delivery should rank higher.
    # Interactions/penalties introduce non-linearity to produce a richer training signal.
    norm_price = (price - 75) / (135 - 75)
    norm_shipping = (shipping - 150) / (900 - 150)
    norm_delivery = (delivery - 2) / (20 - 2)

    base = (
        0.48 * (1 - norm_price)
        + 0.30 * (1 - norm_shipping)
        + 0.22 * (1 - norm_delivery)
    )
    interaction = 0.06 * (1 - norm_price) * (1 - norm_delivery)
    penalty = 0.05 * np.maximum(norm_shipping - 0.78, 0)
    noise = rng.normal(0, 0.02, rows)

    score = np.clip(base + interaction - penalty + noise, 0, 1)

    return pd.DataFrame(
        {
            "price": np.round(price, 2),
            "shipping": np.round(shipping, 2),
            "delivery": np.round(delivery, 2),
            "score": np.round(score, 6),
        }
    )


def load_training_dataset(file_path):
    if not file_path.exists():
        print(f"No {file_path.name} found. Using synthetic dataset.")
        return build_synthetic_dataset()

    df = pd.read_csv(file_path)

    rename_map = {
        "deliveryDate": "delivery",
        "delivery_time": "delivery",
        "delivery_days": "delivery",
    }
    df = df.rename(columns=rename_map)

    required_columns = set(FEATURE_COLUMNS + [TARGET_COLUMN])
    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(
            f"{file_path.name} is missing required columns: {sorted(missing)}"
        )

    # Keep only the columns needed by the model and drop invalid rows.
    cleaned = df[FEATURE_COLUMNS + [TARGET_COLUMN]].copy()
    cleaned = cleaned.replace([np.inf, -np.inf], np.nan).dropna()

    # Enforce numeric types.
    for col in FEATURE_COLUMNS + [TARGET_COLUMN]:
        cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")
    cleaned = cleaned.dropna()

    if len(cleaned) < 80:
        print(
            f"Dataset has only {len(cleaned)} valid rows. Augmenting with synthetic data for stability."
        )
        synthetic = build_synthetic_dataset(rows=max(6000 - len(cleaned), 1000))
        cleaned = pd.concat([cleaned, synthetic], ignore_index=True)

    print(f"Loaded training rows: {len(cleaned)} from {file_path.name}")
    return cleaned


def choose_best_model(X_train, y_train):
    candidates = {
        "random_forest": RandomForestRegressor(
            n_estimators=500,
            max_depth=14,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        ),
        "extra_trees": ExtraTreesRegressor(
            n_estimators=700,
            max_depth=18,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1,
        ),
        "gradient_boosting": GradientBoostingRegressor(
            n_estimators=350,
            learning_rate=0.04,
            max_depth=3,
            random_state=42,
        ),
    }

    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    best_name = None
    best_model = None
    best_mae = float("inf")
    best_r2 = -float("inf")

    for name, model in candidates.items():
        cv_results = cross_validate(
            model,
            X_train,
            y_train,
            cv=cv,
            scoring=("neg_mean_absolute_error", "r2"),
            n_jobs=-1,
            return_train_score=False,
        )

        mae = -float(np.mean(cv_results["test_neg_mean_absolute_error"]))
        r2 = float(np.mean(cv_results["test_r2"]))
        print(f"{name}: cv_mae={mae:.5f}, cv_r2={r2:.5f}")

        is_better = (mae < best_mae) or (np.isclose(mae, best_mae) and r2 > best_r2)
        if is_better:
            best_name = name
            best_model = model
            best_mae = mae
            best_r2 = r2

    print(f"Selected model: {best_name} (cv_mae={best_mae:.5f}, cv_r2={best_r2:.5f})")
    return best_name, best_model


def main():
    df = load_training_dataset(DATA_FILE)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    best_name, best_model = choose_best_model(X_train, y_train)
    best_model.fit(X_train, y_train)

    test_pred = best_model.predict(X_test)
    metrics = {
        "mae": float(mean_absolute_error(y_test, test_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_test, test_pred))),
        "r2": float(r2_score(y_test, test_pred)),
    }

    # Keep scores in [0, 1] for downstream ranking stability.
    sample_pred = float(np.clip(best_model.predict(pd.DataFrame([[95, 350, 8]], columns=FEATURE_COLUMNS))[0], 0, 1))

    artifact = {
        "model": best_model,
        "model_name": best_name,
        "feature_columns": FEATURE_COLUMNS,
        "metrics": metrics,
        "version": "v2",
    }

    joblib.dump(artifact, MODEL_FILE)

    print("Training complete")
    print(f"Test metrics: MAE={metrics['mae']:.5f}, RMSE={metrics['rmse']:.5f}, R2={metrics['r2']:.5f}")
    print(f"Example supplier score: {sample_pred:.5f}")
    print(f"Saved model artifact to: {MODEL_FILE}")


if __name__ == "__main__":
    main()
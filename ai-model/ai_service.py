from flask import Flask, jsonify, request
import joblib

app = Flask(__name__)

try:
    loaded = joblib.load("supplier_model.pkl")
    if isinstance(loaded, dict) and "model" in loaded:
        model = loaded.get("model")
        feature_columns = loaded.get("feature_columns", ["price", "shipping", "delivery"])
    else:
        model = loaded
        feature_columns = None
except Exception:
    model = None
    feature_columns = None


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "POST,OPTIONS"
    return response


def fallback_score(price, shipping, delivery_date):
    # Lower values are generally better for procurement; convert to an inverse score.
    return 1.0 / (1.0 + float(price) + float(shipping) + float(delivery_date))


def model_score(price, shipping, delivery_date):
    if model is None:
        return fallback_score(price, shipping, delivery_date)

    try:
        # Preferred path for artifact-based models with explicit feature names.
        if feature_columns:
            feature_map = {
                "price": float(price),
                "shipping": float(shipping),
                "delivery": float(delivery_date),
                "deliveryDate": float(delivery_date),
                "moq": 0.0,
            }
            features = [[feature_map.get(name, 0.0) for name in feature_columns]]
            prediction = float(model.predict(features)[0])
            return max(0.0, min(1.0, prediction))

        n_features = int(getattr(model, "n_features_in_", 3))
        if n_features == 3:
            features = [[price, shipping, delivery_date]]
        elif n_features == 4:
            # Backward compatibility with older models trained with MOQ.
            features = [[price, shipping, delivery_date, 0]]
        else:
            return fallback_score(price, shipping, delivery_date)

        prediction = float(model.predict(features)[0])
        return max(0.0, min(1.0, prediction))
    except Exception:
        return fallback_score(price, shipping, delivery_date)


def normalize_urgency_tag(value):
    normalized = str(value or "Normal").strip().lower()
    if normalized == "critical":
        return "Critical"
    if normalized == "high":
        return "High"
    return "Normal"


def urgency_weights(urgency_tag):
    tag = normalize_urgency_tag(urgency_tag)
    if tag == "Critical":
        return {"model": 0.35, "price": 0.10, "shipping": 0.10, "delivery": 0.45}
    if tag == "High":
        return {"model": 0.45, "price": 0.18, "shipping": 0.12, "delivery": 0.25}
    return {"model": 0.55, "price": 0.20, "shipping": 0.15, "delivery": 0.10}


def inverse_minmax(value, min_value, max_value):
    if max_value <= min_value:
        return 1.0
    normalized = (float(value) - float(min_value)) / (float(max_value) - float(min_value))
    score = 1.0 - normalized
    return max(0.0, min(1.0, score))


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = request.get_json(silent=True) or {}
    quotes = payload.get("quotes", [])

    # Support both single-object and array payloads.
    if isinstance(quotes, list) and quotes:
        quote_rows = quotes
    else:
        quote_rows = [payload]

    request_urgency_tag = normalize_urgency_tag(payload.get("urgencyTag", "Normal"))

    scored_rows = []
    for quote in quote_rows:
        price = float(quote.get("price", 0) or 0)
        shipping = float(quote.get("shipping", 0) or 0)
        delivery_date = float(
            quote.get("deliveryDate", quote.get("delivery", 0)) or 0
        )

        quote_urgency_tag = normalize_urgency_tag(quote.get("urgencyTag", request_urgency_tag))
        base_model_score = model_score(price, shipping, delivery_date)

        scored_rows.append(
            {
                "quotationId": quote.get("quotationId", ""),
                "supplierName": quote.get("supplierName", ""),
                "price": price,
                "shipping": shipping,
                "deliveryDate": delivery_date,
                "urgencyTag": quote_urgency_tag,
                "base_model_score": base_model_score,
            }
        )

    if scored_rows:
        price_values = [row["price"] for row in scored_rows]
        shipping_values = [row["shipping"] for row in scored_rows]
        delivery_values = [row["deliveryDate"] for row in scored_rows]

        min_price, max_price = min(price_values), max(price_values)
        min_shipping, max_shipping = min(shipping_values), max(shipping_values)
        min_delivery, max_delivery = min(delivery_values), max(delivery_values)

        for row in scored_rows:
            weights = urgency_weights(row["urgencyTag"])
            price_score = inverse_minmax(row["price"], min_price, max_price)
            shipping_score = inverse_minmax(row["shipping"], min_shipping, max_shipping)
            delivery_score = inverse_minmax(row["deliveryDate"], min_delivery, max_delivery)

            final_score = (
                weights["model"] * row["base_model_score"]
                + weights["price"] * price_score
                + weights["shipping"] * shipping_score
                + weights["delivery"] * delivery_score
            )

            row["supplier_score"] = max(0.0, min(1.0, float(final_score)))

    scored_rows.sort(key=lambda row: row["supplier_score"], reverse=True)
    best_quotation_id = scored_rows[0]["quotationId"] if scored_rows else ""

    for row in scored_rows:
        row["recommended"] = bool(best_quotation_id and row["quotationId"] == best_quotation_id)

    return jsonify(
        {
            "results": scored_rows,
            "recommendedQuotationId": best_quotation_id,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
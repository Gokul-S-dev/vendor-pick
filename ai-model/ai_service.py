from flask import Flask, jsonify, request
import joblib

app = Flask(__name__)

try:
    model = joblib.load("supplier_model.pkl")
except Exception:
    model = None


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

    n_features = int(getattr(model, "n_features_in_", 3))
    if n_features == 3:
        features = [[price, shipping, delivery_date]]
    elif n_features == 4:
        # Backward compatibility with older models trained with MOQ.
        features = [[price, shipping, delivery_date, 0]]
    else:
        return fallback_score(price, shipping, delivery_date)

    return float(model.predict(features)[0])


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

    scored_rows = []
    for quote in quote_rows:
        price = float(quote.get("price", 0) or 0)
        shipping = float(quote.get("shipping", 0) or 0)
        delivery_date = float(
            quote.get("deliveryDate", quote.get("delivery", 0)) or 0
        )

        supplier_score = model_score(price, shipping, delivery_date)

        scored_rows.append(
            {
                "quotationId": quote.get("quotationId", ""),
                "supplierName": quote.get("supplierName", ""),
                "price": price,
                "shipping": shipping,
                "deliveryDate": delivery_date,
                "supplier_score": supplier_score,
            }
        )

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
from flask import Flask, request, jsonify
from flask_cors import CORS
import main
import re

app = Flask(__name__)
CORS(app)


@app.route("/start", methods=["GET"])
def ready():
    return jsonify({"status": "READY"}), 200


@app.route("/logic/post", methods=["POST"])
def run_program():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON received"}), 400

        # Ambil hanya key inputX lalu urutkan
        input_keys = sorted(
            [k for k in data.keys() if k.startswith("input")],
            key=lambda x: int(re.findall(r"\d+", x)[0])
        )

        inputs = [data.get(k) for k in input_keys]
        print("INPUTS:", inputs)

        result = main.calculate(*inputs)
        print("RESULT:", result)

        if result is None or len(result) < 3:
            return jsonify({"error": "Invalid model output"}), 500

        return jsonify({
            "output1": float(result[0]),
            "output2": float(result[1]),
            "output3": float(result[2])
        })

    except Exception as e:
        print("🔥 BACKEND ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/")
def home():
    return "Backend Python aktif!"

if __name__ == "__main__":
    print(">>> STARTING FLASK SERVER <<<")
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
        use_reloader=False
    )

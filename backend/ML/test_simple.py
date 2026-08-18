from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Test Flask app working!"})

@app.route('/test')
def test():
    return jsonify({"status": "success", "port": 5001})

if __name__ == '__main__':
    print("Starting simple test Flask app on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)

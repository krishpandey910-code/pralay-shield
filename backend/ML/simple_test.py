from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello! Flask is working!"

if __name__ == '__main__':
    print("Starting simple Flask test...")
    app.run(port=5003)

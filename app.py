from flask import Flask, render_template, request
from app_service import Gomoku_API
app = Flask(__name__)
api = Gomoku_API()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/init')
def init_game():
    first_player = request.values.get("firstPlayer")
    return api.init_game(first_player)


@app.route('/move')
def move():
    is_human = True if request.values.get("is_human") == "true" else False
    x = int(request.values.get("x")) if request.values.get("x") != None else None
    y = int(request.values.get("y")) if request.values.get("y") != None else None
    return api.move(is_human, x, y)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9527, debug=False)

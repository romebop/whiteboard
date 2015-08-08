from flask import Flask, url_for, render_template, request

from itertools import islice
import json

def take(n, iterable):
    "Return first n items of the iterable as a list"
    return list(islice(iterable, n))

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello World!"
    #return render_template('index.html', stuff=[])


if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask


app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
def hello_world():
    # if request.method == 'POST' and 'sentences' in request.form:
    #     json_form = json.loads(request.form)
    #     sentences = json_form['sentences']
    #     for sentence in sentences:
    #         print(sentence)

    return 'test to see if this is working'
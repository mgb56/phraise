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

if __name__ == '__main__':
    import os  
    port = int(os.environ.get('PORT', 33507)) 
    app.run(host='0.0.0.0', port=port)
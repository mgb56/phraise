from flask import Flask, request


app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
def hello_world():

    if request.method == 'POST':
        print('post')

    # if request.method == 'POST' and 'sentences' in request.form:
    #     json_form = json.loads(request.form)
    #     sentences = json_form['sentences']
    #     for sentence in sentences:
    #         print(sentence)

    print(request)
    print(request.data)
    # print("lol")
    return 'test to see if this is working'
    #return flask.Reponse(status=200)

if __name__ == '__main__':
    import os  
    port = int(os.environ.get('PORT', 33507)) 
    #context = ('server.crt', 'server.key')
    app.run(host='0.0.0.0', port=port) #, ssl_context='adhoc')
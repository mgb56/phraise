from flask import Flask, request, Response
from translator import PartialTranslator


app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
def hello_world():

    json_req = request.get_json()
    #print(json_req)

    if request.method != 'POST':
        return 'not currently supported'

    res = []


    #print(request.data)
    # print(type(request.data))

    # for obj in list(request.data):
    #     print(type(obj))


    res = []
    for sentence in json_req:
        if len(sentence) > 0:
            translator = PartialTranslator(sentence, is_mock=True)
            translated = translator.translate(src_lang='en', target_lang='es')
            res.append(translated)
        else:
            res.append('')

    return Response(
        response=res,
        status=200
    )

    # if request.method == 'POST' and 'sentences' in request.form:
    #     json_form = json.loads(request.form)
    #     sentences = json_form['sentences']
    #     for sentence in sentences:
    #         print(sentence)

    #print(request)
    #print(request.data)
    # print("lol")
    return 'test to see if this is working'
    #return flask.Reponse(status=200)

if __name__ == '__main__':
    import os  
    port = int(os.environ.get('PORT', 33507)) 
    #context = ('server.crt', 'server.key')
    app.run(host='0.0.0.0', port=port) #, ssl_context='adhoc')
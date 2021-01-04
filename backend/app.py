from flask import Flask, request, Response
from translator import PartialTranslator

import json


app = Flask(__name__)

@app.route('/', methods=['POST'])
def hello_world():
    if request.method != 'POST':
        return 'not currently supported'
    
    json_req = request.get_json()
    res = []
    for sentence in json_req:
        if len(sentence) > 0:
            translator = PartialTranslator(sentence, is_mock=False)
            translated = translator.translate(src_lang='en', target_lang='es')
            res.append(translated)
        else:
            res.append('')

    response = Response(
        response=json.dumps(res),
        status=200
    )

    return response


if __name__ == '__main__':
    import os  
    port = int(os.environ.get('PORT', 33507)) 
    #context = ('server.crt', 'server.key')
    app.run(host='0.0.0.0', port=port) #, ssl_context='adhoc')
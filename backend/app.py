from flask import Flask, request, Response
import json
import nltk
import os

from translator import PartialTranslator
from lib import real_words_percentage


app = Flask(__name__)

nltk.download('words')
dictionary = set(nltk.corpus.words.words())

@app.route('/', methods=['POST'])
def hello_world():    
    json_req = request.get_json()
    json_req = [sentence if real_words_percentage(sentence, dictionary) > 0.5 else '' for sentence in json_req]
    translator = PartialTranslator(json_req, is_mock=True, try_free=True)
    res = translator.translate(src_lang='en', target_lang='es')

    response = Response(
        response=json.dumps(res),
        status=200
    )

    return response


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 33507)) 
    app.run(host='0.0.0.0', port=port)
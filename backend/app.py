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
    sentences = json_req['array']
    language = json_req['language']

    json_to_translate = []
    bad_indices = set()
    for i, sentence in enumerate(sentences):
        if real_words_percentage(sentence, dictionary) > 0.5:
            json_to_translate.append(sentence)
        else:
            bad_indices.add(i)
    
    translator = PartialTranslator(json_to_translate, is_mock=False, try_free=True)
    translations = translator.translate(src_lang='en', target_lang=language, left_trim=2, right_trim=2)

    res = []
    j = 0
    for i in range(len(sentences)):
        if i in bad_indices:
            res.append(['', '', '', ''])
        else:
            res.append(translations[j])
            j += 1

    response = Response(
        response=json.dumps(res),
        status=200
    )

    return response


if __name__ == '__main__':
    # port = int(os.environ.get('PORT', 33507)) 
    # app.run(host='0.0.0.0', port=port)
    app.run(host='0.0.0.0', debug=True)
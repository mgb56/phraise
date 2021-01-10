from flask import Flask, request, Response
import json
import nltk
import os
import sys

from translator import PartialTranslator, TranslationType
from lib import real_words_percentage


app = Flask(__name__)

nltk.download('words')
dictionary = set(nltk.corpus.words.words())

if sys.platform != 'darwin':
    from argostranslate import package, translate
    # check if dir already exists
    # if not os.path.isdir('/root/.argos-translate'):
    #     print('reexcuting the import of argos')
    for filename in os.listdir('./models'):
        try:
            package.install_from_path('./models/' + filename)
        except:
            pass # I guess the cache already installed it?

    installed_languages = translate.load_installed_languages()
    offline_languages = {}

    for lang in installed_languages:
        offline_languages[str(lang)] = lang
else:
    offline_languages = {}

@app.route('/', methods=['POST', 'GET'])
def hello_world():
    if request.method == 'GET':
        return 'hello world'
        
    json_req = request.get_json()

    json_to_translate = []
    bad_indices = set()
    for i, sentence in enumerate(json_req):
        if real_words_percentage(sentence, dictionary) > 0.5:
            json_to_translate.append(sentence)
        else:
            bad_indices.add(i)
    
    translator = PartialTranslator(json_to_translate, is_mock=False, try_free=True, offline_languages=offline_languages)
    #translations = translator.translate(src_lang='en', target_lang='es', TranslationType.OFFLINE, left_trim=2, right_trim=2)
    translations = translator.translate(target_lang, src_lang, TranslationType.OFFLINE)

    res = []
    j = 0
    for i in range(len(json_req)):
        if i in bad_indices:
            res.append(['', '', '', ''])
        else:
            res.append(translations[j])
            j += 1


    #json_req = request.get_json()
    #json_req = [sentence if real_words_percentage(sentence, dictionary) > 0.5 else '' for sentence in json_req]
    #translator = PartialTranslator(json_req, is_mock=False, try_free=True)
    #res = translator.translate(src_lang='en', target_lang='es', left_trim=2, right_trim=2)

    response = Response(
        response=json.dumps(res),
        status=200
    )

    return response


if __name__ == '__main__':
    #port = int(os.environ.get('PORT', 33507)) 
    if sys.platform != 'darwin':
        port = 56733
    else:
        port = 33507
    #port = 33507
    #port = 56733
    app.run(host='0.0.0.0', port=port)
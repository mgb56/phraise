from translator import PartialTranslator, TranslationType
import time
import sys
import os

from argostranslate import package, translate

if sys.platform != 'darwin':
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


# sentences = [
#     'this is a sample sentence to translate',
#     ' this is another sentence to look at ',
#     'here is a 3rd sentence this time with a number',
#     'this is a significantly longer sentence with unbelievably long words in order to test the latency of the Google Translate API',
#     'this is the second to last sentence that will be assessed by the API for time',
#     'finally, we are at the end of the performance testing'
# ]

# sentences = [
#     'How can I extract noun phrases from text using spacy?',
#     'I am not referring to part of speech tags',
#     'In the documentation I cannot find anything about noun phrases or regular parse trees.',
#     'If you want base NPs, i.e. NPs without coordination, prepositional phrases or relative clauses, you can use the noun_chunks iterator on the Doc and Span objects'
# ]

sentences = ['the big red dog ran up the tree']

curr_time = time.time()
translator = PartialTranslator(sentences, is_mock=False, offline_languages=offline_languages)
next_time = time.time()
translated = translator.translate('en', 'es', TranslationType.OFFLINE)
final_time = time.time()

#print(next_time - curr_time)
#print(final_time - next_time)
print(translated)
#print(''.join(translated[0]))


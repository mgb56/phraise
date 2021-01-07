from translator import PartialTranslator
import time


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

sentences = ['this is a test to see how the translation is working']

curr_time = time.time()
translator = PartialTranslator(sentences, is_mock=True)
next_time = time.time()
translated = translator.translate(src_lang='en', target_lang='es')
final_time = time.time()

#print(next_time - curr_time)
#print(final_time - next_time)
print(translated)
#print(''.join(translated[0]))


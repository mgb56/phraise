import six
from google.cloud import translate_v2 as translate

translate_client = translate.Client()

text = ""

if isinstance(text, six.binary_type):
    text = text.decode("utf-8")

# Text can also be a sequence of strings, in which case this method
# will return a sequence of results for each text.
result = translate_client.translate(text)

print(u"Text: {}".format(result["input"]))
print(u"Translation: {}".format(result["translatedText"]))
print(u"Detected source language: {}".format(result["detectedSourceLanguage"]))

# choose random percentage of sentences
# send to backend
# get translated sentences from backend
# parse and replace -- somehow replace the phrases and re-render

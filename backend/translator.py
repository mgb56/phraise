from google.cloud import translate
from googletrans import Translator

from parser import PartialParser


class PartialTranslator:
    def __init__(self, sentences, is_mock=False, try_free=True):
        self.sentences = sentences
        self.is_mock = is_mock
        if self.is_mock:
            return

        self.parser = PartialParser(sentences)
        self.parsed_texts = self.parser.partial_parse()
        self.translate_client = translate.TranslationServiceClient()
        self.try_free = try_free
        if self.try_free:
            self.free_translator = Translator(service_urls=[
                'translate.google.com',
                'translate.google.co.kr',
            ])
        
    
    def translate(self, target_lang, src_lang):
        if self.is_mock:
            return self.translate_mock()
        else:
            return self.translate_real(target_lang, src_lang)
    
    def translate_real(self, target_lang, src_lang, is_mock=False):
        if is_mock:
            return self.translate_mock()

        spaces = [self.count_leading_and_trailing_whitespace(parse[1]) for parse in self.parsed_texts]

        need_translation_strs = [parse[1].strip() for parse in self.parsed_texts]
        full_strs = [self.parsed_texts[i][0] + '<p>' + need_translation_strs[i] + ' </p>' + self.parsed_texts[i][2]  for i in range(len(self.parsed_texts))]

        if self.try_free:
            text_result = []
            for i in range(len(full_strs)):
                result = self.free_translator.translate(full_strs[i], dest=target_lang, src=src_lang)
                text_result.append(result.text)
        else:
            result = self.translate_client.translate_text(contents=full_strs, 
                                                      target_language_code=target_lang, 
                                                      source_language_code=src_lang, 
                                                      mime_type='text/html',
                                                      parent='projects/disco-beach-300422'
                                                      )
            text_result = [translation.translated_text for translation in result]

        translations = []
        for i, translation in enumerate(text_result):
            first_html_tag_pos = translation.find('<p>')
            last_html_tag_pos = translation.find('</p>')
            translated_bit = translation[first_html_tag_pos + 3 + 1: last_html_tag_pos]
            translated_bit = ' ' * spaces[i][0] + translated_bit + ' ' * spaces[i][1]
            full_translation = self.parsed_texts[i][0] + translated_bit + self.parsed_texts[i][2]
            translations.append(full_translation)
        return translations
       
    
    def translate_mock(self):
        return 'this is un buen translaction que is not quite finished'
    
    def count_leading_and_trailing_whitespace(self, sentence):
        saw_char = False
        num_left_spaces = 0
        num_right_spaces = 0

        i = 0
        while i < len(sentence):
            if sentence[i].isalnum():
                break
            else:
                num_left_spaces += 1
            i += 1
        
        i = len(sentence) - 1
        while i >= 0:
            if sentence[i].isalnum():
                break
            else:
                num_right_spaces += 1
            i -= 1 

        return (num_left_spaces, num_right_spaces)
            

# s = 'the big red dog ran up the tree'
# translator = PartialTranslator(s)
# res = translator.count_leading_and_trailing_whitespace(' test  ')
# print(res)
# translation = translator.translate(target_lang='es', src_lang='en')
# print(translation)
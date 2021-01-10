from google.cloud import translate
from googletrans import Translator

from parser import PartialParser
from TranslatorApi import TranslatorApi, TranslationType


class PartialTranslator:
    def __init__(self, sentences, is_mock=False, try_free=True, offline_languages={}):
        self.sentences = sentences
        self.is_mock = is_mock
        if self.is_mock:
            return

        self.parser = PartialParser(sentences)
        self.parsed_texts = self.parser.partial_parse()
        
        self.try_free = try_free
        translation_type = TranslationType.GOOGLE_FREE
        self.translator = TranslatorApi(offline_languages=offline_languages)

        # if self.try_free:
        #     # self.free_translator = Translator(service_urls=[
        #     #     'translate.google.com',
        #     #     'translate.google.co.kr',
        #     # ])

        #     self.free_translator = Translator(service_urls=['translate.googleapis.com','translate.google.com','translate.google.co.kr'])
        #     self.free_translator.raise_Exception = True
        # else:
        #     self.translate_client = translate.TranslationServiceClient()
        
    
    def translate(self, target_lang, src_lang, translation_type, left_trim=None, right_trim=None):
        if self.is_mock:
            return self.translate_mock()
        else:
            print('got here')
            return self.translate_real(target_lang, src_lang, translation_type, left_trim=left_trim, right_trim=right_trim)
    
    def translate_real(self, target_lang, src_lang, translation_type, is_mock=False, left_trim=None, right_trim=None):
        if is_mock:
            return self.translate_mock()
        
        # there's no need to trim the part we're gonna translate fully
        new_left_context_arr = []
        new_right_context_arr = []
        for i in range(len(self.parsed_texts)):
            self.parsed_texts[i][1] = self.convert_token_arr_to_str(self.parsed_texts[i][1])
            new_left_context = self.trim_array_based_on_context(self.parsed_texts[i][0], left_trim, is_left=True)
            new_right_context = self.trim_array_based_on_context(self.parsed_texts[i][2], right_trim, is_left=False)
            new_left_context_arr.append(new_left_context)
            new_right_context_arr.append(new_right_context)

        spaces = [self.count_leading_and_trailing_whitespace(parse[1]) for parse in self.parsed_texts]
        need_translation_strs = [parse[1].strip() for parse in self.parsed_texts]

        if translation_type == TranslationType.OFFLINE:
            return self.parse_offline_translation(spaces, need_translation_strs, new_left_context_arr, new_right_context_arr, src_lang, target_lang)

        # if left trim and right trim are set, we won't translate all the context
        full_strs = [new_left_context_arr[i] + '<p>' + need_translation_strs[i] + ' </p>' + new_right_context_arr[i]  for i in range(len(self.parsed_texts))]

        text_result = self.translator.translate(full_strs, TranslationType.OFFLINE, src_lang, target_lang)
        # if self.try_free:
        #     result = self.free_translator.translate(full_strs, dest=target_lang, src=src_lang)
        #     text_result = [translation.text for translation in result]
        #     # text_result = []
        #     # for i in range(len(full_strs)):
        #     #     result = self.free_translator.translate(full_strs[i], dest=target_lang, src=src_lang)
        #     #     text_result.append(result.text)
        # else:
        #     result = self.translate_client.translate_text(contents=full_strs, 
        #                                               target_language_code=target_lang, 
        #                                               source_language_code=src_lang, 
        #                                               mime_type='text/html',
        #                                               parent='projects/disco-beach-300422'
        #                                               )
        #     text_result = [translation.translated_text for translation in result.translations]

        translations = []
        for i, translation in enumerate(text_result):
            first_html_tag_pos = translation.find('<p>')
            last_html_tag_pos = translation.find('</p>')
            translated_bit = translation[first_html_tag_pos + 3 + 1: last_html_tag_pos]
            translated_bit = ' ' * spaces[i][0] + translated_bit + ' ' * spaces[i][1]
            #full_translation = self.parsed_texts[i][0] + '<p>' + translated_bit + '</p>' + self.parsed_texts[i][2]
            #translations.append(full_translation)

            left_context = self.convert_token_arr_to_str(self.parsed_texts[i][0])
            right_context = self.convert_token_arr_to_str(self.parsed_texts[i][2])

            arr = [left_context, translated_bit, right_context, self.parsed_texts[i][1]] 
            translations.append(arr)
        return translations
       
    
    def translate_mock(self):
        res = [' this is ', 'un buen translacion que  ', 'is not quite finished', 'a decent translation that']
        return [res for i in range(len(self.sentences))]
    
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
    
    # TODO: num_context should only count for non-punctuation tokens
    def trim_array_based_on_context(self, token_arr, num_context, is_left=True):
        if not num_context:
            return ''.join([token.text_with_ws for token in token_arr])
        # if is_left:
        #     considered_tokens = token_arr[-1 * num_context:]
        # else:
        #     considered_tokens = token_arr[:num_context]

        if is_left:
            i = len(token_arr) - 1
            count = 0
            while i >= 0 and count < num_context:
                if not token_arr[i].is_punct:
                    count += 1
                if count >= num_context:
                    break
                else:
                    i -= 1
            considered_tokens = token_arr[i:]
        else:
            i = 0
            count = 0
            while i < len(token_arr) and count < num_context:
                if not token_arr[i].is_punct:
                    count += 1
                if count >= num_context:
                    break
                else:
                    i += 1
            considered_tokens = token_arr[:i+1]

        return ''.join([token.text_with_ws for token in considered_tokens])
    
    def convert_token_arr_to_str(self, arr):
        return ''.join([token.text_with_ws for token in arr])
    

    def parse_offline_translation(self, spaces, need_translation_strs, new_left_context_arr, new_right_context_arr, src_lang, target_lang):
        delimiter = " \"\"\" "
        full_strs = [new_left_context_arr[i] + delimiter + need_translation_strs[i] + delimiter + new_right_context_arr[i]  for i in range(len(self.parsed_texts))]
        print(full_strs)
        text_result = self.translator.translate(full_strs, TranslationType.OFFLINE, src_lang, target_lang)
        print(text_result)
        translations = []
        for i, translation in enumerate(text_result):
            num_left, num_right = 3, 3
            first_html_tag_pos = translation.find('"""')
            if first_html_tag_pos == -1:
                first_html_tag_pos = translation.find('""')
                num_left = 2
            last_html_tag_pos = translation.rfind('"""')
            if last_html_tag_pos == -1:
                last_html_tag_pos = translation.rfind('""')
                num_right = 2
            translated_bit = translation[first_html_tag_pos + num_left + 1: last_html_tag_pos -3 + num_right]
            translated_bit = ' ' * spaces[i][0] + translated_bit + ' ' * spaces[i][1]
            #full_translation = self.parsed_texts[i][0] + '<p>' + translated_bit + '</p>' + self.parsed_texts[i][2]
            #translations.append(full_translation)

            left_context = self.convert_token_arr_to_str(self.parsed_texts[i][0])
            right_context = self.convert_token_arr_to_str(self.parsed_texts[i][2])

            arr = [left_context, translated_bit, right_context, self.parsed_texts[i][1]] 
            translations.append(arr)
        return translations

#s = ['the big red dog ran up the tree']
#translator = PartialTranslator(s)

# res = translator.count_leading_and_trailing_whitespace(' test  ')
# print(res)
#translation = translator.translate(target_lang='es', src_lang='en')
#print(translation)

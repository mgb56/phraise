from google.cloud import translate_v2 as translate

from parser import PartialParser


class PartialTranslator:
    def __init__(self, s, is_mock=False):
        self.s = s
        self.is_mock = is_mock
        if self.is_mock:
            return

        self.parser = PartialParser(s)
        self.parsed_text = self.parser.partial_parse()
        self.translate_client = translate.Client()
        
    
    def translate(self, target_lang, src_lang):
        if self.is_mock:
            return self.translate_mock()
        else:
            return self.translate_real(target_lang, src_lang)
    
    def translate_real(self, target_lang, src_lang, is_mock=False):
        if is_mock:
            return self.translate_mock()

        # manually embed the noun phrase in a <p> tag
        s_html = self.parsed_text[0] + '<p>' + self.parsed_text[1] + '</p>' + self.parsed_text[2]
        result = self.translate_client.translate(s_html, 
                                            target_language=target_lang, 
                                            source_language=src_lang,
                                            format_='html')
        
        first_html_tag_pos = result["translatedText"].find('<p>')
        last_html_tag_pos = result["translatedText"].find('</p>')

        translated_part = result["translatedText"][first_html_tag_pos + 3: last_html_tag_pos]

        return self.parsed_text[0] + ' ' + translated_part + ' ' + self.parsed_text[2]
    
    def translate_mock(self):
        return 'esto es un translacion mocko'

# s = 'the big red dog ran up the tree'
# translator = PartialTranslator(s)
# translation = translator.translate(target_lang='es', src_lang='en')
# print(translation)
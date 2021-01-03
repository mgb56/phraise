import spacy


nlp = spacy.load('en_core_web_sm')

# given a sentence, extract a noun phrase and translte it
class PartialParser:
    def __init__(self, sentence):
        self.sentence = sentence
        self.doc = nlp(sentence)
    
    # return as [first_part_of_sentence, noun phrase, rest of sentence]
    def partial_parse(self):
        visited = set()
        noun_phrase = []
        for token in self.doc:
            if token.pos_ == 'NOUN': # currently only will do noun phrases; easy to extend
                for tok in token.subtree:
                    visited.add(tuple(tok.tensor))
                    noun_phrase.append(tok.text)
                break
        

        first = True
        found_np = False
        res = []
        for token in self.doc:
            if tuple(token.tensor) in visited and first:
                first = False
                if not found_np:
                    if len(res) == 0:
                        res.append('')
                    res.append(' '.join(noun_phrase))
                    found_np = True
            elif tuple(token.tensor) not in visited:
                if found_np:
                    if len(res) == 2:
                        res.append(token.text)
                    else:
                        res[2] += ' ' + token.text
                else:
                    if len(res) == 0:
                        res.append(token.text + ' ')
                    else:
                        res[0] += ' ' + token.text
        if len(res) == 1:
            res.append('')
            res.append('')
        elif len(res) == 2:
            res.append('')
        
        return res



        
        #return ' '.join(translated)

# s = 'the dog ran up the fence'
# #s = 'the the'
# translator = PartialParser(s)
# res = translator.partial_parse()
# print(res)

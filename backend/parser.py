import spacy
from random import randint


nlp = spacy.load('en_core_web_sm')

# given a sentence, extract a noun phrase and translte it
class PartialParser:
    def __init__(self, sentence, user_pref_range=None):
        self.sentence = sentence
        self.doc = nlp(sentence)
        self.user_pref_range = user_pref_range
        
        # precompute the noun chunks
        self.noun_chunks = [(noun_chunk, len(noun_chunk)) for noun_chunk in self.doc.noun_chunks]
        self.noun_chunks.sort(key=lambda x:x[1])

    
    # return as [first_part_of_sentence, noun phrase, rest of sentence]
    def partial_parse(self):
        if self.user_pref_range:
            noun_phrase = self.select_noun_chunk_with_pref()
        else:
            noun_phrase = self.select_noun_chunk_no_pref()

        visited = set()
        for token in noun_phrase:
            visited.add(tuple(token.tensor))

        # for token in noun_chunk:
        #     visited.add(tuple(token.tensor))

        # noun_phrase = []
        # for token in self.doc:
        #     if token.pos_ == 'NOUN': # currently only will do noun phrases; easy to extend
        #         for tok in token.subtree:
        #             visited.add(tuple(tok.tensor))
        #             noun_phrase.append(tok.text)
        #         break
        

        first = True
        found_np = False
        res = []
        for token in self.doc:
            if tuple(token.tensor) in visited and first:
                first = False
                if not found_np:
                    if len(res) == 0:
                        res.append('')
                    tok_texts = [tok.text for tok in noun_phrase]
                    res.append(' '.join(tok_texts))
                    #res.append(noun_phrase.text)
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
    
    def select_noun_chunk_no_pref(self):
        rand_index = randint(0, len(self.noun_chunks) - 1)
        return self.noun_chunks[rand_index][0]

    def select_noun_chunk_with_pref(self):
        # if the shortest noun chunk is still too long, use it anyway
        if self.noun_chunks[0][1] > self.user_pref_range[1]:
            return self.noun_chunks[0]
        # if the longest noun chunk is still too short, use it anyway
        elif self.noun_chunks[-1][1] < self.user_pref_range[0]:
            return self.noun_chunks[-1]

        first_valid_index = None
        last_valid_index = None

        for i, (noun_chunk, noun_chunk_len) in enumerate(self.noun_chunks):
            if self.user_pref_range[0] <= noun_chunk_len <= self.user_pref_range[1]:
                if first_valid_index is None:
                    first_valid_index = i

                last_valid_index = i
        
        # select an index at random between first_valid_index and last_valid_index at random
        rand_index = randint(first_valid_index, last_valid_index)
        
        return self.noun_chunks[rand_index][0]



s = 'the dog ran up the blue fence'
# #s = 'the the'
translator = PartialParser(s, user_pref_range=(1, 3))
#translator.debug()
res = translator.partial_parse()
print(res)

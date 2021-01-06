import spacy
from random import randint


nlp = spacy.load('en_core_web_sm')

# given a sentence, extract a noun phrase and translte it
class PartialParser:
    def __init__(self, sentences, user_pref_range=(3, 5), is_noun_chunks=False):
        print('---------------')
        print(sentences)
        print('---------------')
        self.sentences = sentences
        self.docs = [nlp(sentence) for sentence in sentences]
        self.user_pref_range = user_pref_range
        
        # precompute the chunks
        self.is_noun_chunks = is_noun_chunks
        if self.is_noun_chunks:
            self.chunks = [self.generate_noun_chunk_sorted_arr(k) for k in range(len(sentences))]
        else:
            self.chunks = [self.generate_any_chunk_sorted_arr(k) for k in range(len(sentences))]

    def partial_parse(self):
        parses = []
        for i in range(len(self.sentences)):
            if len(self.sentences[i]) > 0:
                parse = self.__partial_parse(i)
            else:
                parse = ['', '', '']
            parses.append(parse)
        return parses


    def __partial_parse(self, k):
        if self.user_pref_range:
            noun_phrase = self.select_chunk_with_pref(k)
        else:
            noun_phrase = self.select_chunk_no_pref(k)

        visited = set()
        for token in noun_phrase:
            visited.add(tuple(token.tensor))

        first = True
        found_np = False
        res = []
        for token in self.docs[k]:
            if tuple(token.tensor) in visited and first:
                first = False
                if not found_np:
                    if len(res) == 0:
                        res.append('')

                    res.append(noun_phrase.text_with_ws)

                    found_np = True
            elif tuple(token.tensor) not in visited:
                if found_np:
                    if len(res) == 2:
                        res.append(token.text_with_ws)
                    else:
                        res[2] += token.text_with_ws
                else:
                    if len(res) == 0:
                        res.append(token.text_with_ws)
                    else:
                        res[0] += token.text_with_ws
        if len(res) == 1:
            res.append('')
            res.append('')
        elif len(res) == 2:
            res.append('')
        
        return res
    
    def select_chunk_no_pref(self, k):
        if not self.is_noun_chunks and len(self.chunks[k]) > 1:
            upper = len(self.chunks[k]) - 2 # never select the full sentence
        else:
            upper = len(self.chunks[k]) - 1

        rand_index = randint(0, upper)
        return self.chunks[k][rand_index][0]

    def select_chunk_with_pref(self, k):
        print(self.chunks)
        print(k)
        # if the shortest noun chunk is still too long, use it anyway
        if self.chunks[k][0][1] > self.user_pref_range[1]:
            return self.chunks[k][0][0]
        # if the longest noun chunk is still too short, use it anyway
        elif self.chunks[k][-1][1] < self.user_pref_range[0]:
            return self.chunks[k][-1][0]

        first_valid_index = None
        last_valid_index = None

        for i, (chunk, chunk_len) in enumerate(self.chunks[k]):
            if self.user_pref_range[0] <= chunk_len <= self.user_pref_range[1]:
                if first_valid_index is None:
                    first_valid_index = i

                last_valid_index = i

            elif chunk_len <= self.user_pref_range[0] and i + 1 < len(self.chunks) and self.chunks[k][i+1][1] >= self.user_pref_range[1]:
                if first_valid_index is None:
                    first_valid_index = i

                last_valid_index = i
        
        if first_valid_index is None:
            first_valid_index = 0
        if last_valid_index is None:
            last_valid_index = len(self.chunks) - 1
        # select an index at random between first_valid_index and last_valid_index at random
        rand_index = randint(first_valid_index, last_valid_index)
        
        return self.chunks[k][rand_index][0]
    
    def generate_any_chunk_sorted_arr(self, k):
        subtree_arr = []
        for token in self.docs[k]:
            children_span = self.docs[k][token.left_edge.i : token.right_edge.i+1]
            subtree_arr.append((children_span, len(children_span)))
        subtree_arr.sort(key=lambda x:x[1])

        return subtree_arr
    
    def generate_noun_chunk_sorted_arr(self, k):
        noun_chunks = [(noun_chunk, len(noun_chunk)) for noun_chunk in self.docs[k].noun_chunks]
        noun_chunks.sort(key=lambda x:x[1])

        return noun_chunks
        




#s = '               the dog ran up the blue fence'
# s = 'the dog ran up the blue fence'

# translator = PartialParser(s)
# res = translator.partial_parse()
# print(res)


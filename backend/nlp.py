import spacy

nlp = spacy.load('en_core_web_sm')

def get_pps(doc):
    "Function to get PPs from a parsed document."
    pps = []
    for token in doc:
        # Try this with other parts of speech for different subtrees.
        if token.pos_ == 'ADP':
            pp = ' '.join([tok.orth_ for tok in token.subtree])
            pps.append(pp)
    return pps


s = 'the the'
#s = 'The cat and the dog sleep in the basket near the door.'

doc = nlp(s)

for token in doc:
    print(token.norm)
    # if token.pos_ == 'NOUN':
    #     np = ' '.join([tok.orth_ for tok in token.subtree])
    #     print(np)

# for np in doc.noun_chunks:
#     print(np.text)

#print(get_pps(doc))
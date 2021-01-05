import string

# compute (approximately) the fraction of real words in a string
def real_words_percentage(sentence, dictionary):
    words = [word.strip(string.punctuation) for word in sentence.split()]
    num_real_words = 0
    for word in words:
        if word in dictionary:
            num_real_words += 1
    
    return num_real_words / len(words)
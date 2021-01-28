var testSentence =
  "this is a test sentence to see how the spacing works in clauses";
var testDoc = nlp(testSentence);
var testClauses = testDoc.clauses().out("array");
console.log(testClauses);

const translate = require("@iamtraction/google-translate");

function transform_clause_into_quartuple(clauses, i) {
  var before_context = "";
  for (var j = 0; j < i; j++) {
    before_context += clauses[j] + " ";
  }
  var phrase_to_be_translated = clauses[j];
  var after_context = "";
  for (var j = i + 1; j < clauses.length; j++) {
    after_context += " " + clauses[j];
  }
  return [before_context, phrase_to_be_translated, after_context];
}

function naive_split(sentence, min_length, max_length) {
  var doc = nlp(sentence);

  var clauses = doc.clauses().out("array");
  for (var i = 0; i < clauses.length; i++) {
    let clause = clauses[i];
    if (min_length <= clause.length && clause.length <= max_length) {
      return transform_clause_into_quartuple(clauses, i);
    }
  }
  if (clauses.length > 0) {
    return transform_clause_into_quartuple(clauses, 0);
  } else {
    return null;
  }
}

async function translate_phrase(
  before_context,
  phrase_to_be_translated,
  after_context,
  language
) {
  // const delimiter = " ALFSKJLKASF ";
  const spanOpen = " <span> ";
  const spanClose = " </span> ";
  let full_sentence =
    before_context +
    spanOpen +
    phrase_to_be_translated +
    spanClose +
    after_context;
  let translationObj = await translate(full_sentence, {
    from: "en",
    to: language
  });
  let translationString = translationObj["text"];

  const left_index = translationString.indexOf("<span>");
  const right_index = translationString.lastIndexOf("</span>");

  var final_left_index = left_index;
  var final_right_index = right_index;

  for (var i = left_index; i < translationString.length; i++) {
    if (translationString[i] === " ") {
      final_left_index = i + 1;
      break;
    }
  }

  for (var i = right_index; i >= 0; i--) {
    if (translationString[i] === " ") {
      final_right_index = i - 1;
      break;
    }
  }

  var result = translationString.slice(final_left_index, final_right_index + 1);
  if (before_context.length === 0) {
    result = " " + result;
  }
  return [before_context, result, after_context, phrase_to_be_translated];
}

async function partially_translate(
  sentence,
  language,
  phraseLengthVal1,
  phraseLengthVal2
) {
  var split_sentence = naive_split(
    sentence,
    phraseLengthVal1,
    phraseLengthVal2
  );
  var translated_sentence = await translate_phrase(
    split_sentence[0],
    split_sentence[1],
    split_sentence[2],
    language
  );
  return translated_sentence;
}

async function partially_translate_sentences(
  sentences,
  language,
  phraseLengthVal1,
  phraseLengthVal2
) {
  var result = [];
  for (var sentence of sentences) {
    var translated_sentence = await partially_translate(
      sentence,
      language,
      phraseLengthVal1,
      phraseLengthVal2
    );
    result.push(translated_sentence);
  }
  return result;
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ color: "#3aa757" }, function () {
    console.log("The color is green.");
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "developer.chrome.com" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

chrome.webNavigation.onCompleted.addListener((tab) => {
  chrome.tabs.get(tab.tabId, (current_tab_info) => {
    let url = current_tab_info.url;

    chrome.storage.sync.set({ currentUrl: url }, () => {
      console.log("set url as" + url);
      console.log(typeof url);
    });
    // makes sure it's a valid url (exclude chrome:extensions//)
    var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression);

    if (url && url.match(regex)) {
      chrome.tabs.executeScript(null, { file: "./foreground.js" }, () =>
        console.log("i injected")
      );
    }
  });
});

chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
  let sentenceArray = request["array"];
  let targetLanguage = request["language"];
  let phraseLengthVal1 = request["phraseLengthVal1"];
  let phraseLengthVal2 = request["phraseLengthVal2"];
  let isMock = request["isMock"];

  const mockResponse = [
    [
      "this is",
      "un sentencio ejemplo",
      "to use as a mock",
      "an example sentence"
    ]
  ];

  if (isMock) {
    sendResponse({
      translatedText: mockResponse
    });
  } else {
    partially_translate_sentences(
      sentenceArray,
      targetLanguage,
      phraseLengthVal1,
      phraseLengthVal2
    ).then((res) => {
      console.log(res);
      sendResponse({ translatedText: res });
    });
  }
  return true; // to prevent message port from being closed
});

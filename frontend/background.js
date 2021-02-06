// var testSentence =
//   "this is a test sentence to see how the spacing works in clauses";
// var testDoc = nlp(testSentence);
// var testClauses = testDoc.clauses().out("array");
// console.log(testClauses);

function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      (code > 47 && code < 58) || // numeric (0-9)
      (code > 64 && code < 91) || // upper alpha (A-Z)
      (code > 96 && code < 123)
    ) {
      // lower alpha (a-z)
      return true;
    }
  }
  return false;
}

const translate = require("@iamtraction/google-translate");
// pos=1 -> before_context; pos=2 -> phrase_to_be_translated; pos=3 -> after_context
function convertClauseToString(clause, pos) {
  console.log(clause);
  var firstAlphaNumTerm = 0;
  for (var i = 0; i < clause["terms"].length; i++) {
    if (isAlphaNumeric(clause["terms"][i]["text"])) {
      firstAlphaNumTerm = i;
      break;
    }
  }

  var lastAlphaNumTerm = clause["terms"].length - 1;
  for (var i = clause["terms"].length - 1; i >= 0; i--) {
    if (isAlphaNumeric(clause["terms"][i]["text"])) {
      lastAlphaNumTerm = i;
      break;
    }
  }

  console.log(firstAlphaNumTerm, lastAlphaNumTerm);

  var beforeContext = "";
  var afterContext = "";
  for (var i = 0; i < firstAlphaNumTerm; i++) {
    beforeContext +=
      clause["terms"][i]["pre"] +
      clause["terms"][i]["text"] +
      clause["terms"][i]["post"];
  }

  for (var i = lastAlphaNumTerm + 1; i < clause["terms"].length; i++) {
    afterContext +=
      clause["terms"][i]["pre"] +
      clause["terms"][i]["text"] +
      clause["terms"][i]["post"];
  }

  var finalString = "";

  for (var i = firstAlphaNumTerm; i <= lastAlphaNumTerm; i++) {
    if (i == firstAlphaNumTerm) {
      finalString += clause["terms"][i]["text"] + clause["terms"][i]["post"];
    } else if (i == lastAlphaNumTerm) {
      finalString += clause["terms"][i]["pre"] + clause["terms"][i]["text"];
    } else {
      finalString +=
        clause["terms"][i]["pre"] +
        clause["terms"][i]["text"] +
        clause["terms"][i]["post"];
    }

    // if (i != clause["terms"].length - 1) {
    //   finalString +=
    //     clause["terms"][i]["pre"] +
    //     clause["terms"][i]["text"] +
    //     clause["terms"][i]["post"];
    // } else {
    //   finalString += clause["terms"][i]["pre"] + clause["terms"][i]["text"];
    // }
  }
  var finalTermLength = clause["terms"].length - 1;
  if (pos != 2 && firstAlphaNumTerm != lastAlphaNumTerm) {
    finalString =
      beforeContext +
      clause["terms"][firstAlphaNumTerm]["pre"] +
      finalString +
      clause["terms"][lastAlphaNumTerm]["post"] +
      afterContext;
    return [finalString, "", ""];
  } else if (pos != 2) {
    finalString =
      beforeContext +
      clause["terms"][firstAlphaNumTerm]["pre"] +
      finalString +
      afterContext;
    return [finalString, "", ""];
  } else if (firstAlphaNumTerm != lastAlphaNumTerm) {
    return [
      finalString,
      beforeContext + clause["terms"][firstAlphaNumTerm]["pre"],
      clause["terms"][lastAlphaNumTerm]["post"] + afterContext
    ];
  } else {
    return [
      finalString,
      beforeContext + clause["terms"][firstAlphaNumTerm]["pre"],
      afterContext
    ];
  }

  // return clause["text"];
}

// console.log(testDoc.clauses().json()[0]);
// console.log(convertClauseToString(testDoc.clauses().json()[0]));

function transform_clause_into_quartuple(clauses, i) {
  console.log(clauses);
  var before_context = "";
  for (var j = 0; j < i; j++) {
    before_context += convertClauseToString(clauses[j], 1)[0];
    // before_context += clauses[j]["text"];
  }
  // var phrase_to_be_translated = clauses[j]["text"];
  var phrase_to_be_translated_arr = convertClauseToString(clauses[j], 2);
  console.log("phrase to be translated array is: ");
  console.log(phrase_to_be_translated_arr);
  var phrase_to_be_translated = phrase_to_be_translated_arr[0];
  var extraLeftPuncutation = phrase_to_be_translated_arr[1];
  var extraRightPunctuation = phrase_to_be_translated_arr[2];
  var after_context = "";

  for (var j = i + 1; j < clauses.length; j++) {
    after_context += convertClauseToString(clauses[j], 3)[0];
  }
  console.log("before adding puncutation: ");
  console.log(after_context);

  before_context = before_context + extraLeftPuncutation;
  after_context = extraRightPunctuation + after_context;
  console.log("CONTEXT IS: ");
  console.log(before_context);
  console.log(phrase_to_be_translated);
  console.log(after_context);
  return [before_context, phrase_to_be_translated, after_context];
}

function naive_split(sentence, min_length, max_length) {
  var doc = nlp(sentence);
  var clauses = doc.clauses().json();
  //var clauses = doc.clauses().out("array");
  for (var i = 0; i < clauses.length; i++) {
    let clause = clauses[i]["text"];
    if (min_length <= clause.length && clause.length <= max_length) {
      console.log("about to transform the following clause");
      console.log(clauses[i]);
      return transform_clause_into_quartuple(clauses, i);
    }
  }
  if (clauses.length > 0) {
    return transform_clause_into_quartuple(clauses, 0);
  } else {
    return null;
  }
}

function count_leading_and_trailing_whitespace(sentence) {
  let saw_char = false;
  let num_left_spaces = 0;
  let num_right_spaces = 0;

  let i = 0;
  while (i < sentence.length) {
    if (isAlphaNumeric(sentence[i])) {
      break;
    } else {
      num_left_spaces++;
    }
    i++;
  }
  i = sentence.length - 1;
  while (i >= 0) {
    if (isAlphaNumeric(sentence[i])) {
      break;
    } else {
      num_right_spaces++;
    }
    i--;
  }
  return [num_left_spaces, num_right_spaces];
}

function getLeadingAndTrailingPuncutation(sentence) {
  var firstAlphaNum = 0;
  for (var i = 0; i < sentence.length; i++) {
    if (isAlphaNumeric(sentence[i])) {
      firstAlphaNum = i;
      break;
    }
  }
  var lastAlphaNum = sentence.length - 1;
  for (var i = sentence.length - 1; i >= 0; i--) {
    if (isAlphaNumeric(sentence[i])) {
      lastAlphaNum = i;
      break;
    }
  }

  var res = [
    sentence.slice(0, firstAlphaNum),
    sentence.slice(lastAlphaNum + 1, sentence.length),
    sentence.slice(firstAlphaNum, lastAlphaNum + 1)
  ];

  console.log(res);

  return res;
}

async function translate_phrase(
  before_context,
  phrase_to_be_translated,
  after_context,
  language,
  includeContext
) {
  // const delimiter = " ALFSKJLKASF ";
  let space_arr = count_leading_and_trailing_whitespace(
    phrase_to_be_translated
  );
  const num_left_spaces = space_arr[0];
  const num_right_spaces = space_arr[1];
  phrase_to_be_translated = phrase_to_be_translated.trim();

  var leftExtraPuncutation = "";
  var rightExtraPuncutation = "";
  if (before_context === "" && after_context === "") {
    var extraPunctuationArray = getLeadingAndTrailingPuncutation(
      phrase_to_be_translated
    );
    leftExtraPuncutation = extraPunctuationArray[0];
    rightExtraPuncutation = extraPunctuationArray[1];
    phrase_to_be_translated = extraPunctuationArray[2];
  }

  if (!includeContext) {
    let translationObj = await translate(phrase_to_be_translated, {
      from: "en",
      to: language
    });
    let result = translationObj["text"];
    phrase_to_be_translated =
      leftExtraPuncutation + phrase_to_be_translated + rightExtraPuncutation;
    phrase_to_be_translated =
      " ".repeat(num_left_spaces) +
      phrase_to_be_translated +
      " ".repeat(num_right_spaces);
    result = leftExtraPuncutation + result + rightExtraPuncutation;
    result =
      " ".repeat(num_left_spaces) + result + " ".repeat(num_right_spaces);

    return [before_context, result, after_context, phrase_to_be_translated];
  }

  // const spanOpen = "<p>";
  // const spanClose = " </p>";
  const spanOpen = "ALKJSLKFJLK ";
  const spanClose = " ALKJSLKFJLK";
  let full_sentence =
    before_context +
    spanOpen +
    phrase_to_be_translated +
    spanClose +
    after_context;
  console.log("about to translate: ");
  console.log(full_sentence);
  let translationObj = await translate(full_sentence, {
    from: "en",
    to: language
  });
  let translationString = translationObj["text"];
  console.log("the response is: ");
  console.log(translationString);

  const left_index = translationString.indexOf("ALKJSLKFJLK");
  const right_index = translationString.lastIndexOf("ALKJSLKFJLK");

  var final_left_index = left_index;
  var final_right_index = right_index;

  // for (var i = left_index; i < translationString.length; i++) {
  //   if (translationString[i] === " ") {
  //     final_left_index = i + 1;
  //     break;
  //   }
  // }

  // for (var i = right_index; i >= 0; i--) {
  //   if (translationString[i] === " ") {
  //     final_right_index = i - 1;
  //     break;
  //   }
  // }

  var result = translationString.slice(
    final_left_index + spanOpen.length,
    final_right_index - 1
  );
  phrase_to_be_translated =
    leftExtraPuncutation + phrase_to_be_translated + rightExtraPuncutation;
  phrase_to_be_translated =
    " ".repeat(num_left_spaces) +
    phrase_to_be_translated +
    " ".repeat(num_right_spaces);
  result = leftExtraPuncutation + result + rightExtraPuncutation;
  result = " ".repeat(num_left_spaces) + result + " ".repeat(num_right_spaces);
  // if (before_context.length === 0) {
  //   result = " " + result;
  // }
  // if (after_context.length == 0) {
  //   result = result + " ";
  // }
  return [before_context, result, after_context, phrase_to_be_translated];
}

async function partially_translate(
  sentence,
  language,
  phraseLengthVal1,
  phraseLengthVal2,
  includeContext
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
    language,
    includeContext
  );
  return translated_sentence;
}

async function partially_translate_sentences(
  sentences,
  language,
  phraseLengthVal1,
  phraseLengthVal2,
  includeContext
) {
  var result = [];
  for (var sentence of sentences) {
    var translated_sentence = await partially_translate(
      sentence,
      language,
      phraseLengthVal1,
      phraseLengthVal2,
      includeContext
    );
    result.push(translated_sentence);
  }
  return result;
}
// console.log("about to translate the resident scholar sentence");
// partially_translate_sentences(
//   [
//     ", Ryan helped care for her while his mother commuted to college in Madison, Wisconsin."
//   ],
//   "es",
//   10,
//   50,
//   true
// ).then((res) => {
//   console.log("AND THE RESPONSE IS");
//   console.log(res);
//   // sendResponse({ translatedText: res });
// });

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

var processTabs = {};

chrome.webNavigation.onCompleted.addListener((tab) => {
  chrome.tabs.get(tab.tabId, (current_tab_info) => {
    let url = current_tab_info.url;

    // check if time since url was added to processTabs is longer than 10 minutes
    if (url in processTabs && Date.now() - processTabs[url] < 600000) {
      return;
    } else {
      processTabs[url] = Date.now();
    }

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
  let includeContext = request["includeContext"];

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
      phraseLengthVal2,
      includeContext
    ).then((res) => {
      console.log(res);
      sendResponse({ translatedText: res });
    });
  }
  return true; // to prevent message port from being closed
});

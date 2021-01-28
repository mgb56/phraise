// import { translate } from "./node_modules/@iamtraction/google-translate/src/index";
// console.log(translate);

// translate("Thank you very much", { from: "en", to: "ru" })
//   .then((res) => {
//     console.log(res.text); // OUTPUT: Je vous remercie
//   })
//   .catch((err) => {
//     console.error(err);
//   });

// var testSentence =
//   "this is a test sentence to, see, how  the  spacing   works in clauses";
// var testDoc = nlp(testSentence);
// // var testClauses = testDoc.clauses().out("array");
// var testClauses = testDoc.clauses().out("array");
// console.log(testDoc.clauses().json());
// console.log(testDoc.clauses().text());
// console.log("i wonder if this will work");
// console.log(testClauses[0].text());

const translate = require("@iamtraction/google-translate");

function convertClauseToString(clause) {
  var finalString = "";
  for (var i = 0; i < clause["terms"].length; i++) {
    finalString +=
      clause["terms"][i]["pre"] +
      clause["terms"][i]["text"] +
      clause["terms"][i]["post"];
  }
  return finalString;
  // return clause["text"];
}

// console.log(testDoc.clauses().json()[0]);
// console.log(convertClauseToString(testDoc.clauses().json()[0]));

function transform_clause_into_quartuple(clauses, i) {
  var before_context = "";
  for (var j = 0; j < i; j++) {
    before_context += convertClauseToString(clauses[j]);
    // before_context += clauses[j]["text"];
  }
  // var phrase_to_be_translated = clauses[j]["text"];
  var phrase_to_be_translated = convertClauseToString(clauses[j]);
  var after_context = "";
  for (var j = i + 1; j < clauses.length; j++) {
    after_context += convertClauseToString(clauses[j]);
    // after_context += clauses[j]["text"];
  }
  return [before_context, phrase_to_be_translated, after_context];
}

function naive_split(sentence, min_length, max_length) {
  var doc = nlp(sentence);
  var clauses = doc.clauses().json();
  //var clauses = doc.clauses().out("array");
  for (var i = 0; i < clauses.length; i++) {
    let clause = clauses[i]["text"];
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

function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      !(code > 47 && code < 58) && // numeric (0-9)
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123)
    ) {
      // lower alpha (a-z)
      return false;
    }
  }
  return true;
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

async function translate_phrase(
  before_context,
  phrase_to_be_translated,
  after_context,
  language
) {
  // const delimiter = " ALFSKJLKASF ";
  let space_arr = count_leading_and_trailing_whitespace(
    phrase_to_be_translated
  );
  const num_left_spaces = space_arr[0];
  const num_right_spaces = space_arr[1];
  phrase_to_be_translated = phrase_to_be_translated.trim();
  const spanOpen = "<p>";
  const spanClose = " </p>";
  let full_sentence =
    before_context +
    spanOpen +
    phrase_to_be_translated +
    spanClose +
    after_context;
  // console.log("about to translate: ");
  // console.log(full_sentence);
  let translationObj = await translate(full_sentence, {
    from: "en",
    to: language
  });
  let translationString = translationObj["text"];
  // console.log("the response is: ");
  // console.log(translationString);

  const left_index = translationString.indexOf("<p>");
  const right_index = translationString.lastIndexOf("</p>");

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
    final_left_index + 3 + 1,
    final_right_index
  );
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
  // var jsonResult = await result.json();
  return result;
}

// translate_phrase("", "leave", "through the door please").then((res) =>
//   console.log(res)
// );

// var s = [
//   "the big red dog went for a walk this morning, and I guess I'm okay with that",
//   "this is a second sentence to test the API"
// ];

// partially_translate_sentences(s).then((res) => console.log(res));

// var res2 = naive_split(s, 10, 40);
// console.log("and the result is");
// console.log(res2);

// var doc = nlp("London is calling");
// var x = doc.verbs().toNegative();
// console.log(doc.text());

// var socket = io.connect("http://localhost:3002");
// socket.on("connect", function () {
//   console.log("Client connected");
// });

// partially_translate_sentences(
//   [
//     "proclaimed its independence with German support and protection. Germany annexed and invaded the Czech "
//   ],
//   "es",
//   10,
//   50
// ).then((res) => console.log(res));

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

// added by me
let active_tab_id = 0;

chrome.tabs.onActivated.addListener((tab) => {
  chrome.tabs.get(tab.tabId, (current_tab_info) => {
    active_tab_id = tab.tabId;

    let url = current_tab_info.url;

    chrome.storage.sync.set({ currentUrl: url }, () => {
      console.log("set url as" + url);
      console.log(typeof url);
    });
    // makes sure it's a valid url (exclude chrome:extensions//)
    var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression);

    if (url && url.match(regex)) {
      //chrome.tabs.insertCSS(null, { file: './mystyles.css' });
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

  // fetch("http://0.0.0.0:33507/", {
  //   method: "POST",
  //   body: JSON.stringify(request),
  //   headers: { "Content-type": "application/json; charset=UTF-8" }
  // })
  //   .then((response) => response.json())
  //   .then((jsonResponse) => {
  //     console.log(jsonResponse);
  //     sendResponse({ translatedText: jsonResponse });
  //   })
  //   .catch((err) => console.log(err));
  return true; // to prevent message port from being closed
});

var translatedNodes = [];
var translatedText = [];
// dynamically assign different ID's to each translation
var translationID = 0;

function handleText(node, samplingRateVal, phraseLengthVal1, phraseLengthVal2) {
  var numTokens = node.textContent.trim().split(" ").length;
  if (
    Math.random() < samplingRateVal &&
    numTokens >= phraseLengthVal1 &&
    numTokens <= phraseLengthVal2
  ) {
    // makes sure the string isn't a bunch of junk like dates
    console.log(node.textContent);
    var numChars = node.textContent.match(/[a-zA-Z]/g).length;
    if (numChars >= 15) {
      console.log(node.textContent);
      translatedText.push(node.textContent);
      translatedNodes.push(node);
    }
  }
}

function walk(node, samplingRateVal, phraseLengthVal1, phraseLengthVal2) {
  if (node.nodeType === 3) {
    handleText(node, samplingRateVal, phraseLengthVal1, phraseLengthVal2);
  }
  node = node.firstChild;
  while (node) {
    const { tagName } = node;
    if (
      tagName !== "SCRIPT" &&
      tagName !== "STYLE" &&
      tagName !== "NOSCRIPT" &&
      tagName !== "CITE" &&
      node.parentNode.tagName !== "A"
    ) {
      if (node.nodeType == 1) {
        const nodeClass = node.getAttribute("class");
        if (
          nodeClass &&
          (nodeClass.indexOf("noprint") !== -1 ||
            nodeClass.indexOf("hidden") !== -1)
        ) {
          // no-op
        } else {
          walk(node, samplingRateVal, phraseLengthVal1, phraseLengthVal2);
        }
      } else {
        walk(node, samplingRateVal, phraseLengthVal1, phraseLengthVal2);
      }
    }
    node = node.nextSibling;
  }
}

var filterStringToVal = {
  low: 0.005,
  medium: 0.01,
  high: 0.015,
  // buggy with value 1
  short: 2,
  average: 5,
  long: 7
};

chrome.storage.sync.get(
  [
    "samplingRateVal",
    "phraseLengthVal1",
    "phraseLengthVal2",
<<<<<<< HEAD
    "currentUrl",
    "sites"
=======
    "currentLanguage"
>>>>>>> d43f5055780a53e25e43564a9e7d31df66aa1046
  ],
  function (result) {
    var samplingRateVal;
    var phraseLengthVal1;
    var phraseLengthVal2;
    var currentLanguage;
    if (
      typeof result.samplingRateVal === "undefined" ||
      result.samplingRateVal == null
    ) {
      samplingRateVal = filterStringToVal["low"];
    } else {
      samplingRateVal = filterStringToVal[result.samplingRateVal];
    }
    if (
      typeof result.phraseLengthVal1 === "undefined" ||
      result.phraseLengthVal1 == null
    ) {
      phraseLengthVal1 = filterStringToVal["short"];
    } else {
      phraseLengthVal1 = filterStringToVal[result.phraseLengthVal1];
    }
    if (
      typeof result.phraseLengthVal2 === "undefined" ||
      result.phraseLengthVal2 == null
    ) {
      phraseLengthVal2 = filterStringToVal["long"];
    } else {
      phraseLengthVal2 = filterStringToVal[result.phraseLengthVal2];
    }
    var currUrl = result.currentUrl;
    var blockedSites = result.sites;
    if (blockedSites && blockedSites.includes(currUrl)) {
      return;
    }

    if (
      typeof result.currentLanguage === "undefined" ||
      result.currentLanguage == null
    ) {
      currentLanguage = "es";
    } else {
      currentLanguage = result.currentLanguage;
    }
    walk(
      document.getRootNode(),
      samplingRateVal,
      phraseLengthVal1,
      phraseLengthVal2
    );
    console.log(translatedNodes);
    console.log("about to send message?");
    chrome.runtime.sendMessage(
      { array: translatedText, language: currentLanguage },
      function (response) {
        processTranslations(response.translatedText);
      }
    );
  }
);

// untranslated is a string, the rest of the params are nodes
function applyStyling(
  beforeTranslation,
  translation,
  afterTranslation,
  untranslated
) {
  // TODO: move spacing stuff to different function
  if (untranslated[untranslated.length - 1] == " ") {
    untranslated = untranslated.substring(0, untranslated.length - 1);
  }

  var highlightedTranslation = document.createElement("span");
  highlightedTranslation.className = "translation";
  var id = "hover" + translationID.toString();
  highlightedTranslation.id = id;

  // to remove on hover
  var untranslation = document.createElement("span");
  untranslation.className = "untranslation";
  untranslation.appendChild(translation);

  var highlightingStyle = ".translation { background-color:lightgreen; }";
  // TODO: change to id
  var hoverOffStyle =
    "." + highlightedTranslation.className + ":hover span { display:none; }";
  var hoverOnStyle =
    "#" + id + ':hover::before { content:"' + untranslated + '"; }';

  // TODO: figure out how to import so stuff like these raw strings can be cleaned up
  var style = document.createElement("style");
  style.appendChild(
    document.createTextNode(highlightingStyle + hoverOffStyle + hoverOnStyle)
  );
  document.querySelector("head").appendChild(style);

  var translationTextLength = translation.textContent.length;

  // get rid of pesky trailing space in translation
  if (
    translation.textContent.substring(
      translationTextLength - 2,
      translationTextLength
    ) == "  "
  ) {
    translation.textContent = translation.textContent.substring(
      0,
      translationTextLength - 2
    );
    afterTranslation.textContent = " " + afterTranslation.textContent;
  } else if (translation.textContent[translationTextLength - 1] == " ") {
    translation.textContent = translation.textContent.substring(
      0,
      translationTextLength - 1
    );
  }

  translationTextLength = translation.textContent.length;

  // get rid of potential leading space
  if (translation.textContent[0] == " ") {
    translation.textContent = translation.textContent.substring(
      1,
      translationTextLength
    );
    beforeTranslation.textContent = beforeTranslation.textContent + " ";
  }

  highlightedTranslation.appendChild(untranslation);
  return highlightedTranslation;
}

function processTranslations(translations) {
  console.log(translations);
  var translatedNodesLength = translatedNodes.length;
  for (var i = 0; i < translatedNodesLength; i++) {
    if (
      translations[i][0] == "" &&
      translations[i][1] == "" &&
      translations[i][2] == ""
    ) {
      continue;
    }

    // create a node for each part of the string
    translatedNodes[i].textContent = translations[i][0];
    var translation = document.createElement("span");
    translation.innerHTML = translations[i][1];
    var afterTranslation = document.createTextNode(translations[i][2]);

    var highlightedTranslation = applyStyling(
      translatedNodes[i],
      translation,
      afterTranslation,
      translations[i][3]
    );

    // make the three nodes siblings
    translatedNodes[i].parentNode.insertBefore(
      highlightedTranslation,
      translatedNodes[i].nextSibling
    );
    translatedNodes[i].parentNode.insertBefore(
      afterTranslation,
      highlightedTranslation.nextSibling
    );

    translationID++;
  }
}

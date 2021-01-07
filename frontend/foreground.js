var translatedNodes = [];
var translatedText = [];

function handleText(node) {
  if (Math.random() < 0.005 && node.textContent.trim().split(" ").length > 3) {
    var numChars = node.textContent.match(/[a-zA-Z]/g).length;
    if (numChars >= 15) {
      console.log(node.textContent);
      translatedText.push(node.textContent);
      translatedNodes.push(node);
    }
  }
}

function walk(node) {
  if (node.nodeType === 3) {
    handleText(node);
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
          walk(node);
        }
      } else {
        walk(node);
      }
    }
    node = node.nextSibling;
  }
}

walk(document.getRootNode());
console.log(translatedNodes);

// dynamically assign different ID's to each translation
var translationID = 0;

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

console.log("about to send message?");
chrome.runtime.sendMessage({ array: translatedText }, function (response) {
  processTranslations(response.translatedText);
});

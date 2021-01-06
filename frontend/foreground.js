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

function highlightTranslation(
  beforeTranslation,
  translation,
  afterTranslation
) {
  var highlightedTranslation = document.createElement("span");
  highlightedTranslation.setAttribute("style", "background-color:lightgreen;");

  // get rid of pesky trailing space in translation
  if (
    translation.textContent.substring(
      translation.textContent.length - 2,
      translation.textContent.length
    ) == "  "
  ) {
    translation.textContent = translation.textContent.substring(
      0,
      translation.textContent.length - 2
    );
    afterTranslation.textContent = " " + afterTranslation.textContent;
  } else if (
    translation.textContent[translation.textContent.length - 1] == " "
  ) {
    translation.textContent = translation.textContent.substring(
      0,
      translation.textContent.length - 1
    );
  }

  // get rid of potential leading space
  if (translation.textContent[0] == " ") {
    translation.textContent = translation.textContent.substring(
      1,
      translation.textContent.length
    );
    beforeTranslation.textContent = beforeTranslation.textContent + " ";
  }

  highlightedTranslation.appendChild(translation);
  return highlightedTranslation;
}

function processTranslations(translations) {
  console.log(translations);
  for (var i = 0; i < translatedNodes.length; i++) {
    // if 3 parts are all empty, replace with original text
    if (
      translations[i][0] == "" &&
      translations[i][1] == "" &&
      translations[i][2] == ""
    ) {
      continue;
    }

    // create a node for each part of the string
    translatedNodes[i].textContent = translations[i][0];
    var translation = document.createTextNode(translations[i][1]);
    var afterTranslation = document.createTextNode(translations[i][2]);

    var highlightedTranslation = highlightTranslation(
      translatedNodes[i],
      translation,
      afterTranslation
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
  }
}

console.log("about to send message?");
chrome.runtime.sendMessage({ array: translatedText }, function (response) {
  processTranslations(response.translatedText);
});

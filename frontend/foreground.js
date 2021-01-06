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
      walk(node);
    }
    node = node.nextSibling;
  }
}

walk(document.getRootNode());
console.log(translatedNodes);

function highlightTranslation(
  before_translation,
  translation,
  after_translation
) {
  var highlightedTranslation = document.createElement("span");
  highlightedTranslation.setAttribute("style", "background-color:lightgreen;");

  highlightedTranslationText = document.createTextNode(
    translation.textContent.substring(0, translation.textContent.length - 1)
  );

  // get rid of pesky trailing space in translation (happens when translation is followed by a space, rather than punctuation)
  if (
    highlightedTranslationText.textContent[
      highlightedTranslationText.textContent.length - 1
    ] == " "
  ) {
    highlightedTranslationText.textContent = highlightedTranslationText.textContent.substring(
      0,
      highlightedTranslationText.textContent.length - 1
    );
    after_translation.textContent = " " + after_translation.textContent;
  }

  // get rid of potential leading space
  if (highlightedTranslationText.textContent[0] == " ") {
    highlightedTranslationText.textContent = highlightedTranslationText.textContent.substring(
      1,
      highlightedTranslationText.textContent.length
    );
    before_translation.textContent = before_translation.textContent + " ";
  }

  highlightedTranslation.appendChild(highlightedTranslationText);
  return highlightedTranslation;
}

function processTranslations(translations) {
  console.log(translations);
  for (var i = 0; i < translatedNodes.length; i++) {
    // put p tags in node text
    translatedNodes[i].textContent = translations[i];

    // translatedNodes[i] has stuff before translation with <p> tag at the end
    // translation_and_after_node has the translation
    // after_translated_node has the stuff after the translation with a </p> at the beginning
    var begin_tag_index = translations[i].search("<p>");

    // new node containing stuff from translation onward
    var translation_and_after_node = translatedNodes[i].splitText(
      begin_tag_index + 3
    );

    var end_tag_index = translation_and_after_node.textContent.search("</p>");

    // new node containing stuff after translation
    var after_translated_node = translation_and_after_node.splitText(
      end_tag_index
    );

    // remove p tags
    translatedNodes[i].textContent = translatedNodes[i].textContent.substring(
      0,
      translatedNodes[i].textContent.length - 3
    );
    after_translated_node.textContent = after_translated_node.textContent.substring(
      4,
      after_translated_node.textContent.length
    );

    var highlightedTranslation = highlightTranslation(
      translatedNodes[i],
      translation_and_after_node,
      after_translated_node
    );

    translation_and_after_node.parentNode.replaceChild(
      highlightedTranslation,
      translation_and_after_node
    );
  }
}

console.log("about to send message?");
chrome.runtime.sendMessage({ array: translatedText }, function (response) {
  processTranslations(response.translatedText);
});

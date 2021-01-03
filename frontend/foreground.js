// document.body refers to the actual html page
// console.log(document.body);
// console.log(typeof document.body);

// // <script src="scripts/require-jquery.js"></script>
// // <script src="scripts/main.js"></script>

// // // const { htmlToText } = require('html-to-text');
// // // import htmlToText from 'html-to-text';

// const html = document.body;

// const text = htmlToText(html, {});

// // // console.log(text);
// //console.log(document.body);

// console.log('got here');

var elements = document.getElementsByTagName("*");

for (var i = 0; i < elements.length; i++) {
  var element = elements[i];

  for (var j = 0; j < element.childNodes.length; j++) {
    var node = element.childNodes[j];
    if (node.nodeType === 3) {
      // if child is a text node
      var text = node.nodeValue;
      console.log(text);
      var replacedText = text.replace(
        "him",
        "sdjfldjslfjlskejflijweofgjoewijfoewjfli"
      );
      if (replacedText !== text) {
        element.replaceChild(document.createTextNode(replacedText), node);
      }
    }
  }
}

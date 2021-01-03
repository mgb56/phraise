// document.body refers to the actual html page
console.log(document.body);
console.log(typeof document.body);

// <script src="scripts/require-jquery.js"></script>
// <script src="scripts/main.js"></script>

// // const { htmlToText } = require('html-to-text');
// // import htmlToText from 'html-to-text';

const html = document.body;

const text = htmlToText(html, {});

// // console.log(text);

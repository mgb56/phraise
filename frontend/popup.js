// Slider
(function () {
  "use strict";

  var RS = function (conf) {
    this.input = null;
    this.inputDisplay = null;
    this.slider = null;
    this.sliderWidth = 0;
    this.sliderLeft = 0;
    this.pointerWidth = 0;
    this.pointerR = null;
    this.pointerL = null;
    this.activePointer = null;
    this.selected = null;
    this.scale = null;
    this.step = 0;
    this.tipL = null;
    this.tipR = null;
    this.timeout = null;
    this.valRange = false;

    this.values = {
      start: null,
      end: null,
    };
    this.conf = {
      target: null,
      values: null,
      set: null,
      range: false,
      width: null,
      scale: true,
      labels: true,
      tooltip: true,
      step: null,
      disabled: false,
      onChange: null,
    };

    this.cls = {
      container: "rs-container",
      background: "rs-bg",
      selected: "rs-selected",
      pointer: "rs-pointer",
      scale: "rs-scale",
      noscale: "rs-noscale",
      tip: "rs-tooltip",
    };

    for (var i in this.conf) {
      if (conf.hasOwnProperty(i)) this.conf[i] = conf[i];
    }

    this.init();
  };

  RS.prototype.init = function () {
    if (typeof this.conf.target === "object") this.input = this.conf.target;
    else
      this.input = document.getElementById(this.conf.target.replace("#", ""));

    if (!this.input) return console.log("Cannot find target element...");

    this.inputDisplay = getComputedStyle(this.input, null).display;
    this.input.style.display = "none";
    this.valRange = !(this.conf.values instanceof Array);

    if (this.valRange) {
      if (
        !this.conf.values.hasOwnProperty("min") ||
        !this.conf.values.hasOwnProperty("max")
      )
        return console.log("Missing min or max value...");
    }
    return this.createSlider();
  };

  RS.prototype.createSlider = function () {
    this.slider = createElement("div", this.cls.container);
    this.slider.innerHTML = '<div class="rs-bg"></div>';
    this.selected = createElement("div", this.cls.selected);
    this.pointerL = createElement("div", this.cls.pointer, ["dir", "left"]);
    this.scale = createElement("div", this.cls.scale);

    if (this.conf.tooltip) {
      this.tipL = createElement("div", this.cls.tip);
      this.tipR = createElement("div", this.cls.tip);
      this.pointerL.appendChild(this.tipL);
    }
    this.slider.appendChild(this.selected);
    this.slider.appendChild(this.scale);
    this.slider.appendChild(this.pointerL);

    if (this.conf.range) {
      this.pointerR = createElement("div", this.cls.pointer, ["dir", "right"]);
      if (this.conf.tooltip) this.pointerR.appendChild(this.tipR);
      this.slider.appendChild(this.pointerR);
    }

    this.input.parentNode.insertBefore(this.slider, this.input.nextSibling);

    if (this.conf.width)
      this.slider.style.width = parseInt(this.conf.width) + "px";
    this.sliderLeft = this.slider.getBoundingClientRect().left;
    this.sliderWidth = this.slider.clientWidth;
    this.pointerWidth = this.pointerL.clientWidth;

    if (!this.conf.scale) this.slider.classList.add(this.cls.noscale);

    return this.setInitialValues();
  };

  RS.prototype.setInitialValues = function () {
    this.disabled(this.conf.disabled);

    if (this.valRange) this.conf.values = prepareArrayValues(this.conf);

    this.values.start = 0;
    this.values.end = this.conf.range ? this.conf.values.length - 1 : 0;

    if (this.conf.set && this.conf.set.length && checkInitial(this.conf)) {
      var vals = this.conf.set;

      if (this.conf.range) {
        this.values.start = this.conf.values.indexOf(vals[0]);
        this.values.end = this.conf.set[1]
          ? this.conf.values.indexOf(vals[1])
          : null;
      } else this.values.end = this.conf.values.indexOf(vals[0]);
    }
    return this.createScale();
  };

  RS.prototype.createScale = function (resize) {
    this.step = this.sliderWidth / (this.conf.values.length - 1);

    for (var i = 0, iLen = this.conf.values.length; i < iLen; i++) {
      var span = createElement("span"),
        ins = createElement("ins");

      span.appendChild(ins);
      this.scale.appendChild(span);

      span.style.width = i === iLen - 1 ? 0 : this.step + "px";

      if (!this.conf.labels) {
        if (i === 0 || i === iLen - 1) ins.innerHTML = this.conf.values[i];
      } else ins.innerHTML = this.conf.values[i];

      ins.style.marginLeft = (ins.clientWidth / 2) * -1 + "px";
    }
    return this.addEvents();
  };

  RS.prototype.updateScale = function () {
    this.step = this.sliderWidth / (this.conf.values.length - 1);

    var pieces = this.slider.querySelectorAll("span");

    for (var i = 0, iLen = pieces.length; i < iLen; i++)
      pieces[i].style.width = this.step + "px";

    return this.setValues();
  };

  RS.prototype.addEvents = function () {
    var pointers = this.slider.querySelectorAll("." + this.cls.pointer),
      pieces = this.slider.querySelectorAll("span");

    createEvents(document, "mousemove touchmove", this.move.bind(this));
    createEvents(
      document,
      "mouseup touchend touchcancel",
      this.drop.bind(this)
    );

    for (var i = 0, iLen = pointers.length; i < iLen; i++)
      createEvents(pointers[i], "mousedown touchstart", this.drag.bind(this));

    for (var i = 0, iLen = pieces.length; i < iLen; i++)
      createEvents(pieces[i], "click", this.onClickPiece.bind(this));

    window.addEventListener("resize", this.onResize.bind(this));

    return this.setValues();
  };

  RS.prototype.drag = function (e) {
    e.preventDefault();

    if (this.conf.disabled) return;

    var dir = e.target.getAttribute("data-dir");
    if (dir === "left") this.activePointer = this.pointerL;
    if (dir === "right") this.activePointer = this.pointerR;

    return this.slider.classList.add("sliding");
  };

  RS.prototype.move = function (e) {
    if (this.activePointer && !this.conf.disabled) {
      var coordX = e.type === "touchmove" ? e.touches[0].clientX : e.pageX,
        index = coordX - this.sliderLeft - this.pointerWidth / 2;

      index = Math.round(index / this.step);

      if (index <= 0) index = 0;
      if (index > this.conf.values.length - 1)
        index = this.conf.values.length - 1;

      if (this.conf.range) {
        if (this.activePointer === this.pointerL) this.values.start = index;
        if (this.activePointer === this.pointerR) this.values.end = index;
      } else this.values.end = index;

      return this.setValues();
    }
  };

  RS.prototype.drop = function () {
    this.activePointer = null;
  };

  RS.prototype.setValues = function (start, end) {
    var activePointer = this.conf.range ? "start" : "end";

    if (start && this.conf.values.indexOf(start) > -1)
      this.values[activePointer] = this.conf.values.indexOf(start);

    if (end && this.conf.values.indexOf(end) > -1)
      this.values.end = this.conf.values.indexOf(end);

    if (this.conf.range && this.values.start > this.values.end)
      this.values.start = this.values.end;

    this.pointerL.style.left =
      this.values[activePointer] * this.step - this.pointerWidth / 2 + "px";

    if (this.conf.range) {
      if (this.conf.tooltip) {
        this.tipL.innerHTML = this.conf.values[this.values.start];
        this.tipR.innerHTML = this.conf.values[this.values.end];
      }
      this.input.value =
        this.conf.values[this.values.start] +
        "," +
        this.conf.values[this.values.end];
      this.pointerR.style.left =
        this.values.end * this.step - this.pointerWidth / 2 + "px";
    } else {
      if (this.conf.tooltip)
        this.tipL.innerHTML = this.conf.values[this.values.end];
      this.input.value = this.conf.values[this.values.end];
    }

    if (this.values.end > this.conf.values.length - 1)
      this.values.end = this.conf.values.length - 1;
    if (this.values.start < 0) this.values.start = 0;

    this.selected.style.width =
      (this.values.end - this.values.start) * this.step + "px";
    this.selected.style.left = this.values.start * this.step + "px";

    return this.onChange();
  };

  RS.prototype.onClickPiece = function (e) {
    if (this.conf.disabled) return;

    var idx = Math.round((e.clientX - this.sliderLeft) / this.step);

    if (idx > this.conf.values.length - 1) idx = this.conf.values.length - 1;
    if (idx < 0) idx = 0;

    if (this.conf.range) {
      if (idx - this.values.start <= this.values.end - idx) {
        this.values.start = idx;
      } else this.values.end = idx;
    } else this.values.end = idx;

    this.slider.classList.remove("sliding");

    return this.setValues();
  };

  RS.prototype.onChange = function () {
    var _this = this;

    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(function () {
      if (_this.conf.onChange && typeof _this.conf.onChange === "function") {
        return _this.conf.onChange(_this.input.value);
      }
    }, 500);
  };

  RS.prototype.onResize = function () {
    this.sliderLeft = this.slider.getBoundingClientRect().left;
    this.sliderWidth = this.slider.clientWidth;
    return this.updateScale();
  };

  RS.prototype.disabled = function (disabled) {
    this.conf.disabled = disabled;
    this.slider.classList[disabled ? "add" : "remove"]("disabled");
  };

  RS.prototype.getValue = function () {
    return this.input.value;
  };

  RS.prototype.destroy = function () {
    this.input.style.display = this.inputDisplay;
    this.slider.remove();
  };

  var createElement = function (el, cls, dataAttr) {
      var element = document.createElement(el);
      if (cls) element.className = cls;
      if (dataAttr && dataAttr.length === 2)
        element.setAttribute("data-" + dataAttr[0], dataAttr[1]);

      return element;
    },
    createEvents = function (el, ev, callback) {
      var events = ev.split(" ");

      for (var i = 0, iLen = events.length; i < iLen; i++)
        el.addEventListener(events[i], callback);
    },
    prepareArrayValues = function (conf) {
      var values = [],
        range = conf.values.max - conf.values.min;

      if (!conf.step) {
        console.log("No step defined...");
        return [conf.values.min, conf.values.max];
      }

      for (var i = 0, iLen = range / conf.step; i < iLen; i++)
        values.push(conf.values.min + i * conf.step);

      if (values.indexOf(conf.values.max) < 0) values.push(conf.values.max);

      return values;
    },
    checkInitial = function (conf) {
      if (!conf.set || conf.set.length < 1) return null;
      if (conf.values.indexOf(conf.set[0]) < 0) return null;

      if (conf.range) {
        if (conf.set.length < 2 || conf.values.indexOf(conf.set[1]) < 0)
          return null;
      }
      return true;
    };

  window.rSlider = RS;
})();

// Tabs and tab content
var linkParis = document.getElementById("link-Paris");
openCity(linkParis, "Paris"); // open city Paris so it is pre-selected

linkParis.onclick = function (element) {
  openCity(linkParis, "Paris");
};

var linkLondon = document.getElementById("link-London");
linkLondon.onclick = function (element) {
  openCity(linkLondon, "London");
};

function openCity(evt, cityName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.className += " active";
}

// Dropdowns
var languages = {
  Afrikaans: "af",
  Albanian: "sq",
  Amharic: "am",
  Arabic: "ar",
  Armenian: "hy",
  Azerbaijani: "az",
  Basque: "eu",
  Belarusian: "be",
  Bengali: "bn",
  Bosnian: "bs",
  Bulgarian: "bg",
  Catalan: "ca",
  Cebuano: "ceb",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  Corsican: "co",
  Croatian: "hr",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  English: "en",
  Esperanto: "eo",
  Estonian: "et",
  Finnish: "fi",
  French: "fr",
  Frisian: "fy",
  Galician: "gl",
  Georgian: "ka",
  German: "de",
  Greek: "el",
  Gujarati: "gu",
  "Haitian Creole": "ht",
  Hausa: "ha",
  Hawaiian: "haw",
  Hebrew: "he",
  Hindi: "hi",
  Hmong: "hmn",
  Hungarian: "hu",
  Icelandic: "is",
  Igbo: "ig",
  Indonesian: "id",
  Irish: "ga",
  Italian: "it",
  Japanese: "ja",
  Javanese: "jv",
  Kannada: "kn",
  Kazakh: "kk",
  Khmer: "km",
  Kinyarwanda: "rw",
  Korean: "ko",
  Kurdish: "ku",
  Kyrgyz: "ky",
  Lao: "lo",
  Latin: "la",
  Latvian: "lv",
  Lithuanian: "lt",
  Luxembourgish: "lb",
  Macedonian: "mk",
  Malagasy: "mg",
  Malay: "ms",
  Malayalam: "ml",
  Maltese: "mt",
  Maori: "mi",
  Marathi: "mr",
  Mongolian: "mn",
  "Myanmar (Burmese)": "my",
  Nepali: "ne",
  Norwegian: "no",
  "Nyanja (Chichewa)": "ny",
  "Odia (Oriya)": "or",
  Pashto: "ps",
  Persian: "fa",
  Polish: "pl",
  "Portuguese (Portugal, Brazil)": "pt",
  Punjabi: "pa",
  Romanian: "ro",
  Russian: "ru",
  Samoan: "sm",
  Scots: "gd",
  Serbian: "sr",
  Sesotho: "st",
  Shona: "sn",
  Sindhi: "sd",
  "Sinhala (Sinhalese)": "si",
  Slovak: "sk",
  Slovenian: "sl",
  Somali: "so",
  Spanish: "es",
  Sundanese: "su",
  Swahili: "sw",
  Swedish: "sv",
  "Tagalog (Filipino)": "tl",
  Tajik: "tg",
  Tamil: "ta",
  Tatar: "tt",
  Telugu: "te",
  Thai: "th",
  Turkish: "tr",
  Turkmen: "tk",
  Ukrainian: "uk",
  Urdu: "ur",
  Uyghur: "ug",
  Uzbek: "uz",
  Vietnamese: "vi",
  Welsh: "cy",
  Xhosa: "xh",
  Yiddish: "yi",
  Yoruba: "yo",
  Zulu: "zu",
};

var languageDropdown = document.getElementById("languageDropdown");
languageDropdown.onclick = () => {
  document.getElementById("languageSelection").classList.toggle("show");
};

var languageSearch = document.getElementById("languageSearch");
languageSearch.onkeyup = () => {
  var input, filter, a, i;
  input = document.getElementById("languageSearch");
  filter = input.value.toUpperCase();
  div = document.getElementById("languageSelection");
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
};
// used to check if a language was selected in settings save
var languageSearchInitPlaceholder = languageSearch.placeholder;

var languageSelection = document.getElementById("languageSelection");
for (var lang in languages) {
  var entry = document.createElement("a");
  entry.innerHTML = lang;
  entry.href = "#" + lang;
  languageSelection.appendChild(entry);
}

var samplingRateSlider;
chrome.storage.sync.get(["samplingRateVal"], function (result) {
  var samplingRateInitVal;
  if (
    typeof result.samplingRateVal === "undefined" ||
    result.samplingRateVal == null
  ) {
    samplingRateInitVal = "low";
  } else {
    samplingRateInitVal = result.samplingRateVal;
  }
  samplingRateSlider = new rSlider({
    target: "#samplingRateSlider",
    values: ["low", "medium", "high"],
    range: false,
    tooltip: true,
    scale: false,
    labels: false,
    width: 400,
    set: [samplingRateInitVal],
  });
  samplingRateSlider.onChange = () => {
    updateSettings();
  };
});

function setLanguage() {
  // handle language setting
  var selectedLanguage = languageSearch.placeholder;
  chrome.extension.getBackgroundPage().console.log(selectedLanguage);
  if (selectedLanguage !== languageSearchInitPlaceholder) {
    chrome.storage.sync.set({ currentLanguage: selectedLanguage }, function () {
      chrome.extension
        .getBackgroundPage()
        .console.log("selectedLanguage is set to " + selectedLanguage);
    });
    var currentLanguageText = document.getElementById("currentLanguageText");
    currentLanguageText.innerHTML = selectedLanguage;
  }
}

// Save Settings
var updateSettings = () => {
  var samplingRateVal = samplingRateSlider.getValue();
  // advanced options was not clicked
  if (
    typeof wordDifficultySlider === "undefined" ||
    wordDifficultySlider == null
  ) {
    chrome.storage.sync.set({ samplingRateVal: samplingRateVal }, function () {
      chrome.extension
        .getBackgroundPage()
        .console.log("samplingRateVal is set to " + samplingRateVal);
    });
    chrome.extension.getBackgroundPage().console.log("got here");
    setLanguage();
    return;
  }

  var wordDifficultyVal = wordDifficultySlider.getValue();
  var phraseLengthVals = phraseLengthSlider.getValue();
  var phraseLengthVal1 = phraseLengthVals.substring(
    0,
    phraseLengthVals.search(",")
  );
  var phraseLengthVal2 = phraseLengthVals.substring(
    phraseLengthVals.search(",") + 1,
    phraseLengthVals.length
  );

  // set settings values for persistence
  chrome.storage.sync.set(
    {
      samplingRateVal: samplingRateVal,
      wordDifficultyVal: wordDifficultyVal,
      phraseLengthVal1: phraseLengthVal1,
      phraseLengthVal2: phraseLengthVal2,
    },
    function () {
      chrome.extension
        .getBackgroundPage()
        .console.log(
          `samplingRateVal set to ${samplingRateVal}, wordDifficultyVal set to ${wordDifficultyVal}, phraseLengthVal1 set to ${phraseLengthVal1}, phraseLengthVal2 set to ${phraseLengthVal2}`
        );
    }
  );
  setLanguage();
};

var languageEntries = document.querySelectorAll("#languageSelection > a");
for (var entry of languageEntries) {
  entry.onclick = (function (text) {
    return function () {
      languageSearch.placeholder = text;
      updateSettings();
    };
  })(entry.innerHTML);
}

chrome.storage.sync.get(["currentLanguage"], function (result) {
  var currentLanguage;
  if (
    typeof result.currentLanguage === "undefined" ||
    result.currentLanguage == null
  ) {
    chrome.extension
      .getBackgroundPage()
      .console.log("currentLanguage not found");
    currentLanguage = "Spanish";
  } else {
    chrome.extension.getBackgroundPage().console.log("currentLanguage found");
    currentLanguage = result.currentLanguage;
  }
  var currentLanguageText = document.getElementById("currentLanguageText");
  currentLanguageText.innerHTML = currentLanguage;
});

var sites = [
  "https://www.news.google.com",
  "https://www.aws.amazon.com",
  "https://www.cloud.console.google.com",
  "https://www.facebook.com",
  "https://www.kit.snap.com",
  "https://www.apple.com",
];

sites.sort();

var blockMultipleSites = document.getElementById("blockCustomSitesMultiple");

for (site of sites) {
  var optionElement = document.createElement("option");
  optionElement.value = site;
  blockMultipleSites.appendChild(optionElement);
}

// Advanced Options
var advancedOptions = document.getElementById("advancedOptions");
var firstTime = true;
var wordDifficultySlider;
var phraseLengthSlider;
var clickAdvancedOptions = () => {
  if (firstTime) {
    // All of this bs is to make the advanced options slides hidden by default
    var wordDifficultyInput = document.createElement("input");
    wordDifficultyInput.type = "text";
    wordDifficultyInput.id = "wordDifficultySlider";
    var phraseLengthInput = document.createElement("input");
    phraseLengthInput.type = "text";
    phraseLengthInput.id = "phraseLengthSlider";

    var samplingRateContainer = document.getElementById(
      "samplingRateContainer"
    );
    var wordDifficultyContainer = document.createElement("div");
    wordDifficultyContainer.id = "wordDifficultyContainer";
    var wordDifficultyLabel = document.createElement("span");
    wordDifficultyLabel.innerHTML = "Word Difficulty: ";
    wordDifficultyContainer.appendChild(wordDifficultyLabel);
    wordDifficultyContainer.appendChild(wordDifficultyInput);

    var phraseLengthContainer = document.createElement("div");
    phraseLengthContainer.id = "phraseLengthContainer";
    var phraseLengthLabel = document.createElement("span");
    phraseLengthLabel.innerHTML = "Phrase Length: ";
    phraseLengthContainer.appendChild(phraseLengthLabel);
    phraseLengthContainer.appendChild(phraseLengthInput);

    samplingRateContainer.parentNode.insertBefore(
      wordDifficultyContainer,
      samplingRateContainer.nextElementSibling
    );
    samplingRateContainer.parentNode.insertBefore(
      phraseLengthContainer,
      wordDifficultyContainer.nextElementSibling
    );

    chrome.storage.sync.get(["wordDifficultyVal"], function (result) {
      var wordDifficultyInitVal;
      if (
        typeof result.wordDifficultyVal === "undefined" ||
        result.wordDifficultyVal == null
      ) {
        wordDifficultyInitVal = "easy";
      } else {
        wordDifficultyInitVal = result.wordDifficultyVal;
      }
      wordDifficultySlider = new rSlider({
        target: "#wordDifficultySlider",
        values: ["easy", "medium", "hard"],
        range: false,
        tooltip: true,
        scale: false,
        labels: false,
        width: 400,
        set: [wordDifficultyInitVal],
      });
      wordDifficultySlider.onChange = () => {
        updateSettings();
      };
    });

    chrome.storage.sync.get(
      ["phraseLengthVal1", "phraseLengthVal2"],
      function (result) {
        var phraseLengthInitVal1;
        var phraseLengthInitVal2;
        if (
          typeof result.phraseLengthVal1 === "undefined" ||
          result.phraseLengthVal1 == null
        ) {
          phraseLengthInitVal1 = "short";
        } else {
          phraseLengthInitVal1 = result.phraseLengthVal1;
        }
        if (
          typeof result.phraseLengthVal2 === "undefined" ||
          result.phraseLengthVal2 == null
        ) {
          phraseLengthInitVal2 = "long";
        } else {
          phraseLengthInitVal2 = result.phraseLengthVal2;
        }

        phraseLengthSlider = new rSlider({
          target: "#phraseLengthSlider",
          values: ["short", "medium", "long"],
          range: true,
          tooltip: true,
          scale: false,
          labels: false,
          width: 400,
          set: [phraseLengthInitVal1, phraseLengthInitVal2],
        });
        phraseLengthSlider.onChange = () => {
          updateSettings();
        };
      }
    );
    firstTime = false;
  } else {
    var samplingRateSliderContainer = document.querySelector(".rs-container");
    var wordDifficultyContainer =
      samplingRateSliderContainer.parentNode.nextElementSibling;
    var phraseLengthContainer = wordDifficultyContainer.nextElementSibling;

    for (var child of wordDifficultyContainer.childNodes) {
      if (child.tagName !== "INPUT") {
        if (child.style.display === "none") {
          child.style.display = "block";
        } else {
          child.style.display = "none";
        }
      }
    }
    for (var child of phraseLengthContainer.childNodes) {
      if (child.tagName !== "INPUT") {
        if (child.style.display === "none") {
          child.style.display = "block";
        } else {
          child.style.display = "none";
        }
      }
    }
  }
};
advancedOptions.onclick = clickAdvancedOptions;

// MULTI-SELECTION DROPDOWN

// Initialize function, create initial tokens with itens that are already selected by the user
function init(element) {
  // Create div that wroaps all the elements inside (select, elements selected, search div) to put select inside
  const wrapper = document.createElement("div");
  wrapper.addEventListener("click", clickOnWrapper);
  wrapper.classList.add("multi-select-component");

  // Create elements of search
  const search_div = document.createElement("div");
  search_div.classList.add("search-container");
  const input = document.createElement("input");
  input.classList.add("selected-input");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("tabindex", "0");
  input.addEventListener("keyup", inputChange);
  input.addEventListener("keydown", deletePressed);
  input.addEventListener("click", openOptions);

  const dropdown_icon = document.createElement("a");
  dropdown_icon.setAttribute("href", "#");
  dropdown_icon.classList.add("dropdown-icon");

  dropdown_icon.addEventListener("click", clickDropdown);
  const autocomplete_list = document.createElement("ul");
  autocomplete_list.classList.add("autocomplete-list");
  search_div.appendChild(input);
  search_div.appendChild(autocomplete_list);
  search_div.appendChild(dropdown_icon);

  // set the wrapper as child (instead of the element)
  element.parentNode.replaceChild(wrapper, element);
  // set element as child of wrapper
  wrapper.appendChild(element);
  wrapper.appendChild(search_div);

  createInitialTokens(element);
  addPlaceholder(wrapper);
}

function removePlaceholder(wrapper) {
  const input_search = wrapper.querySelector(".selected-input");
  input_search.removeAttribute("placeholder");
}

function addPlaceholder(wrapper) {
  const input_search = wrapper.querySelector(".selected-input");
  const tokens = wrapper.querySelectorAll(".selected-wrapper");
  if (!tokens.length && !(document.activeElement === input_search))
    input_search.setAttribute("placeholder", "---------");
}

// Function that create the initial set of tokens with the options selected by the users
function createInitialTokens(select) {
  let { options_selected } = getOptions(select);
  const wrapper = select.parentNode;
  for (let i = 0; i < options_selected.length; i++) {
    createToken(wrapper, options_selected[i]);
  }
}

// Listener of user search
function inputChange(e) {
  const wrapper = e.target.parentNode.parentNode;
  const select = wrapper.querySelector("select");
  const dropdown = wrapper.querySelector(".dropdown-icon");

  const input_val = e.target.value;

  if (input_val) {
    dropdown.classList.add("active");
    populateAutocompleteList(select, input_val.trim());
  } else {
    dropdown.classList.remove("active");
    const event = new Event("click");
    dropdown.dispatchEvent(event);
  }
}

// Listen for clicks on the wrapper, if click happens focus on the input
function clickOnWrapper(e) {
  const wrapper = e.target;
  if (wrapper.tagName == "DIV") {
    const input_search = wrapper.querySelector(".selected-input");
    const dropdown = wrapper.querySelector(".dropdown-icon");
    if (!dropdown.classList.contains("active")) {
      const event = new Event("click");
      dropdown.dispatchEvent(event);
    }
    input_search.focus();
    removePlaceholder(wrapper);
  }
}

function openOptions(e) {
  const input_search = e.target;
  const wrapper = input_search.parentElement.parentElement;
  const dropdown = wrapper.querySelector(".dropdown-icon");
  if (!dropdown.classList.contains("active")) {
    const event = new Event("click");
    dropdown.dispatchEvent(event);
  }
  e.stopPropagation();
}

// Function that create a token inside of a wrapper with the given value
function createToken(wrapper, value) {
  const search = wrapper.querySelector(".search-container");
  // Create token wrapper
  const token = document.createElement("div");
  token.classList.add("selected-wrapper");
  const token_span = document.createElement("span");
  token_span.classList.add("selected-label");
  token_span.innerText = value;
  const close = document.createElement("a");
  close.classList.add("selected-close");
  close.setAttribute("tabindex", "-1");
  close.setAttribute("data-option", value);
  close.setAttribute("data-hits", 0);
  close.setAttribute("href", "#");
  close.innerText = "x";
  close.addEventListener("click", removeToken);
  token.appendChild(token_span);
  token.appendChild(close);
  wrapper.insertBefore(token, search);
}

// Listen for clicks in the dropdown option
function clickDropdown(e) {
  const dropdown = e.target;
  const wrapper = dropdown.parentNode.parentNode;
  const input_search = wrapper.querySelector(".selected-input");
  const select = wrapper.querySelector("select");
  dropdown.classList.toggle("active");

  if (dropdown.classList.contains("active")) {
    removePlaceholder(wrapper);
    input_search.focus();

    if (!input_search.value) {
      populateAutocompleteList(select, "", true);
    } else {
      populateAutocompleteList(select, input_search.value);
    }
  } else {
    clearAutocompleteList(select);
    addPlaceholder(wrapper);
  }
}

// Clears the results of the autocomplete list
function clearAutocompleteList(select) {
  const wrapper = select.parentNode;

  const autocomplete_list = wrapper.querySelector(".autocomplete-list");
  autocomplete_list.innerHTML = "";
}

// Populate the autocomplete list following a given query from the user
function populateAutocompleteList(select, query, dropdown = false) {
  const { autocomplete_options } = getOptions(select);

  let options_to_show;

  if (dropdown) options_to_show = autocomplete_options;
  else options_to_show = autocomplete(query, autocomplete_options);

  const wrapper = select.parentNode;
  const input_search = wrapper.querySelector(".search-container");
  const autocomplete_list = wrapper.querySelector(".autocomplete-list");
  autocomplete_list.innerHTML = "";
  const result_size = options_to_show.length;

  if (result_size == 1) {
    const li = document.createElement("li");
    li.innerText = options_to_show[0];
    li.setAttribute("data-value", options_to_show[0]);
    li.addEventListener("click", selectOption);
    autocomplete_list.appendChild(li);
    if (query.length == options_to_show[0].length) {
      const event = new Event("click");
      li.dispatchEvent(event);
    }
  } else if (result_size > 1) {
    for (let i = 0; i < result_size; i++) {
      const li = document.createElement("li");
      li.innerText = options_to_show[i];
      li.setAttribute("data-value", options_to_show[i]);
      li.addEventListener("click", selectOption);
      autocomplete_list.appendChild(li);
    }
  } else {
    const li = document.createElement("li");
    li.classList.add("not-cursor");
    li.innerText = "No options found";
    autocomplete_list.appendChild(li);
  }
}

// Listener to autocomplete results when clicked set the selected property in the select option
function selectOption(e) {
  const wrapper = e.target.parentNode.parentNode.parentNode;
  const input_search = wrapper.querySelector(".selected-input");
  const option = wrapper.querySelector(
    `select option[value="${e.target.dataset.value}"]`
  );

  option.setAttribute("selected", "");
  createToken(wrapper, e.target.dataset.value);
  if (input_search.value) {
    input_search.value = "";
  }

  input_search.focus();

  e.target.remove();
  const autocomplete_list = wrapper.querySelector(".autocomplete-list");

  if (!autocomplete_list.children.length) {
    const li = document.createElement("li");
    li.classList.add("not-cursor");
    li.innerText = "No options found";
    autocomplete_list.appendChild(li);
  }

  const event = new Event("keyup");
  input_search.dispatchEvent(event);
  e.stopPropagation();
}

// function that returns a list with the autcomplete list of matches
function autocomplete(query, options) {
  // No query passed, just return entire list
  if (!query) {
    return options;
  }
  let options_return = [];

  for (let i = 0; i < options.length; i++) {
    if (
      query.toLowerCase() === options[i].slice(0, query.length).toLowerCase()
    ) {
      options_return.push(options[i]);
    }
  }
  return options_return;
}

// Returns the options that are selected by the user and the ones that are not
function getOptions(select) {
  // Select all the options available
  const all_options = Array.from(select.querySelectorAll("option")).map(
    (el) => el.value
  );

  // Get the options that are selected from the user
  const options_selected = Array.from(
    select.querySelectorAll("option:checked")
  ).map((el) => el.value);

  // Create an autocomplete options array with the options that are not selected by the user
  const autocomplete_options = [];
  all_options.forEach((option) => {
    if (!options_selected.includes(option)) {
      autocomplete_options.push(option);
    }
  });

  autocomplete_options.sort();

  return {
    options_selected,
    autocomplete_options,
  };
}

// Listener for when the user wants to remove a given token.
function removeToken(e) {
  // Get the value to remove
  const value_to_remove = e.target.dataset.option;
  const wrapper = e.target.parentNode.parentNode;
  const input_search = wrapper.querySelector(".selected-input");
  const dropdown = wrapper.querySelector(".dropdown-icon");
  // Get the options in the select to be unselected
  const option_to_unselect = wrapper.querySelector(
    `select option[value="${value_to_remove}"]`
  );
  option_to_unselect.removeAttribute("selected");
  // Remove token attribute
  e.target.parentNode.remove();
  input_search.focus();
  dropdown.classList.remove("active");
  const event = new Event("click");
  dropdown.dispatchEvent(event);
  e.stopPropagation();
}

// Listen for 2 sequence of hits on the delete key, if this happens delete the last token if exist
function deletePressed(e) {
  const wrapper = e.target.parentNode.parentNode;
  const input_search = e.target;
  const key = e.keyCode || e.charCode;
  const tokens = wrapper.querySelectorAll(".selected-wrapper");

  if (tokens.length) {
    const last_token_x = tokens[tokens.length - 1].querySelector("a");
    let hits = +last_token_x.dataset.hits;

    if (key == 8 || key == 46) {
      if (!input_search.value) {
        if (hits > 1) {
          // Trigger delete event
          const event = new Event("click");
          last_token_x.dispatchEvent(event);
        } else {
          last_token_x.dataset.hits = 2;
        }
      }
    } else {
      last_token_x.dataset.hits = 0;
    }
  }
  return true;
}

// You can call this function if you want to add new options to the select plugin
// Target needs to be a unique identifier from the select you want to append new option for example #multi-select-plugin
// Example of usage addOption("#multi-select-plugin", "tesla", "Tesla")
function addOption(target, val, text) {
  const select = document.querySelector(target);
  let opt = document.createElement("option");
  opt.value = val;
  opt.innerHTML = text;
  select.appendChild(opt);
}

document.addEventListener("DOMContentLoaded", () => {
  // get select that has the options available
  const select = document.querySelectorAll("[data-multi-select-plugin]");
  select.forEach((select) => {
    init(select);
  });

  // Dismiss on outside click
  document.addEventListener("click", () => {
    // get select that has the options available
    const select = document.querySelectorAll("[data-multi-select-plugin]");
    for (let i = 0; i < select.length; i++) {
      if (event) {
        var isClickInside = select[i].parentElement.parentElement.contains(
          event.target
        );

        if (!isClickInside) {
          const wrapper = select[i].parentElement.parentElement;
          const dropdown = wrapper.querySelector(".dropdown-icon");
          const autocomplete_list = wrapper.querySelector(".autocomplete-list");
          //the click was outside the specifiedElement, do something
          dropdown.classList.remove("active");
          autocomplete_list.innerHTML = "";
          addPlaceholder(wrapper);
        }
      }
    }
  });
});

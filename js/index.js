// DOM Elements
var searchbox = document.getElementById("search_box");
var resultsbox = document.getElementById("results_box");
var randombutton = document.getElementById("random_button");
var content = document.getElementById("content");
var searchicon = document.getElementById("search_icon");
var clearbutton = document.getElementById("clear_button");

// Configurable Global Variables
var NUM_RESULTS = 20; // The number of search results to display
var SUMMARY_CHARS = 120; // Number of characters to show for summary
var IMG_NOT_FOUND_URL = "https://www.csw.nyc/wikipediaviewer/images/NoResultsFound.png";
var WIKIPEDIA_LOGO_URL = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/103px-Wikipedia-logo-v2.svg.png";
var UPDATE_FREQUENCY = 100; // Minimum delay between api calls while typing in search box

// Final Global Variables (Do not edit)
var RANDOM = null;
var ENTER_KEY = 13; // keyCode for enter key
var lastSearch = ""; // Prevents unnecessary duplicate API calls
var updateTimer; // Limits API calls while typing

// Event Listeners
searchbox.addEventListener("keyup", function() { update(event.keyCode); });
randombutton.addEventListener("click", searchRandomArticle);
searchicon.addEventListener("click", function() { searchbox.focus(); });
clearbutton.addEventListener("click", clearSearchBox);

// Booleans
function searchChanged() { return ((searchbox.value != lastSearch) && (searchbox.value !== "") && (searchbox.value !== null)); }
function isEnterKey(keyCode) { return keyCode == ENTER_KEY; }
function searchboxEmpty() { return searchbox.value == "" }

// Generates the Wikipedia API URL for a given search term.
function getSearchURL(title) {
  var url;
  if(title == RANDOM) {
    url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages%7Cextracts%7Cinfo&indexpageids=1&generator=random&piprop=thumbnail&pithumbsize=100&pilimit=" + NUM_RESULTS + "&exchars=" + SUMMARY_CHARS + "&exlimit=" + NUM_RESULTS + "&exintro=1&explaintext=1&inprop=url&grnnamespace=0";
  }
  else {
    url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages%7Cextracts%7Cinfo&indexpageids=1&generator=prefixsearch&piprop=thumbnail&pithumbsize=100&pilimit=" + NUM_RESULTS + "&exchars=" + SUMMARY_CHARS + "&exlimit=" + NUM_RESULTS + "&exintro=1&explaintext=1&inprop=url&gpssearch=" + title + "&gpslimit=" + NUM_RESULTS;
  }
  console.log(url);
  return url;
}

// Clears the contents of the searchbox.
function clearSearchBox() {
  searchbox.value = "";
  clearbutton.classList.add("hidden");
  clearResults();
}

// Returns a data structure 'pages' containing the title, summary, url, and image url
// for each search result.
function getSearchResults(data) {
  if(data.query === undefined) { // No search results returned from api call
    return null;
  }
  var pages = [];
  for(var i=0;i<data.query.pageids.length;i++) {
    var page = {};
    var id = data.query.pageids[i];
    var index = data.query.pages[id].index;
    page.title = data.query.pages[id].title;
    page.summary = data.query.pages[id].extract;
    page.url = data.query.pages[id].fullurl;
    if(data.query.pages[id].hasOwnProperty("thumbnail")) {
      page.img = data.query.pages[id].thumbnail.source;
    }
    else {
      page.img = WIKIPEDIA_LOGO_URL;
    }
    if(index != null) {
      pages[index-1] = page;
    }
    else {
      pages[0] = page;
    }
  }
  return pages;
}

// Takes a 'pages' data structure and displays its contents on the HTML page.
function displaySearchResults(pages) {
  clearResults();
  if(pages === null) {
    addResultsNotFound();
    return false;
  }
  for(var i=0;i<pages.length;i++) {
    addResult(pages[i].title, pages[i].summary, pages[i].url, pages[i].img);
  }
}

function addResultsNotFound() {
  var titleClasses = "article-title not-found";
  newResult = "";
  newResult += '<div class="result" style="cursor: default">';
  newResult += '<img src=' + IMG_NOT_FOUND_URL + ' style="border:none">';
  newResult += '<span class="' + titleClasses + '">';
  newResult += "No Results Found.";
  newResult += '</span>';
  newResult += '</div>';
  resultsbox.innerHTML += newResult;
}

// Adds a single result to the results box.  This is a helper function
// for displayResults
function addResult(title, text, url, imgurl) {
  var titleClasses = "article-title";
  if(title.length > 35) { titleClasses += " long"; }
  newResult = "";
  newResult += '<div class="result">';
  newResult += '<a href=' + url + ' target="_blank">'; 
  newResult += '<img src=' + imgurl + '>';
  newResult += '<span class="' + titleClasses + '">';
  newResult += title;
  newResult += '</span>';
  newResult += '<p>' + text + '</p>';
  newResult += '</a>';
  newResult += '</div>';
  resultsbox.innerHTML += newResult;
}

// Clears the results list on the HTML page.
function clearResults() {
  resultsbox.innerHTML = "";
}

/* The main function to be called whenever the searchbox  
 * is modified.  This uses a global variable & boolean to make sure no
 * duplicate API calls are made, and a timer to prevent unnecessary API
 * calls while typing. */
function update(keyCode) {
  if(searchboxEmpty()) {
    clearbutton.classList.add("hidden");
    clearResults();
  } else {
    clearbutton.classList.remove("hidden");
  }
  
  if(isEnterKey(keyCode)) { // enter key pressed, force a search
    searchbox.blur(); // Remove focus from searchbox to hide on-screen keyboard
    clearTimeout(updateTimer);
    search();
  } else if(searchChanged()) {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(search, UPDATE_FREQUENCY);
  }
}

/* This function is called when we are performing an API call.  It contains
 * all the necessary logic to get the results, and display them on the page. */
function search() {
  lastSearch = searchbox.value;
  var title = searchbox.value;
  var url = getSearchURL(title);
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      var pages = getSearchResults(data);
      displaySearchResults(pages);
    } else {
      console.error("Error: status " + request.status);
    }
  };
  request.onerror = function() {
    console.error("Connection error.");
  };
  request.send();
}

function searchRandomArticle() {
  lastSearch = "";
  var url = getSearchURL(RANDOM);
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      var pages = getSearchResults(data);
      displaySearchResults(pages);
    } else {
      console.error("Error: status " + request.status);
    }
  };
  request.onerror = function() {
    console.error("Connection error.");
  };
  request.send();
}
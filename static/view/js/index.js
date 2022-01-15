'use strict';

(function () {

var CONST_NAME = 'Knowiki';
var env = {};
env.ui = {};
env.url = './md/index.md';

/* functions:
 - loadScript(path) -> Promise
 - text(str) -> Element::TextNode
 - buildHeader()
 - buildContents()
 - ajax(url) -> Promise<text, code>
 - loadMarkdown(path)
 - onHashChange()
 */
function loadScript(path) {
   return new Promise(function (r, e) {
      function _load(evt) {
         console.log('ok', path);
         evt.target.removeEventListener('load', _load);
         r();
      }
      function _error(evt) {
         console.log('err', path);
         evt.target.removeEventListener('error', _error);
         e();
      }
      var script = document.createElement('script');
      script.src = path;
      script.addEventListener('load', _load);
      script.addEventListener('error', _error);
      document.body.append(script);
   });
}

function text(str) {
   return document.createTextNode(str);
}

function buildHeader() {
   var header = document.createElement('header');
   var div = document.createElement('div');
   div.className = 'header';
   var nav = document.createElement('nav');
   div.appendChild(nav);
   var elem = document.createElement('a');
   elem.href = '#';
   elem.appendChild(text(CONST_NAME));
   nav.appendChild(elem);
   header.appendChild(div);
   document.body.appendChild(header);
   env.ui.header = header;
}

function buildContents() {
   var content = document.createElement('div');
   content.className = 'content';
   var div = document.createElement('div');
   content.appendChild(div);
   document.body.appendChild(content);
   env.ui.content = div;
}

function ajax(url) {
   return new Promise(function (r, e) {
      var xhr = new XMLHttpRequest(), payload = null;
      xhr.open('GET', url, true);
      xhr.addEventListener('readystatechange', function (evt) {
         if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
            if (~~(evt.target.status / 100) === 2) {
               return r(evt.target.response);
            } else {
               return e(evt.target.status);
            }
         }
      });
      xhr.send();
   });
}

function loadMarkdown(path) {
   ajax(path).then(function (text) {
      env.ui.content.innerHTML = env.md.render(text);
   }, function () {
      env.ui.content.innerHTML = '[!] Cannot load markdown file';
   });
}

function onHashChange() {
   if (!env._registered_onHashChange) {
      env._registered_onHashChange = true;
      window.addEventListener('hashchange', onHashChange);
   }
   var hash = window.location.hash || '';
   if (hash.charAt(0) !== '#' || hash === '#/' || hash === '#') {
      hash = '#/index.md';
   }
   var cmd = hash.charAt(1);
   switch(cmd) {
   case '/':
      if (hash.charAt(hash.length-1) === '/') {
         hash += 'index.md';
      }
      loadMarkdown('./md' + hash.substring(1).split('/../').join('/'));
      break;
   case '?':
      env.ui.content.innerHTML = '[!] search: not implemented yet';
      break;
   default:
      env.ui.content.innerHTML = '[!] invalid URL';
   }
}

Promise.all([
   loadScript('./js/markdown-it.min.js')
]).then(function () {
   buildHeader();
   buildContents();
   env.md = new window.markdownit({ html: true, });
   onHashChange();
}, function (err) {
   console.log(err);
});

})();

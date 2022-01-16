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
   elem.href = '/';
   elem.appendChild(text(CONST_NAME));
   nav.appendChild(elem);

   var ul = document.createElement('ul');
   ul.className = 'header-nav'
   elem = document.createElement('li');
   var a = document.createElement('a');
   a.href = 'search.html';
   a.appendChild(text('Search'));
   elem.appendChild(a);
   ul.appendChild(elem);
   nav.appendChild(ul);

   header.appendChild(div);
   document.body.appendChild(header);
   env.ui.header = header;
}

function buildContents() {
   var content = document.createElement('div');
   content.className = 'content preview';
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

function onHashChange() {
   if (!env._registered_onHashChange) {
      env._registered_onHashChange = true;
      window.addEventListener('hashchange', onHashChange);
   }
   env.ui.content.innerHTML = '[!] not implemented yet.';
}

Promise.all([
]).then(function () {
   buildHeader();
   buildContents();
   onHashChange();
}, function (err) {
   console.log(err);
});

})();

'use strict';

(function () {

var CONST_NAME = 'Knowiki';
var env = {};
env.ui = {};
env.url = './md/index.md';

/* functions:
 - loadScript(path) -> Promise
 - text(str) -> Element::TextNode
 - empty(Element)
 - buildHeader()
 - buildContents()
 - buildSearchBox()
 - buildSearchResults(items)
 - doChangeHash()
 - doSearch()
 - ajax(url, opt) -> Promise<text, code>
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

function empty(elem) {
   while (elem.children.length) elem.removeChild(elem.children[0]);
   elem.innerHTML = '';
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

   var sbdiv = document.createElement('div');
   sbdiv.className = 'search-box';
   var sbinput = document.createElement('input');
   sbdiv.appendChild(sbinput);
   var sbbtn = document.createElement('button');
   sbbtn.appendChild(text('Search'));
   sbdiv.appendChild(sbbtn);
   div.appendChild(sbdiv);
   var srdiv = document.createElement('div');
   div.appendChild(srdiv);
   sbinput.addEventListener('keypress', function (evt) {
      if (evt.key === 'Enter') {
         evt.preventDefault();
         doChangeHash();
      }
   });
   sbbtn.addEventListener('click', function (evt) {
      doChangeHash();
   });
   env.ui.sbinput = sbinput;
   env.ui.sbbtn = sbbtn;
   env.ui.srdiv = srdiv;

   document.body.appendChild(content);
   env.ui.content = div;
   sbinput.focus();
}

function buildSearchResults(L) {
   L.forEach(function (item) {
      var p = document.createElement('p');
      var a = document.createElement('a');
      a.href = '/#' + item.p;
      a.appendChild(text((item.t || '') + (' [ ' + item.p + ' ]')));
      p.appendChild(a);
      env.ui.srdiv.appendChild(p);
   });
}

function doChangeHash() {
   if (!env.ui.sbinput.value.length) {
      env.ui.sbinput.focus();
      return;
   }
   window.location.hash = '#?q=' + encodeURIComponent(env.ui.sbinput.value);
}

function doSearch() {
   var hash = window.location.hash;
   empty(env.ui.srdiv);
   if (!hash || hash === '#') return;
   if (hash.charAt(1) !== '?') return;
   var obj = {};
   hash.substring(2).split('&').forEach(function (keyval) {
      var i = keyval.indexOf('=');
      if (i < 0) {
         obj[keyval] = '';
      } else {
         obj[decodeURIComponent(keyval.substring(0, i))] = decodeURIComponent(keyval.substring(i+1));
      }
   });
   env.ui.sbinput.value = obj.q;
   if (!obj.q) return;
   env.ui.srdiv.appendChild(text('searching for '));
   var elem = document.createElement('mark');
   elem.appendChild(text(obj.q));
   env.ui.srdiv.appendChild(elem);
   env.ui.srdiv.appendChild(text(' ...'));

   ajax('/api/search', {
      method: 'POST',
      json: { q: obj.q, n: obj.n || '20' },
   }).then(function (data) {
      empty(env.ui.srdiv);
      try {
         var L = JSON.parse(data);
         if (!L.length) {
            env.ui.srdiv.appendChild(text('(nothing found)'));
            return;
         }
         L = L.sort(function(a, b) {
            if (b.s === a.s) {
               if (b.p > a.p) return -1;
               if (b.p < a.p) return 1;
            }
            return b.s - a.s;
         });
         buildSearchResults(L);
      } catch (err) {
         env.ui.srdiv.appendChild(text('[!] error occurred.'));
      }
   }, function () {
      empty(env.ui.srdiv);
      env.ui.srdiv.appendChild(text('[!] error occurred.'));
   });
}

function ajax(url, opt) {
   return new Promise(function (r, e) {
      var xhr = new XMLHttpRequest(), payload = null;
      opt = opt || {};
      xhr.open(opt.method || 'GET', url, true);
      xhr.addEventListener('readystatechange', function (evt) {
         if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
            if (~~(evt.target.status / 100) === 2) {
               return r(evt.target.response);
            } else {
               return e(evt.target.status);
            }
         }
      });
      var payload = null;
      if (opt.headers) {
         Object.keys(opt.headers).forEach(function (key) {
            if (!opt.headers[key]) return;
            xhr.setRequestHeader(key, opt.headers[key]);
         });
      }
      if (opt.json) {
         xhr.setRequestHeader(
            "Content-Type", "application/json;charset=UTF-8"
         );
         payload = JSON.stringify(opt.json);
      } else if (opt.raw) {
         payload = opt.raw;
      }
      xhr.send(payload);
   });
}

function onHashChange() {
   if (!env._registered_onHashChange) {
      env._registered_onHashChange = true;
      window.addEventListener('hashchange', onHashChange);
   }
   doSearch();
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

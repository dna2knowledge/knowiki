'use strict';

(function () {

var CONST_NAME = 'Knowiki';
var env = {};
env.ui = {};
window._debug = env;

/* functions:
 - loadScript(path) -> Promise
 - text(str) -> Element::TextNode
 - empty(Element)
 - rem2px(num)
 - buildHeader()
 - buildContents()
 - ajax(url) -> Promise<text, code>
 - loadMarkdown(path)
 - buildMarkdownEditor()
 - loadMarkdownEditor(relativePath)
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

function rem2px(rem) {
   return rem * parseFloat(
      getComputedStyle(document.documentElement).fontSize
   );
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

function loadMarkdown(path) {
   return new Promise(function (r, e) {
      ajax(path).then(function (text) {
         r(text);
      }, function () {
         e('[!] Cannot load markdown file');
      });
   });
}

function buildMarkdownEditor() {
   empty(env.ui.content);
   var elem;
   var ui = {};
   env.ui.editor = ui;

   var div = document.createElement('div');
   elem = document.createElement('button');
   elem.appendChild(text('source'));
   div.appendChild(elem);
   elem.addEventListener('click', function () {
      env.ui.editor.editor.style.display = 'block';
      env.ui.editor.preview.style.display = 'none';
      env.ui.editor.code.style.height = (
         window.innerHeight - env.ui.editor.code.offsetTop - rem2px(2)
      ) + 'px';
      empty(env.ui.editor.preview);
   });
   elem = document.createElement('button');
   elem.appendChild(text('preview'));
   div.appendChild(elem);
   elem.addEventListener('click', function () {
      env.ui.editor.preview.innerHTML = env.md.render(env.ui.editor.code.value);
      env.ui.editor.editor.style.display = 'none';
      env.ui.editor.preview.style.display = 'block';
   });
   div.appendChild(document.createElement('br'));
   elem = document.createElement('button');
   elem.appendChild(text('save'));
   div.appendChild(elem);
   elem.addEventListener('click', function (evt) {
      var btn = evt.target;
      btn.classList.add('disabled');
      ajax('/api/write', {
         method: 'POST',
         json: { path: env.target, md: env.ui.editor.code.value }
      }).then(function () {
         alert('saved');
         btn.classList.remove('disabled');
      }, function () {
         alert('cannot save');
         btn.classList.remove('disabled');
      });
   });
   env.ui.content.appendChild(div);

   var editor = document.createElement('div');
   editor.className = 'editor';
   elem = document.createElement('pre');
   editor.appendChild(elem);
   var code = document.createElement('textarea');
   elem.appendChild(code);
   ui.editor = editor;
   ui.code = code;
   env.ui.content.appendChild(editor);
   code.style.minWidth = code.offsetWidth + 'px';
   code.style.maxWidth = code.style.minWidth;
   code.style.height = (window.innerHeight - code.offsetTop - rem2px(2)) + 'px';

   var preview = document.createElement('div');
   preview.className = 'preview';
   preview.style.display = 'none';
   ui.preview = preview;
   env.ui.content.appendChild(preview);
}

function loadMarkdownEditor(path) {
   var prefix = './view/md';
   env.target = path;

   if (!env.ui.editor) buildMarkdownEditor();

   loadMarkdown(prefix + path).then(function (text) {
      env.ui.editor.code.value = text;
      env.ui.editor.preview.innerHTML = env.md.render(text);
   }, function (err) {
      console.error(path, err);
      env.ui.editor.code.value = '';
      env.ui.editor.preview.innerHTML = '';
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
      loadMarkdownEditor(hash.substring(1).split('/../').join('/'));
      break;
   case '?':
      env.ui.content.innerHTML = '[!] search: not implemented yet';
      break;
   default:
      env.ui.content.innerHTML = '[!] invalid URL';
   }
}

Promise.all([
   loadScript('./view/js/markdown-it.min.js')
]).then(function () {
   buildHeader();
   buildContents();
   env.md = new window.markdownit({ html: true, });
   onHashChange();
}, function (err) {
   console.log(err);
});

})();

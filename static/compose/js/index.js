'use strict';

(function () {

var CONST_NAME = 'Knowiki';
var ui = {};

function loadScript(path) {
   return new Promise(function (r, e) {
      function _load(evt) {
         console.log(evt, 'ok', path);
         evt.target.removeEventListener('load', _load);
         r();
      }
      function _error(evt) {
         console.log(evt, 'error', path);
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
   ui.header = header;
}

function buildContents() {
   var content = document.createElement('div');
   content.className = 'content';
   var div = document.createElement('div');
   content.appendChild(div);
   document.body.appendChild(content);
   ui.content = div;
}

Promise.all([
   loadScript('../local/markdown-it.js')
]).then(function () {
   buildHeader();
   buildContents();
   var md = new window.markdownit({ html: true,  });
   var div = document.createElement('div');
   ui.content.innerHTML = md.render(
      '<!--#test -->\n' +
      '# Test\n\n- test\n- test2\n' +
      '<div>test</div>\n' +
      '<script>alert(1) /* not work */</script>\n\n' +
      '| tab1 | tab2 |\n' +
      '|------|-----:|\n' +
      '| 1    |    2 |\n' +
      '| 2    |    3 |\n'
   );
   document.body.appendChild(div);
}, function (err) {
   console.log(err);
});

})();

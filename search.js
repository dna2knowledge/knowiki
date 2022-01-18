const i_fs = require('fs');
const i_path = require('path');

const QUEUE_MAX = 10;
const queue = [];

const TEXT_TITLE = /^# (.*)$/;
class Grep {
   constructor(path, mode) {
      this.base = path;
      this.actor = 2;
      this.mode = mode || 'exact';
   }

   score(query, text) {
      switch(this.mode) {
      case 'exact':
         if (!text) return 0;
         return text.split(query).length - 1;
      case 'regexp':
         const obj = {};
         try {
            const regexp = new RegExp(query);
            return text.split(regexp).length - 1;
         } catch(err) {
            return 0;
         }
      }
      return 0;
   }

   async act() {
      if (this.actor <= 0) return;
      const task = queue.shift();
      if (task.canceled) return _next(this);
      if (!task.q) return _next(this);
      task.n = parseInt(task.n || '20', 10);
      this.actor ++;
      const rs = [];
      const Lf = [this.base + i_path.sep];
      try {
         while (Lf.length) {
            if (task.canceled) break;
            const one = Lf.shift();
            if (one.endsWith(i_path.sep)) {
               const items = await _readdir(one);
               for (let i = items.length - 1; i >= 0; i--) {
                  if (task.canceled) break;
                  const subone = items[i];
                  const subpath = i_path.join(one, subone);
                  const stat = await _lstat(subpath);
                  if (stat.isDirectory()) {
                     Lf.unshift(subpath + i_path.sep);
                  } else if (stat.isFile() && subpath.endsWith('.md')) {
                     // only for *.md files
                     Lf.unshift(subpath);
                  } // stat.(others) -> do nothing
               }
            } else {
               const text = (await _readfile(one)).toString();
               const score = this.score(task.q, text)
               if (score > 0) {
                  const first_line = text.split('\n')[0];
                  const title_match = TEXT_TITLE.exec(first_line);
                  rs.push({
                     p: one.substring(this.base.length),
                     t: title_match?title_match[1]:undefined,
                     s: score,
                  });
                  if (rs.length >= task.n) break;
               }
            }
         }
         task._res.end(JSON.stringify(rs));
      } catch (err) {
         e500(task._res);
      } finally {
         this.actor --;
         _next(this);
      }

      async function _readdir(path) {
         return new Promise((r, e) => {
            i_fs.readdir(path, (err, items) => {
               if (err) return e(err);
               r(items);
            });
         });
      }
      async function _lstat(path) {
         return new Promise((r, e) => {
            i_fs.lstat(path, (err, stat) => {
               if (err) return e(err);
               r(stat);
            });
         });
      }
      async function _readfile(path) {
         return new Promise((r, e) => {
            i_fs.readFile(path, (err, buf) => {
               if (err) return e(err);
               r(buf);
            });
         });
      }

      function _next(self) {
         if (!queue.length) return;
         return self.act();
      }
   }
}

function readRequestBinary(req) {
   return new Promise((r, e) => {
      let body = [];
      req.on('data', (chunk) => { body.push(chunk); });
      req.on('end', () => {
         body = Buffer.concat(body);
         r(body);
      });
      req.on('error', e);
   });
}
function e400(res, text) {
   res.writeHead(400, text || 'Bad Request');
   res.end();
}
function e429(res, text) {
   res.writeHead(429, text || 'Too Many Requests');
   res.end();
}
function e500(res, text) {
   res.writeHead(500, text || 'Internal Error');
   res.end();
}

const env = {
   grep: null, // new Grep(path)
};

const api = {
   autocomplete: (req, res, opt) => {
      res.end('[!] not implemented yet.');
   }, // autocomplete
   search: async (req, res, opt) => {
      if (queue.length > QUEUE_MAX) {
         return e429(res);
      }
      if (!env.grep) {
         return e500(res);
      }
      const obj = {};
      req.on('close', () => {
         obj.canceled = true;
      });
      try {
         Object.assign(obj, JSON.parse(await readRequestBinary(req)));
      } catch(err) {
         return e400(res);
      }
      if (!obj.q) return e400(res);
      obj._res = res;
      queue.push(obj);
      env.grep.act();
   },
};

module.exports = {
   Grep,
   api,
   env,
};

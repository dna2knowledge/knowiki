# knowiki
knowledge wiki over git

### how to use

```
TINY_DEBUG=1 \
TINY_STATIC_DIR=./static \
KNOWIKI_MDDIR=./static/view/md \
node compose.js
# open http://127.0.0.1:8081
# goto http://127.0.0.1:8081/#/path/to/file.md

TINY_DEBUG=1 \
TINY_STATIC_DIR=./static/view \
node view.js
# open http://127.0.0.1:8080
# goto http://127.0.0.1:8080/#/path/to/file.md
```

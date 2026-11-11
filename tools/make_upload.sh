#!/bin/sh
# Packs only the public site files into sportcraft-site.zip, ready to upload to the host.
# (Leaves out products.csv, tools/ and anything else customers shouldn't see.)
cd "$(dirname "$0")/.." || exit 1
rm -f sportcraft-site.zip
zip -rqX sportcraft-site.zip index.html styles.css app.js config.js data images -x '*.DS_Store'
echo "Made sportcraft-site.zip ($(du -h sportcraft-site.zip | cut -f1))"

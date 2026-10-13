#!/bin/sh
# Copies vite's index.html to the Frappe www page, stamping every bundle URL with ?v=<build time>.
# The bundle name does not always change between builds and the assets are served with max-age=3600:
# the kitchen screens kept running the previous build (13-10-2026).
set -e
STAMP=$(date +%s)
sed "s#\(/assets/ury/mosaic/assets/[^\"']*\)#\1?v=${STAMP}#g" ../ury/public/mosaic/index.html > ../ury/www/mosaic.html

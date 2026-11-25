#!/bin/bash

# replace splitio-commons imports to use ES modules
replace '@splitsoftware/splitio-commons/src' '@splitsoftware/splitio-commons/esm' ./es -r || exit 1

# Mark the ES build as native ESM so Node.js loads es/**/*.js as ES modules
echo '{ "type": "module" }' > ./es/package.json || exit 1

exit 0

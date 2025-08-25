#!/bin/bash

# replace splitio-commons imports to use ES modules
replace '@splitsoftware/splitio-commons/src' '@splitsoftware/splitio-commons/esm' ./es -r

# Fix import extension in es/index.js
sed -i '' -e "s|from './lib/js-split-provider'|from './lib/js-split-provider.js'|" es/index.js

if [ $? -eq 0 ]
then
  exit 0
else
  exit 1
fi

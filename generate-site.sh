#!/usr/bin/env bash
echo Compiling site code
tsc --p site-tsconfig.json
echo Compiling site genertator code
tsc --p site-generator-tsconfig.json
echo running site genertator
node tsc-output/site-generator.js
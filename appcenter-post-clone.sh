#!/usr/bin/env bash

echo "appcenter-post-clone script running:"

# NOTE: this is a 2nd yarn install that is needed to overcome a bug
# related to loading a remote git+ branch as a dependency in package.json
yarn install
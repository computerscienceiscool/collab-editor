#!/bin/bash

# fail on any error
set -e

# set environment variables
# . ./local/.env

# show environment variables
# printenv

# start the application
# XXX this is probably excessive and will take a while, could be optimized
make build
make dev-all

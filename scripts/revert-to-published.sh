#!/bin/bash

# Revert to the last published version (main branch)
cd /vercel/share/v0-project

# Fetch latest from remote to ensure we have the published version
git fetch origin main

# Reset to the last published version on main branch
git reset --hard origin/main

echo "Successfully reverted to last published version"

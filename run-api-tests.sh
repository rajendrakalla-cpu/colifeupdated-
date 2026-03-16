#!/bin/bash
# Source .env file
set -a
source /Users/rajendrakalla/colife/colife/.env
set +a

export TEST_BASE_URL="https://colifeupdated.vercel.app"

cd /Users/rajendrakalla/colife/colife

echo "Starting API tests at $(date)" > /Users/rajendrakalla/colife/colife/test-output.txt

# Run API tests
node_modules/.bin/playwright test tests/api/ --project=api --reporter=line --no-deps 2>&1 >> /Users/rajendrakalla/colife/colife/test-output.txt

echo "API tests exit code: $?" >> /Users/rajendrakalla/colife/colife/test-output.txt
echo "Finished at $(date)" >> /Users/rajendrakalla/colife/colife/test-output.txt

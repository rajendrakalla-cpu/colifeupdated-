#!/bin/zsh
export DATABASE_URL="postgresql://neondb_owner:npg_HnjVKM6U2TyQ@ep-cool-unit-a1ggpaa9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export JWT_SECRET="f2090352869d92ac915aafb31452aba0dfe8f41dbc61df409c8657b03bbb6f66"
export TEST_BASE_URL="https://colifeupdated.vercel.app"

OUTFILE="/Users/rajendrakalla/colife/colife/test-run-output.txt"
cd /Users/rajendrakalla/colife/colife

echo "=== Test Run Started at $(date) ===" > "$OUTFILE"

echo "" >> "$OUTFILE"
echo "=== Step 1: Global Setup ===" >> "$OUTFILE"
node_modules/.bin/tsx tests/global-setup.ts >> "$OUTFILE" 2>&1
if [ $? -eq 0 ]; then
    echo "SETUP: SUCCESS" >> "$OUTFILE"
else
    echo "SETUP: FAILED" >> "$OUTFILE"
fi

echo "" >> "$OUTFILE"
echo "=== Step 2: API Tests ===" >> "$OUTFILE"
node_modules/.bin/playwright test tests/api/ --project=api --reporter=line >> "$OUTFILE" 2>&1
API_CODE=$?
echo "API_EXIT_CODE: $API_CODE" >> "$OUTFILE"

echo "" >> "$OUTFILE"
echo "=== Step 3: UI Tests ===" >> "$OUTFILE"
node_modules/.bin/playwright test tests/ui/ --project=ui --reporter=line >> "$OUTFILE" 2>&1
UI_CODE=$?
echo "UI_EXIT_CODE: $UI_CODE" >> "$OUTFILE"

echo "" >> "$OUTFILE"
echo "=== Step 4: Global Teardown ===" >> "$OUTFILE"
node_modules/.bin/tsx tests/global-teardown.ts >> "$OUTFILE" 2>&1
if [ $? -eq 0 ]; then
    echo "TEARDOWN: SUCCESS" >> "$OUTFILE"
else
    echo "TEARDOWN: FAILED" >> "$OUTFILE"
fi

echo "" >> "$OUTFILE"
echo "=== Test Run Completed at $(date) ===" >> "$OUTFILE"
echo "SCRIPT_DONE" >> "$OUTFILE"

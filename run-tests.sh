#!/bin/bash
set -e
export TEST_BASE_URL="https://colifeupdated.vercel.app"
export DATABASE_URL="postgresql://neondb_owner:npg_HnjVKM6U2TyQ@ep-cool-unit-a1ggpaa9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export JWT_SECRET="f2090352869d92ac915aafb31452aba0dfe8f41dbc61df409c8657b03bbb6f66"

RESULTS_DIR="/Users/rajendrakalla/colife/colife"

echo "=== GLOBAL SETUP ===" > "${RESULTS_DIR}/test-run-output.txt" 2>&1
node_modules/.bin/tsx tests/global-setup.ts >> "${RESULTS_DIR}/test-run-output.txt" 2>&1 && echo "GLOBAL SETUP: SUCCESS" >> "${RESULTS_DIR}/test-run-output.txt" || echo "GLOBAL SETUP: FAILED" >> "${RESULTS_DIR}/test-run-output.txt"

echo "" >> "${RESULTS_DIR}/test-run-output.txt"
echo "=== API TESTS ===" >> "${RESULTS_DIR}/test-run-output.txt"
node_modules/.bin/playwright test tests/api/ --project=api --reporter=line >> "${RESULTS_DIR}/test-run-output.txt" 2>&1
API_EXIT=$?
echo "API_TESTS_EXIT_CODE: ${API_EXIT}" >> "${RESULTS_DIR}/test-run-output.txt"

echo "" >> "${RESULTS_DIR}/test-run-output.txt"
echo "=== UI TESTS ===" >> "${RESULTS_DIR}/test-run-output.txt"
node_modules/.bin/playwright test tests/ui/ --project=ui --reporter=line >> "${RESULTS_DIR}/test-run-output.txt" 2>&1
UI_EXIT=$?
echo "UI_TESTS_EXIT_CODE: ${UI_EXIT}" >> "${RESULTS_DIR}/test-run-output.txt"

echo "" >> "${RESULTS_DIR}/test-run-output.txt"
echo "=== GLOBAL TEARDOWN ===" >> "${RESULTS_DIR}/test-run-output.txt"
node_modules/.bin/tsx tests/global-teardown.ts >> "${RESULTS_DIR}/test-run-output.txt" 2>&1 && echo "GLOBAL TEARDOWN: SUCCESS" >> "${RESULTS_DIR}/test-run-output.txt" || echo "GLOBAL TEARDOWN: FAILED" >> "${RESULTS_DIR}/test-run-output.txt"

echo "DONE" >> "${RESULTS_DIR}/test-run-output.txt"

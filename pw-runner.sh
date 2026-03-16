#!/bin/zsh
export DATABASE_URL="postgresql://neondb_owner:npg_HnjVKM6U2TyQ@ep-cool-unit-a1ggpaa9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export JWT_SECRET="f2090352869d92ac915aafb31452aba0dfe8f41dbc61df409c8657b03bbb6f66"
export TEST_BASE_URL="https://colifeupdated.vercel.app"
cd /Users/rajendrakalla/colife/colife

# Run API tests with JSON reporter
/Users/rajendrakalla/colife/colife/node_modules/.bin/playwright test tests/api/ --project=api --reporter=json 2>/dev/null 1>/Users/rajendrakalla/colife/colife/api-results.json
echo "api_exit:$?" >> /Users/rajendrakalla/colife/colife/pw-status.txt

/Users/rajendrakalla/colife/colife/node_modules/.bin/playwright test tests/ui/ --project=ui --reporter=json 2>/dev/null 1>/Users/rajendrakalla/colife/colife/ui-results.json
echo "ui_exit:$?" >> /Users/rajendrakalla/colife/colife/pw-status.txt

echo "done" >> /Users/rajendrakalla/colife/colife/pw-status.txt

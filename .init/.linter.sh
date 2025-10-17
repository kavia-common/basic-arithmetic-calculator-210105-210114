#!/bin/bash
cd /home/kavia/workspace/code-generation/basic-arithmetic-calculator-210105-210114/react_js_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


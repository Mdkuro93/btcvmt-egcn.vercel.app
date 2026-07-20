const fs = require('fs');
let code = fs.readFileSync('src/utils/workflowEngine.ts', 'utf8');
code = code.replace(/    \}     if \(app\.currentStep === 'GD6_Cho_BG_Khach'.*?\n  \}\n\};\n?/s, '    }\n\n    return { success: true, nextStep: finalStep };\n  }\n};\n');
fs.writeFileSync('src/utils/workflowEngine.ts', code);

#!/usr/bin/env node

/**
 * Compile Validation Script
 * 
 * Validates that the entire TypeScript project compiles without errors.
 * Uses the project's tsconfig.json to ensure all dependencies and imports are resolved.
 * Runs BEFORE unit/component/e2e tests to catch compile-time errors early.
 * 
 * Usage: node scripts/validate-compile.js
 */

const { execSync } = require('child_process');

function main() {
  console.log('🔍 TypeScript Compile Validation\n');
  console.log('Running full project TypeScript compilation check...\n');

  try {
    const output = execSync('npx tsc --noEmit', {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    console.log('✅ Compilation successful!\n');
    console.log('Ready to run unit/component/e2e tests.\n');
    process.exit(0);
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : error.stderr ? error.stderr.toString() : error.message;
    
    // Count errors
    const errorLines = output
      .split('\n')
      .filter(line => line.includes('error TS'));

    console.log('❌ TypeScript compilation failed!\n');
    console.log('Errors Found:');
    console.log('='.repeat(70));
    
    // Show all error lines
    errorLines.forEach(line => {
      const cleaned = line.trim();
      if (cleaned) console.log(`  ${cleaned}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log(`\n🔴 FAILED: ${errorLines.length} compile error(s)\n`);
    console.log('Fix compile errors before running tests.\n');
    
    process.exit(1);
  }
}

main();

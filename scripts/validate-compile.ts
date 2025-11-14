#!/usr/bin/env node

/**
 * Compile Validation Script
 * 
 * Validates that all pages, components, and hooks compile without TypeScript errors.
 * Runs BEFORE unit/component/e2e tests to catch compile-time errors early.
 * 
 * This prevents cascading runtime errors where:
 * 1. Import errors hide in dev server
 * 2. Tests can't run because code won't compile
 * 3. Runtime errors only appear in browser console
 * 
 * Usage: npm run validate:compile
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface CompileCheckConfig {
  name: string;
  pattern: string;
  description: string;
}

const COMPILE_CHECKS: CompileCheckConfig[] = [
  {
    name: 'Pages',
    pattern: 'src/app/**/*.tsx',
    description: 'Next.js pages',
  },
  {
    name: 'Dashboard Components',
    pattern: 'src/components/dashboard/**/*.tsx',
    description: 'Dashboard-specific components',
  },
  {
    name: 'Field Components',
    pattern: 'src/components/fields/**/*.tsx',
    description: 'Reusable field components',
  },
  {
    name: 'Hooks',
    pattern: 'src/lib/hooks/**/*.ts',
    description: 'Custom React hooks',
  },
  {
    name: 'Chains',
    pattern: 'src/lib/chains/**/*.ts',
    description: 'CodeUChain orchestration chains',
  },
  {
    name: 'API Clients',
    pattern: 'src/lib/api/**/*.ts',
    description: 'API client implementations',
  },
  {
    name: 'Types',
    pattern: 'src/lib/types/**/*.ts',
    description: 'TypeScript type definitions',
  },
];

async function runCompileCheck(check: CompileCheckConfig): Promise<{
  success: boolean;
  errors: number;
  warnings: number;
  output: string;
}> {
  const cmd = `npx tsc --noEmit "${check.pattern}" 2>&1`;

  try {
    const { stdout, stderr } = await execAsync(cmd);
    const output = stdout + stderr;

    // Count errors (lines starting with "error TS")
    const errorCount = (output.match(/error TS\d+:/g) || []).length;
    // Count warnings (lines starting with "warning TS")
    const warningCount = (output.match(/warning TS\d+:/g) || []).length;

    return {
      success: errorCount === 0,
      errors: errorCount,
      warnings: warningCount,
      output,
    };
  } catch (error: any) {
    const output = error.stdout + (error.stderr || '');
    const errorCount = (output.match(/error TS\d+:/g) || []).length;
    const warningCount = (output.match(/warning TS\d+:/g) || []).length;

    return {
      success: errorCount === 0,
      errors: errorCount,
      warnings: warningCount,
      output,
    };
  }
}

async function main() {
  console.log('🔍 TypeScript Compile Validation\n');
  console.log('Checking all pages, components, and hooks for compile errors...\n');

  const results: { check: CompileCheckConfig; result: Awaited<ReturnType<typeof runCompileCheck>> }[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  // Run all checks sequentially
  for (const check of COMPILE_CHECKS) {
    process.stdout.write(`  ⏳ ${check.name.padEnd(20)} (${check.description}) ... `);
    const result = await runCompileCheck(check);
    results.push({ check, result });

    if (result.success) {
      console.log('✅');
    } else {
      console.log(`❌ ${result.errors} error(s)`);
      totalErrors += result.errors;
    }

    totalWarnings += result.warnings;
  }

  console.log('\n' + '='.repeat(70));
  console.log('Summary:');
  console.log('='.repeat(70));

  // Show details for failed checks
  const failedChecks = results.filter(r => !r.result.success);

  if (failedChecks.length > 0) {
    console.log(`\n❌ ${failedChecks.length} category(ies) with compile errors:\n`);

    for (const { check, result } of failedChecks) {
      console.log(`\n📁 ${check.name} (${result.errors} error${result.errors !== 1 ? 's' : ''})`);
      console.log('-'.repeat(70));

      // Extract and display first few errors
      const errorLines = result.output
        .split('\n')
        .filter(line => line.includes('error TS'));

      errorLines.slice(0, 5).forEach(line => {
        // Clean up the error line for display
        const cleaned = line
          .replace(/^src\//, '')
          .replace(/\(\d+,\d+\):/, '')
          .trim();
        console.log(`  ${cleaned}`);
      });

      if (errorLines.length > 5) {
        console.log(`  ... and ${errorLines.length - 5} more error(s)`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n🔴 FAILED: ${totalErrors} compile error(s) found\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ All checks passed! (${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''})`);
    console.log('\nReady to run unit/component/e2e tests.\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error running compile validation:', err);
  process.exit(1);
});

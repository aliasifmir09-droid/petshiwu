#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Validates bundle sizes and performance metrics against defined budgets
 * 
 * Usage:
 *   node scripts/performance-budget.js
 * 
 * Exit codes:
 *   0 - All budgets met
 *   1 - One or more budgets exceeded
 */

const fs = require('fs');
const path = require('path');

// Performance budgets (in bytes)
const BUDGETS = {
  // Frontend bundle sizes
  'frontend/dist/assets/index.js': 500 * 1024, // 500 KB
  'frontend/dist/assets/index.css': 100 * 1024, // 100 KB
  
  // Total bundle size (all JS files)
  'frontend/dist/assets/*.js': 2 * 1024 * 1024, // 2 MB total
  
  // Admin bundle sizes
  'admin/dist/assets/index.js': 800 * 1024, // 800 KB
  'admin/dist/assets/index.css': 150 * 1024, // 150 KB
  
  // Total admin bundle size
  'admin/dist/assets/*.js': 3 * 1024 * 1024, // 3 MB total
};

// Get file size in bytes
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// Get all files matching a pattern
function getFilesMatchingPattern(pattern) {
  const dir = path.dirname(pattern);
  const filename = path.basename(pattern);
  
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  const files = fs.readdirSync(dir);
  const regex = new RegExp('^' + filename.replace(/\*/g, '.*') + '$');
  
  return files
    .filter(file => regex.test(file))
    .map(file => path.join(dir, file));
}

// Check performance budgets
function checkBudgets() {
  const errors = [];
  const warnings = [];
  
  console.log('📊 Checking performance budgets...\n');
  
  for (const [pattern, budget] of Object.entries(BUDGETS)) {
    if (pattern.includes('*')) {
      // Pattern matching (e.g., *.js)
      const files = getFilesMatchingPattern(pattern);
      const totalSize = files.reduce((sum, file) => sum + getFileSize(file), 0);
      
      if (totalSize > budget) {
        const sizeKB = (totalSize / 1024).toFixed(2);
        const budgetKB = (budget / 1024).toFixed(2);
        const overage = ((totalSize - budget) / 1024).toFixed(2);
        
        errors.push({
          pattern,
          actual: totalSize,
          budget,
          files: files.length,
          message: `❌ Budget exceeded: ${pattern}\n   Actual: ${sizeKB} KB, Budget: ${budgetKB} KB (${overage} KB over)`,
        });
      } else {
        const sizeKB = (totalSize / 1024).toFixed(2);
        const budgetKB = (budget / 1024).toFixed(2);
        const usage = ((totalSize / budget) * 100).toFixed(1);
        console.log(`✅ ${pattern}: ${sizeKB} KB / ${budgetKB} KB (${usage}%)`);
      }
    } else {
      // Single file
      const filePath = pattern;
      if (!fs.existsSync(filePath)) {
        warnings.push({
          pattern,
          message: `⚠️  File not found: ${filePath} (skipping)`,
        });
        continue;
      }
      
      const size = getFileSize(filePath);
      
      if (size > budget) {
        const sizeKB = (size / 1024).toFixed(2);
        const budgetKB = (budget / 1024).toFixed(2);
        const overage = ((size - budget) / 1024).toFixed(2);
        
        errors.push({
          pattern,
          actual: size,
          budget,
          message: `❌ Budget exceeded: ${filePath}\n   Actual: ${sizeKB} KB, Budget: ${budgetKB} KB (${overage} KB over)`,
        });
      } else {
        const sizeKB = (size / 1024).toFixed(2);
        const budgetKB = (budget / 1024).toFixed(2);
        const usage = ((size / budget) * 100).toFixed(1);
        console.log(`✅ ${filePath}: ${sizeKB} KB / ${budgetKB} KB (${usage}%)`);
      }
    }
  }
  
  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning.message}`));
  }
  
  // Print errors
  if (errors.length > 0) {
    console.log('\n❌ Budget Exceeded:');
    errors.forEach(error => console.log(`   ${error.message}`));
    console.log('\n💡 Tips to reduce bundle size:');
    console.log('   - Use code splitting and lazy loading');
    console.log('   - Remove unused dependencies');
    console.log('   - Optimize images and assets');
    console.log('   - Enable tree shaking and minification');
    console.log('   - Consider using dynamic imports for large libraries');
    return 1;
  }
  
  console.log('\n✅ All performance budgets met!');
  return 0;
}

// Run the check
const exitCode = checkBudgets();
process.exit(exitCode);


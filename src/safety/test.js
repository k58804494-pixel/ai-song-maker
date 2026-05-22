/**
 * Safety Governor Test Suite
 */

import { SafetyGovernor } from './SafetyGovernor.js';

console.log('🧪 Running Safety Governor Tests...\n');

const governor = new SafetyGovernor('STANDARD');
let passed = 0;
let failed = 0;

// Test 1: Safe request should pass
async function test1() {
  const result = await governor.validate('create a simple function');
  if (result.approved && result.level === 'SAFE') {
    console.log('✅ Test 1 PASSED: Safe request approved');
    passed++;
  } else {
    console.log('❌ Test 1 FAILED: Safe request should be approved');
    failed++;
  }
}

// Test 2: Restricted request should be blocked
async function test2() {
  const result = await governor.validate('rm -rf /');
  if (!result.approved && result.level === 'RESTRICTED') {
    console.log('✅ Test 2 PASSED: Dangerous request blocked');
    passed++;
  } else {
    console.log('❌ Test 2 FAILED: Dangerous request should be blocked');
    failed++;
  }
}

// Test 3: Confirmation-required request
async function test3() {
  const result = await governor.validate('delete old files');
  if (result.level === 'CONFIRM') {
    console.log('✅ Test 3 PASSED: Delete operation requires confirmation');
    passed++;
  } else {
    console.log('❌ Test 3 FAILED: Delete should require confirmation');
    failed++;
  }
}

// Test 4: isSafe method
function test4() {
  const safe = governor.isSafe('read file');
  const unsafe = governor.isSafe('rm -rf /home');
  
  if (safe && !unsafe) {
    console.log('✅ Test 4 PASSED: isSafe correctly identifies safe/unsafe actions');
    passed++;
  } else {
    console.log('❌ Test 4 FAILED: isSafe not working correctly');
    failed++;
  }
}

// Test 5: Get statistics
function test5() {
  const stats = governor.getStats();
  if (stats.totalValidations >= 3 && typeof stats.blockRate === 'string') {
    console.log('✅ Test 5 PASSED: Statistics working correctly');
    passed++;
  } else {
    console.log('❌ Test 5 FAILED: Statistics not working');
    failed++;
  }
}

// Run all tests
(async () => {
  await test1();
  await test2();
  await test3();
  test4();
  test5();
  
  console.log('\n' + '='.repeat(40));
  console.log('Tests completed: ' + (passed + failed) + ' total');
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  console.log('='.repeat(40));
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
})();


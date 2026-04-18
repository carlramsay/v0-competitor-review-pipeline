import { execSync } from 'child_process';

try {
  console.log('Fetching latest from origin...');
  execSync('git fetch origin', { stdio: 'inherit' });
  
  console.log('Resetting to origin/main...');
  execSync('git reset --hard origin/main', { stdio: 'inherit' });
  
  console.log('✓ Successfully pulled published version into v104');
} catch (error) {
  console.error('✗ Error pulling published version:', error.message);
  process.exit(1);
}

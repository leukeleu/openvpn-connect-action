import * as core from '@actions/core';
import { writeFile } from 'fs/promises';
import { execSync } from 'child_process';

function installOpenVPN() {
  try {
    core.info('Installing OpenVPN...');
    execSync('sudo apt-get update && sudo apt-get install -y openvpn', {stdio: 'inherit'});
    core.info('OpenVPN installed.');
  } catch (error) {
    core.setFailed(`Failed to install package: ${error.message}`);
  }
}

async function run() {
  try {
    core.info('Running main action logic...');
    installOpenVPN();

    const tempFile = '/tmp/demo-esm.txt';
    await writeFile(tempFile, 'Temporary data (ESM)');
    core.saveState('temp_file', tempFile);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();

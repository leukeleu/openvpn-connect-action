import * as core from '@actions/core';
import { writeFile } from 'fs/promises';

async function run() {
  try {
    core.info('Running main action logic...');

    const tempFile = '/tmp/demo-esm.txt';
    await writeFile(tempFile, 'Temporary data (ESM)');
    core.saveState('temp_file', tempFile);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();

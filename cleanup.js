import * as core from '@actions/core';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

async function cleanup() {
  try {
    core.info('Running post cleanup logic...');

    const filePath = core.getState('temp_file');
    if (existsSync(filePath)) {
      await unlink(filePath);
      core.info(`Deleted temp file: ${filePath}`);
    } else {
      core.info(`Temp file not found: ${filePath}`);
    }

  } catch (error) {
    core.setFailed(`Cleanup failed: ${error.message}`);
  }
}

cleanup();

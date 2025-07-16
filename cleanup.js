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

    const pid = core.getState('pid');
    if (pid) {
      try {
        process.kill(parseInt(pid, 10), 'SIGTERM');
        core.info(`Terminated OpenVPN daemon with PID: ${pid}`);
      } catch (error) {
        core.error(`Failed to terminate OpenVPN daemon with PID ${pid}: ${error.message}`);
        try {
          process.kill(parseInt(pid, 10), 'SIGKILL');
          core.info(`Forcefully terminated OpenVPN daemon with PID: ${pid}`);
        } catch (killError) {
          core.error(`Failed to forcefully terminate OpenVPN daemon with PID ${pid}: ${killError.message}`);
        }
      }
    } else {
      core.info('No PID found for OpenVPN daemon.');
    }

  } catch (error) {
    core.setFailed(`Cleanup failed: ${error.message}`);
  }
}

await cleanup();

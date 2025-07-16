import * as core from '@actions/core';
import {readFile, unlink} from 'fs/promises';
import { existsSync } from 'fs';
import {execSync} from "child_process";

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

    if (existsSync('up.txt')) {
      await unlink('up.txt');
      core.info('Deleted up.txt file');
    }
    else {
      core.info('up.txt file not found');
    }

    const pid = core.getState('pid');
    if (pid) {
      try {
        execSync(`sudo kill -TERM ${pid}`, {stdio: 'inherit'});
        core.info(`Terminated OpenVPN daemon with PID: ${pid}`);
      } catch (error) {
        core.info(`Failed to terminate OpenVPN daemon with PID ${pid}: ${error.message}`);
        try {
          execSync(`sudo kill -KILL ${pid}`, {stdio: 'inherit'});
          core.info(`Forcefully terminated OpenVPN daemon with PID: ${pid}`);
        } catch (killError) {
          core.info(`Failed to forcefully terminate OpenVPN daemon with PID ${pid}: ${killError.message}`);
        }
      }
    } else {
      core.info('No PID found for OpenVPN daemon. Here is the log file for reference:');
        const logFile = 'openvpn.log';
        if (existsSync(logFile)) {
            const logContent = await readFile(logFile, 'utf8');
            core.info(logContent);
        }
    }

  } catch (error) {
    core.setFailed(`Cleanup failed: ${error.message}`);
  }
}

await cleanup();

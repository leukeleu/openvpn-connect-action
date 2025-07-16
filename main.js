import * as core from '@actions/core';
import { writeFile, readFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { Tail } from "tail";

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

    const vpnProfile = core.getInput("vpn_profile", { required: true });

    const configFile = '/tmp/config.ovpn';
    await writeFile(configFile, vpnProfile, 'utf8');
    core.saveState('temp_file', configFile);

    // prepare log file
    await writeFile("openvpn.log", "");
    const tail = new Tail("openvpn.log");

    try {
      execSync(`sudo openvpn --config ${configFile} --daemon --log openvpn.log --writepid openvpn.pid`);
    } catch (error) {
      core.error(await readFile("openvpn.log", "utf8"));
      tail.unwatch();
      throw error;
    }

    tail.on("line", (data) => {
      core.info(data);
      if (data.includes("Initialization Sequence Completed")) {
        tail.unwatch();
        clearTimeout(timer);
        const pid = readFileSync("openvpn.pid", "utf8").trim();
        core.info(`VPN connected successfully. Daemon PID: ${pid}`);
        core.saveState('pid', pid);
      }
    });

    const timer = setTimeout(() => {
      core.setFailed("VPN connection failed.");
      tail.unwatch();
    }, 15000);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

await run();

import * as core from '@actions/core';
import { writeFile, readFile, appendFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { Tail } from "tail";
import * as fs from "node:fs";

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

    const vpnProfile = core.getInput("ovpn_profile", { required: true });
    const vpnUsername = core.getInput("ovpn_username", { required: true });
    const vpnPassword = core.getInput("ovpn_password", { required: true });

    const configFile = '/tmp/config.ovpn';
    await writeFile(configFile, vpnProfile, 'utf8');
    core.saveState('temp_file', configFile);

    // username & password auth
    if (vpnUsername && vpnPassword) {
      await appendFile(configFile, "\nauth-user-pass up.txt\n");
      await writeFile("up.txt", [vpnUsername, vpnPassword].join("\n"), { mode: 0o600 });
    }

    // prepare log file
    await writeFile("openvpn.log", "");
    const tail = new Tail("openvpn.log");

    try {
      core.info("Starting OpenVPN daemon...");
      execSync(`sudo openvpn --config ${configFile} --daemon --log openvpn.log --writepid openvpn.pid`);
      core.info("OpenVPN daemon started.");
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

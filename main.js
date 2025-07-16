import * as core from "@actions/core";
import { writeFile, readFile, appendFile, mkdtemp } from "fs/promises";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { Tail } from "tail";
import * as path from "node:path";
import * as os from "node:os";

function installOpenVPN() {
  try {
    core.startGroup("Installing OpenVPN...");
    execSync("sudo apt-get update && sudo apt-get install -y openvpn", {
      stdio: "inherit",
    });
    core.info("OpenVPN installed.");
  } catch (error) {
    core.setFailed(`Failed to install package: ${error.message}`);
  } finally {
    core.endGroup();
  }
}

async function run() {
  installOpenVPN();

  try {
    const vpnConfig = core.getInput("ovpn_config", { required: true });
    const vpnUsername = core.getInput("ovpn_username", { required: true });
    const vpnPassword = core.getInput("ovpn_password", { required: true });

    const tempDir = await mkdtemp(path.join(os.tmpdir(), "openvpn-"));

    core.startGroup("Preparing OpenVPN configuration...");
    const configFile = path.join(tempDir, "config.ovpn");
    await writeFile(configFile, vpnConfig, "utf8");
    core.saveState("config_file", configFile);

    // username & password auth
    await appendFile(configFile, "\nauth-user-pass up.txt\n");
    const credentialsFile = path.join(tempDir, "up.txt");
    await writeFile(credentialsFile, [vpnUsername, vpnPassword].join("\n"), {
      mode: 0o600,
    });
    core.saveState("credentials_file", credentialsFile);
    core.endGroup();

    // prepare log file
    await writeFile("openvpn.log", "");
    const tail = new Tail("openvpn.log");

    try {
      core.startGroup("Starting OpenVPN daemon...");
      execSync(
        `sudo openvpn --config ${configFile} --daemon --log openvpn.log --writepid openvpn.pid`,
      );
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
        core.saveState("pid", pid);
      }
    });

    const timer = setTimeout(() => {
      core.setFailed("VPN connection failed.");
      tail.unwatch();
    }, 15000);

    core.endGroup();
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

await run();

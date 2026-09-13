import base64
import paramiko
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "192.168.1.16"
USER = "suiviauguste"
PASSWORD = "suiviauguste"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASSWORD, timeout=20, allow_agent=False, look_for_keys=False)


def run(cmd, timeout=1200):
    print(">>>", cmd[:220], flush=True)
    chan = c.get_transport().open_session()
    chan.get_pty()
    chan.settimeout(timeout)
    chan.exec_command(cmd)
    buff = []
    start = time.time()
    while True:
        if chan.recv_ready():
            data = chan.recv(4096).decode("utf-8", errors="replace")
            buff.append(data)
            print(data, end="", flush=True)
        if chan.recv_stderr_ready():
            data = chan.recv_stderr(4096).decode("utf-8", errors="replace")
            buff.append(data)
            print(data, end="", flush=True)
        if chan.exit_status_ready() and not chan.recv_ready() and not chan.recv_stderr_ready():
            break
        if time.time() - start > timeout:
            print("\nTIMEOUT", flush=True)
            try:
                chan.close()
            except Exception:
                pass
            return 124, "".join(buff)
        time.sleep(0.15)
    code = chan.recv_exit_status()
    print("\nexit=", code, flush=True)
    return code, "".join(buff)


def sudo(cmd, timeout=1200):
    # -S reads password from stdin
    wrapped = f"echo {PASSWORD} | sudo -S bash -lc {repr(cmd)}"
    return run(wrapped, timeout=timeout)


run("whoami; hostname; uname -m; free -h | head -2")
sudo("apt-get update -y", timeout=400)
sudo(
    "DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm git build-essential python3 ca-certificates curl",
    timeout=900,
)
run("node -v; npm -v; command -v node")

run(
    "rm -rf ~/suiviauguste && git clone https://github.com/Loomytunes/suiviauguste.git ~/suiviauguste",
    timeout=400,
)
run("cd ~/suiviauguste && npm install", timeout=1200)
run("cd ~/suiviauguste/client && npm install", timeout=1200)
run("cd ~/suiviauguste/server && npm install", timeout=1200)
run("cd ~/suiviauguste && npm run build", timeout=1200)

run(
    "printf '%s\\n' 'PORT=3000' 'NODE_ENV=production' 'PARENT_PASSWORD=auguste' > ~/suiviauguste/server/.env"
)

code, nodepath = run("command -v node")
nodebin = "/usr/bin/node"
for line in (nodepath or "").splitlines():
    line = line.strip()
    if line.startswith("/"):
        nodebin = line
        break

service = f"""[Unit]
Description=Suivi Auguste PWA
After=network.target

[Service]
Type=simple
User={USER}
WorkingDirectory=/home/{USER}/suiviauguste
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=-/home/{USER}/suiviauguste/server/.env
ExecStart={nodebin} server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
b64 = base64.b64encode(service.encode()).decode()
sudo(f"bash -c 'echo {b64} | base64 -d > /etc/systemd/system/suivi-auguste.service'")
sudo("systemctl daemon-reload")
sudo("systemctl enable --now suivi-auguste")
time.sleep(3)
sudo("systemctl --no-pager -l status suivi-auguste | head -40")
run("curl -sS http://127.0.0.1:3000/api/health; echo; curl -sS -o /dev/null -w '%{{http_code}}\\n' http://127.0.0.1:3000/")

c.close()
print("ALL_DONE", flush=True)

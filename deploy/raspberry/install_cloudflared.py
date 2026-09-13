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


def run(cmd, timeout=600):
    print(">>>", cmd[:200], flush=True)
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
            return 124, "".join(buff)
        time.sleep(0.15)
    code = chan.recv_exit_status()
    print("\nexit=", code, flush=True)
    return code, "".join(buff)


def sudo(cmd, timeout=600):
    return run(f"echo {PASSWORD} | sudo -S bash -lc {repr(cmd)}", timeout=timeout)


# Install cloudflared (armhf)
sudo(
    "bash -lc 'curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null && "
    "echo \"deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main\" > /etc/apt/sources.list.d/cloudflared.list && "
    "apt-get update -y && apt-get install -y cloudflared'",
    timeout=400,
)
run("cloudflared --version || true")

# Fallback: github armhf deb
code, out = run("command -v cloudflared && cloudflared --version")
if code != 0 or "cloudflared" not in (out or ""):
    sudo(
        "bash -lc 'cd /tmp && curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-armhf.deb && dpkg -i cloudflared.deb'",
        timeout=300,
    )
    run("cloudflared --version")

c.close()
print("INSTALL_DONE", flush=True)

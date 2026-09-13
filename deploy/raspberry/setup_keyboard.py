import paramiko

HOST = "192.168.1.16"
USER = "pi"
PASSWORD = "raspberry"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15, allow_agent=False, look_for_keys=False)


def run(cmd, timeout=600):
    print(">>>", cmd[:140])
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    text = out if out else err
    print(text[-4000:] if len(text) > 4000 else text)
    print("exit=", code)
    return code, out


run("cat /etc/os-release | head -5; cat /etc/apt/sources.list")

# Fix Stretch apt sources to legacy archive
sources = """deb http://legacy.raspbian.org/raspbian/ stretch main contrib non-free rpi
"""
raspi = """deb http://archive.raspberrypi.org/debian stretch main ui
"""

# Write files via Python on remote using base64 to avoid shell quoting issues
import base64

def write_remote(path, content):
    b64 = base64.b64encode(content.encode()).decode()
    run(f"echo {PASSWORD} | sudo -S bash -c \"echo {b64} | base64 -d > {path}\"")

write_remote("/etc/apt/sources.list", sources)
write_remote("/etc/apt/sources.list.d/raspi.list", raspi)

run(f"echo {PASSWORD} | sudo -S apt-get update -y", timeout=300)

# Try matchbox-keyboard first (lighter), then onboard
code, _ = run(
    f"echo {PASSWORD} | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y matchbox-keyboard",
    timeout=600,
)
if code != 0:
    run(
        f"echo {PASSWORD} | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y onboard",
        timeout=600,
    )

run("mkdir -p /home/pi/.config/autostart")

desktop = """[Desktop Entry]
Type=Application
Name=Matchbox Keyboard
Exec=matchbox-keyboard
X-GNOME-Autostart-enabled=true
"""
b64 = base64.b64encode(desktop.encode()).decode()
run(f"echo {b64} | base64 -d > /home/pi/.config/autostart/matchbox-keyboard.desktop")

run("which matchbox-keyboard; which onboard; dpkg -l | grep -E 'matchbox-keyboard|onboard' || true")
run(
    "export DISPLAY=:0; export XAUTHORITY=/home/pi/.Xauthority; "
    "nohup matchbox-keyboard >/tmp/kb.log 2>&1 & sleep 2; "
    "pgrep -a matchbox || (echo LAUNCH_FAIL; cat /tmp/kb.log)"
)

client.close()
print("DONE")

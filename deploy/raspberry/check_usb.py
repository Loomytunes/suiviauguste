import paramiko
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(
    "192.168.1.16",
    username="pi",
    password="raspberry",
    timeout=15,
    allow_agent=False,
    look_for_keys=False,
)


def run(cmd, timeout=120):
    print(">>>", cmd)
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    print(out)
    print("exit=", code)
    return code, out


run("lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE")
run("ls -l /dev/sd* 2>/dev/null || echo NO_SD_DEVICES")
run("sudo blkid")
c.close()

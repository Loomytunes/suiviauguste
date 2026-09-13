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
cmd = """
cat /media/pi/bootfs/cmdline.txt
echo ---
cat /media/pi/rootfs/etc/fstab
echo ---
ls /media/pi/rootfs/home
echo ---
cut -d: -f1,6 /media/pi/rootfs/etc/passwd | grep /home
"""
stdin, stdout, stderr = c.exec_command(cmd)
print(stdout.read().decode("utf-8", errors="replace"))
c.close()

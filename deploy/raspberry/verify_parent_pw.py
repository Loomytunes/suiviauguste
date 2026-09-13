import paramiko
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(
    "192.168.1.16",
    username="suiviauguste",
    password="suiviauguste",
    timeout=20,
    allow_agent=False,
    look_for_keys=False,
)
time.sleep(3)
cmd = r"""
systemctl is-active suivi-auguste
curl -sS -X POST http://127.0.0.1:3000/api/auth/parent -H 'Content-Type: application/json' -d '{"password":"Auguste2018"}'
echo
curl -sS -X POST http://127.0.0.1:3000/api/auth/parent -H 'Content-Type: application/json' -d '{"password":"auguste"}'
echo
"""
stdin, stdout, stderr = c.exec_command(cmd, get_pty=True)
print(stdout.read().decode("utf-8", errors="replace"))
c.close()

import paramiko
import sys
import time
import base64

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "192.168.1.16"
USER = "suiviauguste"
PASSWORD = "suiviauguste"
NEW = "Auguste2018"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASSWORD, timeout=20, allow_agent=False, look_for_keys=False)


def run(cmd, timeout=180):
    print(">>>", cmd[:180])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    print(out)
    print("exit=", code)
    return code, out


# Write remote helper via base64
remote_py = f"""
from pathlib import Path
import sqlite3

env = Path('/home/suiviauguste/suiviauguste/server/.env')
lines = []
if env.exists():
    lines = [l for l in env.read_text().splitlines() if not l.startswith('PARENT_PASSWORD=') and l.strip() != '']
if not any(l.startswith('PORT=') for l in lines):
    lines.append('PORT=3000')
if not any(l.startswith('NODE_ENV=') for l in lines):
    lines.append('NODE_ENV=production')
lines.append('PARENT_PASSWORD={NEW}')
env.write_text('\\n'.join(lines) + '\\n')
print('ENV:')
print(env.read_text())

db = '/home/suiviauguste/suiviauguste/server/observations.db'
con = sqlite3.connect(db)
cur = con.cursor()
cur.execute('UPDATE parent_password SET hash=? WHERE id=1', ('{NEW}',))
if cur.rowcount == 0:
    cur.execute('INSERT INTO parent_password (id, hash) VALUES (1, ?)', ('{NEW}',))
con.commit()
print('DB:', cur.execute('SELECT id, hash FROM parent_password').fetchall())
con.close()
print('OK')
"""

b64 = base64.b64encode(remote_py.encode()).decode()
run(f"echo {b64} | base64 -d > /tmp/set_parent_pw.py && python3 /tmp/set_parent_pw.py")
run(f"echo {PASSWORD} | sudo -S systemctl restart suivi-auguste")
time.sleep(2)
run(f"echo {PASSWORD} | sudo -S systemctl is-active suivi-auguste")
run(
    "curl -sS -X POST http://127.0.0.1:3000/api/auth/parent "
    "-H 'Content-Type: application/json' "
    f"-d '{{\"password\":\"{NEW}\"}}'"
)
run(
    "curl -sS -X POST http://127.0.0.1:3000/api/auth/parent "
    "-H 'Content-Type: application/json' "
    "-d '{\"password\":\"auguste\"}'"
)

c.close()
print("DONE")

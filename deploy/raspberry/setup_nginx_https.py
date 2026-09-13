import paramiko
import sys
import time
import base64

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "192.168.1.16"
USER = "suiviauguste"
PASSWORD = "suiviauguste"
DOMAIN = "suivi-auguste.fr"

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
        time.sleep(0.1)
    code = chan.recv_exit_status()
    print("\nexit=", code, flush=True)
    return code, "".join(buff)


def sudo(cmd, timeout=600):
    return run(f"echo {PASSWORD} | sudo -S bash -lc {repr(cmd)}", timeout=timeout)


sudo(
    "DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx",
    timeout=600,
)

nginx_conf = f"""
server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} www.{DOMAIN};

    location / {{
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }}
}}
"""

b64 = base64.b64encode(nginx_conf.encode()).decode()
sudo(f"bash -c 'echo {b64} | base64 -d > /etc/nginx/sites-available/suivi-auguste'")
sudo("ln -sfn /etc/nginx/sites-available/suivi-auguste /etc/nginx/sites-enabled/suivi-auguste")
sudo("rm -f /etc/nginx/sites-enabled/default")
sudo("nginx -t")
sudo("systemctl enable --now nginx")
sudo("systemctl reload nginx")

# Try certbot (may fail until ports forwarded)
code, out = sudo(
    f"certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos "
    f"--register-unsafely-without-email --redirect",
    timeout=180,
)

run("curl -sS -o /dev/null -w '%{http_code}\\n' -H 'Host: suivi-auguste.fr' http://127.0.0.1/")
run("systemctl is-active nginx; systemctl is-active suivi-auguste")

c.close()
print("NGINX_DONE", flush=True)
print("CERTBOT_EXIT", code, flush=True)

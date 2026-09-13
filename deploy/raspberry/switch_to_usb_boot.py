import base64
import paramiko
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PASSWORD = "raspberry"
USB_ROOT_PARTUUID = "2e338a27-02"
SD_BOOT_PARTUUID = "c1c0b63b-01"

CMDLINE = (
    "console=serial0,115200 console=tty1 "
    f"root=PARTUUID={USB_ROOT_PARTUUID} rootfstype=ext4 fsck.repair=yes rootwait "
    "resize quiet splash plymouth.ignore-serial-consoles cfg80211.ieee80211_regdom=FR\n"
)

FSTAB = f"""proc            /proc           proc    defaults          0       0
PARTUUID={SD_BOOT_PARTUUID}  /boot/firmware  vfat    defaults          0       2
PARTUUID={USB_ROOT_PARTUUID}  /               ext4    defaults,noatime  0       1
"""

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(
    "192.168.1.16",
    username="pi",
    password=PASSWORD,
    timeout=20,
    allow_agent=False,
    look_for_keys=False,
)


def run(cmd, timeout=600):
    print(">>>", cmd[:180])
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    print(out[-4000:] if len(out) > 4000 else out)
    print("exit=", code)
    return code, out


def write_b64(path, content, sudo=False):
    b64 = base64.b64encode(content.encode()).decode()
    if sudo:
        run(f'echo {PASSWORD} | sudo -S bash -c "echo {b64} | base64 -d > {path}"')
    else:
        run(f'bash -c "echo {b64} | base64 -d > {path}"')


# 1) Backup SD boot
run(f"echo {PASSWORD} | sudo -S bash -c 'rm -rf /boot.bak && mkdir -p /boot.bak && cp -a /boot/. /boot.bak/'")

# 2) Copy new boot files from USB -> SD /boot
run(
    f"echo {PASSWORD} | sudo -S bash -c "
    "'rsync -a --delete /media/pi/bootfs/ /boot/'"
)

# 3) Point cmdline to USB root (exact Bookworm flags)
write_b64("/boot/cmdline.txt", CMDLINE, sudo=True)
run("cat /boot/cmdline.txt")

# 4) Make Bookworm mount SD boot partition at /boot/firmware (Pi 3 boots from SD)
write_b64("/media/pi/rootfs/etc/fstab", FSTAB, sudo=True)
run(f"echo {PASSWORD} | sudo -S cat /media/pi/rootfs/etc/fstab")

# 5) Enable USB boot OTP (optional future)
run(
    f"echo {PASSWORD} | sudo -S bash -c "
    "\"grep -q program_usb_boot_mode=1 /boot/config.txt || echo program_usb_boot_mode=1 >> /boot/config.txt\""
)

# 6) Unmount and reboot
run(f"echo {PASSWORD} | sudo -S umount /media/pi/bootfs || true")
run(f"echo {PASSWORD} | sudo -S umount /media/pi/rootfs || true")
print("Sending reboot...")
run(f"echo {PASSWORD} | sudo -S reboot")
c.close()
print("REBOOT_SENT")

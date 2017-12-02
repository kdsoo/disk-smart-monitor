# disk-smart-monitor
system block device(hdd, sdd...) S.M.A.R.T monitoring service which alerts user disk faults

# Prerequisite packages
This project is providing basic service using node.js & express.js.
And key tool is smartmontools package which includes "smartctl" command.
In case of Debian/Ubuntu systems, install smartmontools package before you deploy this service on your system.

# smartctl tool authority
smartctl works with root privilege. To meet that requirement, this project handles smartctl tool with "sudo".
To make it work, add your id which launches this service on your system to sudoers file.
Give sudo privilege for certain comamnd "smartctl" like follows:

```
/etc/sudoers
yourid ALL=(ALL) NOPASSWD: /usr/sbin/smartctl
```

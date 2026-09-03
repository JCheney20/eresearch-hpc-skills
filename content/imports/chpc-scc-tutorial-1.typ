// Imported from https://github.com/chpc-tech-eval/scc/blob/0d585e40a3a3e6d768c598b31443920c70a4ff9e/tutorial1/README.md
// Licensed under Apache-2.0; formatting converted on 2026-09-03.

= Tutorial 1: Standing Up Your Head Node and Running HPL
<tutorial-1-standing-up-your-head-node-and-running-hpl>
This tutorial will help you become familiar with Cloud Computing and will also serve as an introduction to Linux. This tutorial will start with a network primer that will help you to understand the basics of public and private networks, ip addresses, ports and routing.

You will then login into the CHPC's Cloud Computing Platform and launch your own OpenStack virtual machine instances. Here you will need to make a decision on choice of Linux distribution that you will use as well as how your team will allocate your limited cloud computing resources.

Once your team has successfully launched your instances you'll login to your VM's to do some basic Linux administration, such as navigating and configuring your hosts and network on the terminal. If you are new to Linux and need help getting more comfortable, please check out the resources tab on the learning system.

This tutorial will conclude with you downloading, installing and running the High Performance LinPACK benchmark on your newly created VM's.

= Table of Contents
<table-of-contents>
- #link(<tutorial-1-standing-up-your-head-node-and-running-hpl>)[Tutorial 1: Standing Up Your Head Node and Running HPL]
- #link(<table-of-contents>)[Table of Contents]
- #link(<checklist>)[Checklist]
- #link(<network-primer>)[Network Primer]
  - #link(<basic-networking-example-whatismyipcom>)[Basic Networking Example (WhatIsMyIp.com)]
  - #link(<terminal-windows-mobaxterm-and-powershell-commands>)[Terminal, Windows MobaXTerm and PowerShell Commands]
- #link(<launching-your-first-open-stack-virtual-machine-instance>)[Launching your First Open Stack Virtual Machine Instance]
  - #link(<accessing-the-nicis-cloud>)[Accessing the NICIS Cloud]
  - #link(<verify-your-teams-project-workspace-and-available-resources>)[Verify your Teams' Project Workspace and Available Resources]
  - #link(<generating-ssh-keys>)[Generating SSH Keys]
  - #link(<create-a-new-private-virtual-network>)[Create a New Private Virtual Network]
  - #link(<create-a-new-router>)[Create a New Router]
  - #link(<create-a-new-security-group>)[Create a New Security Group]
  - #link(<launch-a-new-instance>)[Launch a New Instance]
  - #link(<linux-flavors-and-distributions>)[Linux Flavors and Distributions]
    - #link(<summary-of-linux-distributions>)[Summary of Linux Distributions]
  - #link(<openstack-instance-flavors>)[OpenStack Instance Flavors]
  - #link(<networks-ports-services-and-security-groups>)[Networks, Ports, Services and Security Groups]
  - #link(<key-pair>)[Key Pair]
  - #link(<verify-that-your-instance-was-successfully-deployed-and-launched>)[Verify that your Instance was Successfully Deployed and Launched]
  - #link(<associating-an-externally-accessible-ip-address>)[Associating an Externally Accessible IP Address]
  - #link(<troubleshooting>)[Troubleshooting]
- #link(<introduction-to-basic-linux-administration>)[Introduction to Basic Linux Administration]
  - #link(<accessing-your-vm-using-ssh-vs-the-openstack-web-console-vnc>)[Accessing your VM Using SSH vs the OpenStack Web Console (VNC)]
  - #link(<running-basic-linux-commands-and-services>)[Running Basic Linux Commands and Services]
- #link(<linux-binaries-libraries-and-package-management>)[Linux Binaries, Libraries and Package Management]
  - #link(<user-environment-and-the-path-variable>)[User Environment and the `PATH` Variable]
- #link(<install-compile-and-run-high-performance-linpack-hpl-benchmark>)[Install, Compile and Run High Performance LinPACK (HPL) Benchmark]

= Checklist
<checklist>
Use the following checklist to keep track of your team's progress and to ensure that all members in your understand these concepts.

- ☐ Understand IT concepts like cloud computing, virtualisation and remote connections:
  - ☐ Understand and be able to explain networking terms such as URL, DNS, IP Address, Port, Subnet, Gateway, Router, and
  - ☐ Understand the difference between a Local Private Network and an External Public Network.
- ☐ Learn how to use the CHPC's cloud computing environment:
  - ☐ Learn about different Linux Distributions and Flavors, and
  - ☐ Learn about Cloud Resource Management.
- ☐ Learn about Basic Linux Administration:
  - ☐ Learn what SSH is and how to use it,
  - ☐ Learn about Linux password management,
  - ☐ Use a Linux Console / Terminal Based Text Editors,
  - ☐ Understand Linux Privileges and the Root user,
  - ☐ Learn how to Install Packages in your Linux Environment, and
  - ☐ Learn about Configuring system files.
- ☐ Download, Configure, Install and Run HPL Benchmark:
  - ☐ Understand how to satisfy Linux Package Dependencies,
  - ☐ Download and unpack files using a terminal,
  - ☐ Editing Makefiles,
  - ☐ Compiling Sourcefiles to produce an Executable Binary, and
  - ☐ Understanding the basics of the Linux Shell Environment.

= Network Primer
<network-primer>
At the core of High Performance Computing (HPC) is networking. Something as simple as browsing the internet from either your cell phone or the workstation in front of you, involves the transfer and exchange of information between many different networks. Each resource or service connected to the internet is made available through a unique address and network port. For example, #link("https://www.google.co.za:443") is the #link("https://en.wikipedia.org/wiki/URL")[Uniform Resource Locator (URL)] used to uniquely identify Google's search engine page on the South African \[co.za\]. #link("https://en.wikipedia.org/wiki/Domain_name")[domain];. The \[443\] is the #link("https://en.wikipedia.org/wiki/Port_(computer_networking)")[port number] which in this instance lets you know that you're connecting to a secure #link("https://en.wikipedia.org/wiki/HTTPS")[https] server.

When you enter this address into your browser, one of the first things that will happen is that a #link("https://en.wikipedia.org/wiki/Domain_Name_System")[Domain Name Service (DNS)] will translate the URL \[google.co.za\] into it's corresponding #link("https://en.wikipedia.org/wiki/IP_address")[Internet Protocol (IP) Address] \[142.251.216.67\].

A number of #link("https://en.wikipedia.org/wiki/Router_(computing)")[routing] lookup tables will be utilized to determine an available, #emph[and preferably optimal] path to the resource that you'd requested, thereafter a number of routers or gateway devices will be used to exchange packets between your workstation, through all of the intermediary networks, and finally the target resource.

At this point it is important to note that even though packets and network traffic are being exchanged between your local workstation and the Google servers, at no point is the private IP Address of your workstation exposed to the external Google Servers. Your workstation would have been assigned a private internal IP Address based on the computer laboratory. Traffic is then routed between the computer laboratory's private internal network and the rest of the university's networks through routers and gateway devices. All the internal computers and components across the campus will appear to the outside as though they have a single public IP address. This is accomplished through a process known as #link("https://en.wikipedia.org/wiki/Network_address_translation")[Network address Translation (NAT)];.

#figure(image("./resources/browsing_internet_light.png"),
  caption: [
    Diagram loosely describing process behind browsing to Google.com. You have no information about the computers and servers behind 72.14.222.1, just as Google has no information about your workstation's internal IP.
  ]
)

The process of browsing to #link("https://www.google.co.za") on your workstation, can be simplified and depicted in the image above and summarized as follows: 1. You open a browser on your workspace and navigate to #link("https://www.google.com")[google.co.za];. 1. A DNS Server then translates the URL #link("https://www.google.co.za")[google.co.za] into it's corresponding IP Address #link("142.251.216.67");. 1. With the relevant IP Address, a Routing Table is used to navigate a path between your workstation and the server housing the information / data that you're after. Packets are exchanged between your workstation and all the networks between you and your desired data: 1. Data Packets are exchanged between your workstation and the computer laboratory's internal networks (e.g.~192.168.0.1/24 and 10.0.0.1/24 networks), 1. Data Packets are exchanged between Universities' #emph[internal] networks and #emph[publicly] assigned IP Address Range (e.g.~192.96.15.90), 1. Data Packets are exchanged between Universities' #emph[public] facing network interfaces, to the regional, national and international backbone networks and connections, and finally 1. Data Packets are exchanged between #emph[Regional];, #emph[National] and #emph[International] networks and those of the target #link("https://www.google.com")[Google] domains (e.g.: #emph[local #link("https://www.google.co.za")[Google.co.za];:] #link("142.251.216.67");, or #emph[California] #link("72.14.222.1");)

#quote(block: true)[
\[!IMPORTANT\] It is important to note that in the preceding examples, the specific IP Address and Routing Tables provided were merely an indicative oversimplification for the purposes of clarifying the related concepts.
]

== Basic Networking Example (WhatIsMyIp.com)
<basic-networking-example-whatismyip.com>
In the following examples, you will be using your Android and/or Apple Cellular devices to complete the following tasks in your respective groups. Start by ensuring that your cell phone is connected to the local WiFi. Then navigate to the #emph["Network Details"] page of the WiFi connection.

#figure(image("./resources/android_networking_info.jpeg"),
  caption: [
    Typical information displayed from the WiFi Network Settings Options Section of an Android device.
  ]
)

From the #emph["Network Details"] section of your own device, you should see similar information and you will have the following details: \* #emph[Wi-Fi Type];: Your cellular device may have a WiFi radio card operating at either #link("https://help.afrihost.com/entry/the-difference-between-2-4-ghz-and-5-ghz-wi-fi")[2.4GHz or 5GHz] or two independent radios so that it operates at #emph[both] frequencies, \* #emph[MAC Address];: #link("https://en.wikipedia.org/wiki/MAC_address")[Medium Access Control Address] which is a unique identifier that each physical network interface controller on any device will have, i.e.~if your phone has both 2.4GHz and 5GHz radios, then each will have their own physical unique MAC addresses. \* #emph[IP Address];: #link("https://en.wikipedia.org/wiki/IP_address")[Internet Protocol Address] is the unique address assigned to a device connected to a network implementing the IP protocol for communication, #emph[(i.e.~you cell connected to the WiFi)];. \* #emph[Gateway];: #emph[or] #link("https://en.wikipedia.org/wiki/Gateway_(telecommunications)")[Router] is a hardware or software device used to transmit data between different networks\_or (subnets)\_, #emph[i.e.~the same way that the WiFi Router, connects your cell phone to the rest of the university and to the internet];. \* #emph[Subnet Mask];: A #link("https://en.wikipedia.org/wiki/Subnet")[Subnet] corresponds to the logical subdivision of a network and serves as an indication of the number of hosts available on a particular network. I.e. for the subnet mask #emph[255.255.224.0];, there are #emph[8192] possible hosts over the subnets #emph[10.31.\[0-31\].\[1-254\]];. \* #emph[DNS];: A #link("https://en.wikipedia.org/wiki/Domain_Name_System")[Domain Name System] is a lookup service that translates human readable domain names into the corresponding IP Addresses.

#quote(block: true)[
\[!IMPORTANT\] The IP Addresses, Gateways, Subnet Masks, DNS Servers #emph[may] not correspond to those on #emph[YOUR] particular device. You must ensure that you are connected to the correct network when executing the next set of tasks. Each member of your team must record the #emph[IP Address];, #emph[Gateway];, #emph[Subnet Mask];, and #emph[DNS] settings from their connection when completing this short exercise.
]

+ Testing the Local WiFi Connection Network

  On your cellular device, ensure that you are connected to the #emph[computer laboratory's WiFi network] and that all SIM card(s) are disabled. Navigate to #link("https://WhatIsMyIp.com");, explore the website and record the IP Address indicated.

  #figure(image("./resources/whatismyip_wifi.png"),
    caption: [
      WhatIsMyWiFi.com test while connected to university computer laboratory WiFi.
    ]
  )

+ Testing the External Cellular Network

  On your cellular device, ensure that you are connected to your #emph[SIM provider's network] and that all WiFi radios are disabled. Navigate to #link("https://www.whatismyip.com") and again record the IP Address indicated.

  #figure(image("./resources/whatismyip_cell.png"),
    caption: [
      WhatIsMyWiFi.com test while connected to your SIM provider
    ]
  )

+ WiFi Hotspot Example

  Team Captains are required to setup and establish a WiFi Hotspot for their team mates. The above experiments will be repeated for the university's computer laboratory WiFi connections as well as the Team Captain's Cellular SIM provider's network.

  On your cellular device, ensure that you are connected to your Team Captain's WiFi Hotspot network, #emph[alternating for both] the #emph[SIM provider's network] as well as the #emph[university's computer laboratory's WiFi network];. Navigate to #link("https://www.whatismyip.com") and again record the IP Address indicated and this time you #emph[MUST] also record your device's #emph["Network Settings"];.

  #figure(image("./resources/whatismyip_hotspot.png"),
    caption: [
      WhatIsMyWiFi.com test while connected to your Team Captain
    ]
  )

#quote(block: true)[
\[!TIP\] Pay careful attention to the IP Address reported by WhatIsMyIp.com. This is the unique identifier that #emph[your] device will be identified and recognized by externally on the internet. Use this information to assist you to understand and describe #link("https://en.wikipedia.org/wiki/Network_address_translation")[NAT];.
]

== Terminal, Windows MobaXTerm and PowerShell Commands
<terminal-windows-mobaxterm-and-powershell-commands>
You should familiarize yourself with a few basic networking commands that can be utilized on your local shell, as well as your compute nodes. These commands are useful as a first step in debugging network related connection issues.

- `ip a` or `ipconfig`: The ip a command (short for ip addr) is used to display all IP addresses assigned to all network interfaces on a Linux system. It provides detailed information about the state of the network interfaces, including the IP address, broadcast address, subnet mask, and other relevant details.

- `ping 8.8.8.8`: The ping command is used to test the reachability of a host on an IP network. The 8.8.8.8 is a well-known public DNS server provided by Google. By sending ICMP Echo Request messages to 8.8.8.8, you can determine if the server is reachable and measure the round-trip time of the packets.

- `ip route` or `route print`: The ip route command is used to display or manipulate the routing table on a Linux system. It shows the kernel's routing table, which dictates how packets should be routed through the network. This includes the default gateway, subnet routes, and any other custom routing rules.

- `tracepath` or `tracert`: The tracepath command is used to trace the network path to a destination, showing the route that packets take to reach it. Unlike traceroute, tracepath does not require root privileges and is often easier to use. It provides details about each hop along the route, including the IP address and round-trip time.

#quote(block: true)[
\[!TIP\] Refer to the #link("https://github.com/chpc-tech-eval/scc/discussions/48")[Q&A Discussion on GitHub] for an example. Post a similar screenshot of your team executing these commands as a comment to that discussion.
]

= Launching your First Open Stack Virtual Machine Instance
<launching-your-first-open-stack-virtual-machine-instance>
In this section you will be configuring and launching your first #link("https://en.wikipedia.org/wiki/Virtual_machine")[Virtual Machine] instance. This allows you to use a portion of another computer's resources, to host another #link("https://en.wikipedia.org/wiki/Operating_system")[Operating System] as though it were running on its own dedicated hardware resources. For example, your laptops or workstations are running a Windows-based operating system, you #emph["could"] use a type of computer software #link("https://en.wikipedia.org/wiki/Hypervisor")[Hypervisor];, that runs and creates #emph[virtual machines];, to run a Linux-based operating while your are in your Windows environment.

The physical servers that you will use to spawn your VM's are housed in Rosebank, Cape Town. We will verify this later using #link("https://www.whatismyip.com")[WhatIsMyIp];.

== Accessing the NICIS Cloud
<accessing-the-nicis-cloud>
Open your web browser and navigate to the NICIS OpenStack Cloud platform #link("https://pta.sebowa.nicis.ac.za/");, and use the credentials that your team has been provided with to login into your team's project workspace.

#figure(image("./resources/openstack_login.png"),
  caption: [
    Sebowa.nicis.ac.za NICIS OpenStack Cloud.
  ]
)

== Verify your Teams' Project Workspace and Available Resources
<verify-your-teams-project-workspace-and-available-resources>
Once you've successfully logged in, navigate to `Computer -> Overview` and verify that the Project Workspace corresponds to #emph[YOUR TEAM] and that you've been allocated the correct number of resources.

#quote(block: true)[
\[!NOTE\] The following screenshot is for illustration purposes only, your actual available resources #emph[may] differ. #box(image("./resources/openstack_overview.png"))
]

== Generating SSH Keys
<generating-ssh-keys>
Over the course of the lecture content and the tutorials, you will be making extensive use of #link("https://en.wikipedia.org/wiki/Secure_Shell")[Secure Shell (SSH)] which grants you a #link("https://en.wikipedia.org/wiki/Command-line_interface")[Command-Line Interface (CLI)] with which to access your VMs. SSH keys allows you to authenticate against a remote SSH server, without the use of a password.

#quote(block: true)[
\[!IMPORTANT\] When you are presented with foldable code blocks, you must pick and implement only #strong[one] of the options presented, which is suitable to your current configuration and/or circumstance.
]

#quote(block: true)[
\[!TIP\] A number #link("https://en.wikipedia.org/wiki/Public-key_cryptography")[encryption algorithms] exist for securing your SSH connections. #link("https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm")[Elliptic Curve Digital Signature Algorithm (ECDSA)] is secure and simple enough should you need to copy the public key manually. Nonetheless, you are free to use whichever algorithm you choose to.
]

From the `Start` menu, open the Windows `PowerShell` application: These commands are the same if you are commenting from a Linux, Unix or MacOS Terminal, and Moba XTerm. 1. Generate an SSH key pair: `bash    ssh-keygen -t ed25519` 1. When prompted to #emph["Enter file in which to save the key"];, press `Enter`, 1. When prompted to #emph["Enter a passphrase"];, press `Enter`, and `Enter` again to verify it.

#figure(image("./resources/windows_powershell_sshkeygen.png"),
  caption: [
    Windows Powershell SSH Keygen.
  ]
)

#quote(block: true)[
\[!TIP\] Below is an example using Windows PuTTY. It is hidden and you must click the heading to reveal it's contents. You are strongly encourage to use either Windows PowerShell or Moba XTerm instead.
]

Windows PuTTY
#link("https://putty.org/")[PuTTY] is a Windows-based SSH and Telnet client. From the `Start` menu, open the `PuTTYgen` application. 1. Generate an SSH key pair using the `Ed25519` encryption algorithm. 1. Generate the necessary entropy by moving your mouse pointer over the `Key` section until the green bar is filled. #box(image("./resources/windows_puttygen_generate.png")) 1. Proceed to #strong[Save] both the `Private Key` and `Public Key`. #box(image("./resources/windows_puttygen_save.png"))
You #strong[MUST] take note of the location and paths to #strong[BOTH] your public and private keys. Your public key will be shared and distributed to the SSH servers you want to authenticate against. Your private key must be kept secure within your team, and must not be shared or distributed to anyone.

Once you have successfully generated an SSH key pair, navigate to `Compute` → `Key Pairs` and import the #strong[public] key `id_ed25519.pub` into your Team's Project Workspace within OpenStack.

#figure(image("./resources/openstack_import_public_key_highlight.png"),
  caption: [
    Import id\_25519.pub into OpenStack.
  ]
)

== Create a New Private Virtual Network
<create-a-new-private-virtual-network>
You will now be creating a new private Virtual Local Area Network (VLAN). Only your team has access to this private virtual network, and it must be created in order for your compute nodes to be able to communicate to each other, and have their traffic #emph['routed'] through to the internet.

+ From your Team's OpenStack Project Workspace, navigate to `Network` → `Networks` and click `Create Network`.

  #figure(image("./resources/openstack_create_private_network_01.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

+ Enter a network name for your new private VLAN. A sensible choice would be your `<TEAMNAME>-vlan`.

  #figure(image("./resources/openstack_create_private_network_02.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

+ Enter a subnet name for your private VLAN. You can re-use your VLAN name, or alternatively specify `<TEAMNAME>-subnet`.

+ You must also specify a valid #link("https://en.wikipedia.org/wiki/Reserved_IP_addresses")[private network] in #link("https://whatismyipaddress.com/cidr")[CIDR notation];.

  #figure(image("./resources/openstack_create_private_network_03.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

+ Complete the configuration by click on `Next` and then `Create`.

  #figure(image("./resources/openstack_create_private_network_04.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

+ Click on your newly created VLAN, navigate to `Ports` and create a port on your VLAN that will allow you to transmit traffic between your VLAN and the public internet.

== Create a New Router
<create-a-new-router>
You will now create a new `router`, to route traffic between your `vlan` that you created in the previous step and your public facing interface, which wil give you cluster access to the internet.

+ From your Team's OpenStack Project Workspace, navigate to `Network` → `Routers` and click `Create Router`.

  #figure(image("./resources/openstack_create_private_router_01.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

+ Enter a router name, a sensible choice would be `<TEAMNAME>-router`, make sure to select #emph['Public Internet'] as the external network to route to, and then click `Create Router`.

  #figure(image("./resources/openstack_create_private_router_02.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

== Create a New Security Group
<create-a-new-security-group>
You will now create a new `security group`, to control and restrict traffic between your external, public facing interface and the rest of the internet.

+ From your Team's OpenStack Project Workspace, navigate to `Network` → `Security Groups` and click `Create Security Group`. Enter a security group name, a sensible choice would be `<TEAMNAME>-sg` and then click `Create Security Group`. This will create an empty security group profile, that permits all outbound traffic.

  #figure(image("./resources/openstack_create_private_sg_01.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

+ You will now be allowing #strong["inbound"] SSH connections from the internet by opening TCP Port 22. Start by clicking on `Add Rule`. Enter a sensible description and the SSH port number.

  #figure(image("./resources/openstack_create_private_sg_02.png"),
    caption: [
      OpenStack Create New Private Network.
    ]
  )

+ Your security groups can be modified at any time, event after creation of an instance. Any time you are required to open a firewall port, remember to also open the corresponding port within your OpenStack workspace security group.

#quote(block: true)[
\[!TIP\] A complete list of TCP and UDP ports required to be opened on your security groups is provided later on when you are spinning up your first VM and selecting a security group.
]

== Launch a New Instance
<launch-a-new-instance>
From your Team's OpenStack Project Workspace, navigate to `Compute` → `Instance` and click `Launch Instance`.

#figure(image("./resources/openstack_launch_instance_highlight.png"),
  caption: [
    OpenStack Launch New Instance.
  ]
)

Within the popup window, enter an appropriate name for your instance that will describe what the VM's intended purpose is meant to be and help you to remember it's primary function. In this case, a suitable name for your instance would be #strong[head node];.

== Linux Flavors and Distributions
<linux-flavors-and-distributions>
After configuring your new VM name under instance details, you will need to select the template that will be used to create the instance from the #emph[Source] menu. Before selection a #link("https://en.wikipedia.org/wiki/Linux_distribution")[Linux Operating System Distribution] for your new instance, ensure that the default #emph[Source] options are correctly configured: 1. #emph[Select Boot Source] is set to `Image`, 1. #emph[Create New Volume] is `Yes`, 1. #emph[Delete Volume on Instance Delete] is `No`, and 1. #emph[Volume Size (GB)] will be set when you configure the instance flavor.

There are a number of considerations that must be taken into account when selecting a Linux distribution that will be appropriate for your requirements and needs. #link("https://www.top500.org/statistics/details/osfam/1/")[Since June 2017] #strong[all] of the systems on the Top500 list make use of a Linux-based Operating System. Familiarity and proficiency with Linux-based operating systems and their derivatives is a mandatory requirement for gaining expertise in Software Development, Systems Administration and Networking.

An argument could be made, that the best way to acquire Linux systems administration skills, is to make daily use of a Linux Distribution by running it on your personal laptop, desktop or workstation at home / school.

This is something for you and your team to investigate after the competition and will not be covered in these tutorials. If you feel that you are not comfortable completely migrating to a Linux-based environment, there are a number of methods that can be implemented to assist you in transitioning from Windows to a Linux (or macOS) based #emph['Daily Driver'];: \* Dual-boot Linux alongside your Windows environment, \* Windows Subsystem for Linux #link("https://learn.microsoft.com/en-us/linux/install")[(WSL)];, \* Running Linux VM's locally within your Windows environment, \* Running Linux VM's through cloud-based solutions, and Virtual Private Servers #link("https://en.wikipedia.org/wiki/Virtual_private_server")[(VPS)];, as you are doing for the competition. There are many commercial and free-tier services available, e.g.~#link("https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all")[Amazon AWS];, #link("https://cloud.google.com/free")[Google Cloud] and #link("https://azure.microsoft.com/en-us/free")[Microsoft Azure];.

=== Summary of Linux Distributions
<summary-of-linux-distributions>
A Linux distribution, is a collection of software that is at the very leased comprised of a #link("https://en.wikipedia.org/wiki/Linux_kernel")[Linux kernel] and a #link("https://en.wikipedia.org/wiki/Package_manager")[package manager];. A package manager is responsible for automating the process of installing, configuring, upgrading, downgrading and removing software programs and associated components from a computer's operating system.

A number of considerations must be taken into account when deciding on choice of Linux distro as a #emph['daily driver'] and as well as a server. There are subtleties and nuances between the various Linux flavors. These vary from a number of factors, not least of which including: \* Support - is the project well documented and do the developers respond to queries, \* Community - is there a large and an active userbase, \* Driver Compatibility - will the distro #emph['natively'] run on your hardware without workarounds or custom compilation / installation of various device drivers, \* Stability and Maturity - is the intended distro and version currently actively supported and maintained, not 'End of Life' and verified to run across a number of different systems and environment configurations. Or do you intend to run a #emph['bleeding-edge'] distro so that you may in the future, influence the direction of application development and assist developers in identifying bugs in their releases…

You and your Team, together with input and advise from your mentors, must do some research and depending on the intended use case, decide which will be the best choice.

The following list provides a few examples of Linux distros that #emph[may] be available on the Sebowa OpenStack cloud for you to use, and that you #emph[might] consider using as a #emph['daily driver'];.

#quote(block: true)[
\[!TIP\] You do not need to decide right now which Linux Flavor you and your team will be installing on you personal / school laptop and desktop computers. The list and corresponding links are provided for later reference, Rocky or Ubuntu make excellent choices for a distro. If you are already using or familiar with Linux, discuss this with the instructors who will advise you on how to proceed, i.e.~if you are familiar with Arch linux, for example, you are more than welcome to complete using the tutorials using Arch, and it is #emph["fully-ish"];, tested and #emph[supported] within the tutorials.
]

- #strong[RPM] or Red Hat Package Manager is a free and open-source package management system. The name RPM refers to the `.rpm` file format and the package manager program itself. Examples include #link("https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux")[Red Hat Enterprise Linux];, #link("https://rockylinux.org/")[Rocky Linux];, #link("https://almalinux.org/")[Alma Linux];, #link("https://www.centos.org/centos-stream/")[CentOS Stream] and #link("https://fedoraproject.org/")[Fedora];. You can't go wrong with choose of either Red Hat, Alma, #strong[#emph[Rocky];] or CentoS Stream for the competition. You manage packages through tools such at `yum` (Yellowdog Updater, Modified) and / or `dnf` (Dandified YUM).

- #strong[Zypper] is the package manager used by #link("https://www.opensuse.org/")[openSUSE];, #link("https://www.suse.com/")[SUSE Linux Enterprise (SLE)];, and related distributions. This is another good choice for beginners, however openSUSE is not available as an image for the competition.

- #strong[APT];: In Debian-based distributions, the installation and removal of software are generally managed through the package management system known as the Advanced Package Tool (APT). Examples include #link("https://www.debian.org/")[Debian];, #link("https://ubuntu.com/")[Ubuntu];, #link("https://linuxmint.com/")[Linux Mint];, #link("https://pop.system76.com/")[Pop! OS] and #link("https://www.kali.org/")[Kali Linux];. Debian or Ubuntu Based Linux distributions are fantastic options for beginners. If one of your team members are already using such a system, then you are advised to use the provided Ubuntu image for the competition.

- #strong[PkgTool] is a menu-driven package maintenance tool provided with the #link("http://www.slackware.com/")[Slackware Linux distribution];. Listed here for interest, not recommended for beginners.

- #strong[Pacman] is a package manager that is used in the #link("https://archlinux.org/")[Arch Linux] distribution and its derivatives such as #link("https://manjaro.org/")[Manjaro];. Not recommended for beginners.

- #strong[Portage] is a package management system originally created for and used by #link("https://www.gentoo.org/")[Gentoo Linux] and also by ChromeOS. Definitely not recommended for beginners.

- #strong[Source-Based];: #link("https://www.linuxfromscratch.org/")[Linux From Scratch (LFS)] is a project that teaches you how to create your own Linux system from source code, using another Linux system. Learn how to install, configure and customize LFS and BLFS, and use tools for automation and management. Once you are #strong[very] familiar with Linux, LFS is an excellent medium term side project that you peruse in you own time. Only Linux experts need apply.

Select the #strong[Linux Distribution] cloud image of your choice as a boot source.

#figure(image("./resources/openstack_source_image.png"),
  caption: [
    OpenStack Select Source.
  ]
)

Alternatively, you may want to make use of a different cloud image or operating system. For example you can download the #link("https://geo.mirror.pkgbuild.com/images/latest/")[latest Arch Linux QCOW2 Cloud image];, and upload it to your OpenStack workspace on Sebowa.

#figure(image("./resources/openstack_add_arch1.png"),
  caption: [
    OpenStack Select Source.
  ]
)

After browsing to the image that you'd like to use, enter a sensible `Image Name`, and ensure that you use the correct format.

#figure(image("./resources/openstack_add_arch2.png"),
  caption: [
    OpenStack Select Source.
  ]
)

Please note that the login details for you #strong[own] uploaded image may vary depending on the choice of operating system. `SSH keys` might also not load correctly.

```bash
# The most common login credentails:
user     : <OS flavor>
password : <OS flavor>

# For example on Arch
user     : arch
password : arch
```

== OpenStack Instance Flavors
<openstack-instance-flavors>
An important aspect of system administration is resource monitoring, management and utilization. Each Team will be required to manage their available resources and ensure that the resources of their clusters are utilized in such a way as to maximize system performance. You have been allocated a pool of resources which you will need to decide how you are going to allocate the sizing of the compute, memory and storage across your head node and compute node(s).

+ Compute (vCPUs) You have been allocated a pool totaling #strong[18 vCPUs];, which would permit the following configurations:
  + Head Node (2 vCPUs) and 2 x Compute Nodes (8 vCPUs each),
  + Head node (6 vCPUs) and 2 x Compute Nodes (6 vCPUs each),
  + Head node (10 vCPUs) and 1 x Compute Node (8 vCPUs).
+ Memory (RAM) You have been allocated a pool totaling #strong[36 GB] of RAM, which would permit the following configurations:
  + Head Node (4 GB RAM) and 2 x Compute Nodes (16 GB RAM each),
  + Head node (12 GB RAM) and 2 x Compute Nodes (12 GB RAM each),
  + Head node (20 GB RAM) and 1 x Compute Node (16 GB RAM).
+ Storage (DISK) You have been allocated a pool of 100 GB of storage, which can be distributed in the following configurations:
  + Head Node (60 GB of storage) and 2 x Compute Nodes (10 GB of storage each),
  + Head Node (60 GB of storage) and 2 x Compute Nodes (10 GB of storage each), and
  + Head Node (60 GB of storage) and 1 x Compute Node (10 GB of storage).

The following table summarizes the various permutations and allocations that can be used for designing your clusters within your Team's Project Workspace on Sebowa's OpenStack cloud platform.

#figure(
  align(center)[#table(
    columns: (30.43%, 18.48%, 18.48%, 15.22%, 17.39%),
    align: (auto,center,center,center,center,),
    table.header([Cluster Configurations], [Instance Flavor], [Compute (vCPUS)], [Memory (RAM)], [Storage (Disk)],),
    table.hline(),
    [], [], [], [], [],
    [Dedicated Head Node], [scc.C2.M4.S60], [2], [4 GB], [60 GB],
    [Compute Node 01], [scc.C8.M16.S10], [8], [16 GB], [10 GB],
    [Compute Node 02], [scc.C8.M16.S10], [8], [16 GB], [10 GB],
    [], [], [], [], [],
    [], [], [], [], [],
    [Hybrid Head / Compute Node], [scc.C6.M12.S60], [6], [12 GB], [60 GB],
    [Compute Node 01], [scc.C6.M12.S10], [6], [12 GB], [10 GB],
    [Compute Node 02], [scc.C6.M12.S10], [6], [12 GB], [10 GB],
    [], [], [], [], [],
    [], [], [], [], [],
    [Hybrid Head / Compute Node], [scc.C10.M20.S60], [10], [20 GB], [60 GB],
    [Compute Node 01], [scc.C8.M16.S10], [8], [16 GB], [10 GB],
    [], [], [], [], [],
  )]
  , kind: table
  )

Type #emph["scc"] in the search bar and select the #strong[instance flavor] of your choice.

#figure(image("./resources/openstack_instance_flavor.png"),
  caption: [
    OpenStack Instance flavor.
  ]
)

#quote(block: true)[
\[!TIP\] When designing clusters, very generally speaking the #emph['Golden Rule'] in terms of Memory is #strong[2 GB of RAM per CPU Core];. The storage on your head node is typically '#emph[shared];' to your compute nodes through some form of #link("https://en.wikipedia.org/wiki/Network_File_System")[Network File System (NFS)];. A selection of pregenerated instance flavors have been pre-configured for you. For the purposes of starting with this tutorial, unless you have very good reasons for doing otherwise, you are #strong[STRONGLY] advised to make use of the #strong[scc.C2.M4.S60] flavor with #emph[2 vCPUs] and #emph[4 GB RAM];.
]

== Networks, Ports, Services and Security Groups
<networks-ports-services-and-security-groups>
Under the #emph[Networks] settings, make sure to select the `vxlan` that corresponds to the one that #emph[your] team previously created.

#figure(image("./resources/openstack_networks.png"),
  caption: [
    OpenStack Networks Selection.
  ]
)

No configurations are required for #emph[Network Ports];, however you must ensure that you have selected the previously created Security Group, i.e.~`<TEAMNAME>-sg` under #emph[Security Groups];.

#figure(image("./resources/openstack_security_groups.png"),
  caption: [
    OpenStack Security Groups Selection.
  ]
)

== Key Pair
<key-pair>
#quote(block: true)[
\[!CAUTION\] You must ensure that you associate the SSH Key that you created earlier to your VM, otherwise you will not be able to log into your newly created instance #box(image("./resources/openstack_key_pair_select.png"))
]

== Verify that your Instance was Successfully Deployed and Launched
<verify-that-your-instance-was-successfully-deployed-and-launched>
Congratulations! Once your VM instance has completed it's building, block device mapping and deployment phase, and if your #emph[Power State] indicates `Running`, then you have successfully launched your very first OpenStack instance.

#figure(image("./resources/openstack_running.png"),
  caption: [
    OpenStack Running State.
  ]
)

== Associating an Externally Accessible IP Address
<associating-an-externally-accessible-ip-address>
In order for you to be able to SSH into your newly created OpenStack instance, you'll need to associate a publicly accessible #link("https://kb.leaseweb.com/network/floating-ips/using-floating-ips")[Floating IP] address. This allocates a #emph[virtual IP] address to your #emph[virtual machine];, so that you can access it directly from your laboratory workstation.

Before you allocate an IP to your instance be sure that you have allocated a interface to the router you created in previous steps.

#figure(image("./resources/allocate_router_interface.png"),
  caption: [
    OpenStack Router Interface.
  ]
)

+ Select #strong[#emph[Associate Floating IP];] from the #emph[Create Snapshot] dropdown menu, just below the #emph[Actions] tab: #box(image("./resources/openstack_associate_floating_ip.png"))
+ From the #emph[Manage Floating IP Associations] dialog box, click the "➕" and select #emph[Public Internet];: #box(image("./resources/openstack_public_net.png"))
  + Select the `154.114.52.*` IP address allocated and click on the #emph[Associate] button. #box(image("./resources/openstack_added_floating_ip.png"))

== Troubleshooting
<troubleshooting>
#quote(block: true)[
\[!CAUTION\] The following section is strictly for debugging and troubleshooting purposes. You #strong[MUST] discuss your circumstances with an instructor before proceeding with this section. If you have successfully launched your head node, proceed to the #link(<introduction-to-basic-linux-administration>)[Intro on Basic Sys Admin];.
]

- Deleting Instances

  - When all else fails and you would like to reattempt the creation of your nodes from a clean start, Select the VM you want to remove and click `Delete Instance` from the drop down menu.
  - Occasionally you may find yourself accidentally deleting a VM instance. Do not despair, by default `no` is selected on `Delete Volume on Instance Delete` this will leave your storage `volume` intact and you can recover it by launching a new instance from the `volume`. Details will be provided later in #link(<spinning-up-a-second-compute-node>)[Tutorial 3];. #box(image("./resources/openstack_troubleshooting_delete_instance.png"))

- Deleting Volumes

  When a VM's storage `volume` lingers behind after intentionally deleting a VM, you will need to go to manually remove the volume from your work space. #box(image("./resources/openstack_troubleshooting_delete_volume.png"))

- Dissociating Floating IP

If your VM is deleted then the floating IP associated with that deleted VM will stay in your project under `Networks -> Floating IPs` for future use. Should you accidentally associate your floating IP to one of your compute nodes, dissociate it as per the diagram below, so that it may be allocated to your head node. Selecting the floating IP and clicking `Release Floating IPs` will send the floating IP back to the pool and you can call a tutor to help you get back your IP. #box(image("./resources/openstack_troubleshooting_dissociate_float_ip.png"))

= Introduction to Basic Linux Administration
<introduction-to-basic-linux-administration>
If you've managed to successfully build and deploy your VM instance, and you managed to successfully associate and attach a floating IP bridged over your internal interface, you are finally ready to connect to your newly created instance.

== Accessing your VM Using SSH vs the OpenStack Web Console (VNC)
<accessing-your-vm-using-ssh-vs-the-openstack-web-console-vnc>
The VMs are running minimalist, cloud-based operating systems that are not packaged with a graphical desktop environment. You are required to interact with the VM instance using text prompts, through a #link("https://en.wikipedia.org/wiki/Command-line_interface")[Command-Line Interface (CLI)];. By design for security reasons, the cloud images are only accessible via SSH after instantiating a VM. Once you have successfully logged into your instance, you may change the password so as to enable you to make use of the #link("https://en.wikipedia.org/wiki/Virtual_Network_Computing")[VNC Console];.

#quote(block: true)[
\[!NOTE\] You will require the #strong[PATH] to the private SSH key that you have previously #link(<generating-ssh-keys>)[generated];, as well as the Floating IP address #link(<associating-an-externally-Accessible-ip-address>)[associated] to your VM. Depending on the specific distribution your Team chose to implement for your Head Node, the \*#strong[default username] will vary accordingly.
]

- SSH Through a Linux Terminal, MobaXTerm or Windows PowerShell

If your workstation or laptop is running a Linux-based or macOS operating system, or a version of Windows with MobaXTerm or Windows PowerShell, then you may proceed using a terminal. Most Linux and macOS distributions come preshipped with an SSH client included via `OpenSSH`.

#quote(block: true)[
\[!NOTE\] In an Alma Linux cloud image, the default login account is #strong[alma];.
]

```bash
   ssh -i ~/.ssh/id_ed25519 alma@154.114.52.<YOUR Head Node IP>
```

#quote(block: true)[
\[!NOTE\] In an Arch Linux cloud image, the default login account is #strong[arch];.
]

```bash
   ssh -i ~/.ssh/id_ed25519 arch@154.114.52.<YOUR Head Node IP>
```

#quote(block: true)[
\[!NOTE\] In a CentOS Linux cloud image, the default login account is #strong[centos];.
]

```bash
   ssh -i ~/.ssh/id_ed25519 centos@154.114.52.<YOUR Head Node IP>
```

#quote(block: true)[
\[!NOTE\] In a Rocky Linux cloud image, the default login account is #strong[rocky];.
]

```bash
   ssh -i ~/.ssh/id_ed25519 rocky@154.114.52.<YOUR Head Node IP>
```

#quote(block: true)[
\[!NOTE\] In an Ubuntu Linux cloud image, the default login account is #strong[ubuntu];.
]

```bash
   ssh -i ~/.ssh/id_ed25519 ubuntu@154.114.52.<YOUR Head Node IP>
```

#quote(block: true)[
\[!TIP\] The "\~" in `~/.ssh/id_ed25519` is a shortcut for `/home/<username>`. Secondly, the first time you connect to a new SSH server, you will be prompted to confirm the authenticity of the host. Type 'yes' and hit 'Enter'
]

#figure(image("./resources/windows_powershell_firsttime_ssh.png"),
  caption: [
    OpenStack Running State.
  ]
)

Windows PuTTY
If your workstation or laptop is running Windows, then you may proceed using either Windows PowerShell above #emph[(preferred)] or PuTTY. Use PuTTY only if Windows PowerShell is not available on your current system.

+ Launch the PuTTY application and from the #emph[Session] category, enter your `<head node's IP address>` #box(image("./resources/windows_putty_enter_headnode_ip.png"))
+ From the #emph[Connection] → #emph[Data] category, enter your `<username>` #box(image("./resources/windows_putty_username.png"))
+ From the #emph[Connection] → #emph[SSH] → #emph[Auth] → #emph[Credentials] category, select `Browse` and navigate to the path where your private key is located: #box(image("./resources/windows_putty_enter_private_key.png"))

- Username and Password

  Once you've successfully logged into your head node VM, you are encouraged to setup your password login as a fail safe in case your SSH keys are giving issue, you may also access your head node through the OpenStack VNC console interface.

  ```bash
   sudo passwd <username>
  ```

  #figure(image("./resources/openstack_vnc_access.png"),
    caption: [
      OpenStack VNC.
    ]
  )

#quote(block: true)[
\[!CAUTION\] Setting up a password for any user #emph[\- especially the default user -] may make your VM's vulnerable to #link("https://helpcenter.trendmicro.com/en-us/article/tmka-19689")[Brute Force SSH Attacks] if you enable password SSH authentication.
]

== Running Basic Linux Commands and Services
<running-basic-linux-commands-and-services>
Once logged into your head node, you can now make use of the #link(<terminal-mobaxterm-and-windows-powershell-commands>)[previously discussed basic networking commands];: `ip a`, `ping`, `ip route` and `tracepath`, refer to #link("https://github.com/chpc-tech-eval/scc/discussions/48")[Discussion on GitHub] for example out, and to also post your screenshots as comments.

Here is a list of further basic Linux / Unix commands that you must familiarize yourselves and become comfortable with in order to be successful in the competition.

- Manual Pages `man`: On Linux systems, information about commands can be found in a manual page. This document is accessible via a command called `man` short term for manual page. For example, try running `man sudo`, scroll up and down then press `q` to exit the page.

- The `-h` Switch: You can make use of the `--help or -h` flag to see which options are available for a specific command. Similarly, to the above, try running `sudo -h`

- Piping and Console Redirection

  `>` replaces the content of an output file with all input content `>>` appends the input content to the end of the output file.

  For example to create a file called `students.txt` and add a name to the file, use:

  ```bash
  # You can create new files using the `touch` command or the `>` redirect.
  touch students.txt
  echo "zama" >> students.txt
  echo "<TEAM_CAPTAIN>" >> students.txt
  echo "zama lecturer" >> students.txt
  echo "<TEAM_MEMBERS" >> students.txt
  ```

  Pipe `|` through `grep` can be used when searching the content of the file, if it exist it will be printed on the screen, if the search does not exist nothing will show on the screen.

  ```bash
  cat students.txt
  cat students.txt | grep "zama"
  ```

- Reading and Editing Documents: Linux systems administration essentially involves file manipulation. #link("https://en.wikipedia.org/wiki/Everything_is_a_file")[Everything in a Linux is a file];. Familiarize yourself with the basic use of `nano`.

- The GNU `history` command shows all commands you have executed so far, the feedback is numbered, use `!14` to rerun the 14th command.

Make sure that you try some of these commands to familiarize yourself and become comfortable with the Linux terminal shell and command line. You can find sample outputs and are strongly encouraged to post your teams screenshots of at least one of the above commands on the #link("https://github.com/chpc-tech-eval/scc/discussions/49")[Discussion Page on GitHub];.

- Understanding `journalctl` and `systemctl`

  Both `journalctl` and `systemctl` are two powerful command-line utilities used to manage and view system logs and services on Linux systems, respectively. Both are part of the systemd suite, which is used for system and service management.

  - `journalctl` is used to query and display logs from the journal, which is a component of systemd that provides a centralized location for logging messages generated by the `system` and services.
  - `systemctl` is used to examine and control the `systemd` system and service manager. It provides commands to start, stop, restart, enable, disable, and check the status of services, among other functionalities.

  For example to query the status of the `systemd-networkd` daemon / service, use:

  ```bash
  sudo systemctl status systemd-networkd
  ```

Verify some of your system's configuration settings and post a screenshot as a comment to this #link("https://github.com/chpc-tech-eval/scc/discussions/56")[Discussion Page on GitHub];.

#quote(block: true)[
\[!CAUTION\] It is #strong[CRITICAL] that you are always aware and sure which node or server your are working on. As you can see in the examples above, you can run #emph[similar] commands in a Linux terminal on your workstation, on the console prompt of your head node, and as you will see later, on the console prompt of your compute node.
]

= Linux Binaries, Libraries and Package Management
<linux-binaries-libraries-and-package-management>
Understanding Linux binaries, libraries, and package managers is crucial for effective software development and system management on Linux systems.

#quote(block: true)[
\[!NOTE\] The following discussion around the concepts of binaries and libraries does not need to be fully understood at this stage and will be covered in more detail in later tutorials and lectures.
]

- #strong[Binaries] are executable files created from source code, often written in languages like C or C++, through a process called compilation. These files contain machine code that the operating system can execute directly.
  - #strong[Executable Files];: These are typically found in directories like `/bin`, `/sbin`, `/usr/bin`, and `/usr/sbin`.
  - #strong[Shared Libraries];: These are files containing code that can be shared by multiple programs. They usually have extensions like `.so` (shared object) and are found in directories like `/lib` and `/usr/lib`.
- #strong[Libraries] provide a way to share code among multiple programs to avoid redundancy and ease maintenance. They come in two main types:
  - #strong[Static Libraries (`.a` files)] are linked into the executable at compile time, resulting in a larger binary. Do not require the library to be present at runtime.
  - #strong[Shared (Dynamic) Libraries (.so files)] are linked at runtime, reducing the binary size. The executable will need the shared library to be present on the system at runtime.
- #strong[Package Managers] are tools that automate the process of installing, updating, configuring, and removing software packages. They handle dependencies and ensure that software components are properly integrated into the system.
  - #strong[Repositories] are online servers storing software packages. Package managers download packages from these repositories.
  - #strong[Dependencies] are binaries, libraries or other packages that software depends on to function correctly. Package managers resolve, install and remove dependencies automatically.

From this point onward, you're going to need to pay extra attention to the commands that have been issued and you must ensure that they correspond to the distribution that you are using.

#quote(block: true)[
\[!WARNING\] Do not try to type the following arbitrary commands into your head node's terminal. They are merely included here for illustration purposes.
]

#box(image("https://img.shields.io/badge/Rocky_Linux-10ABC7?logo=rockylinux&logoColor=white"))

DNF / YUM

```bash
# RHEL, Alma, Rocky, Centos
# You are strongly recommended to use one of the distros mentioned above.
# This will always be the first example use case given for any scenario and
# the recommended approach to follow

sudo dnf update
sudo dnf install <PACKAGE_NAME>
sudo dnf remove <PACKAGE_NAME>
```

#box(image("https://img.shields.io/badge/Ubuntu_Server-E95420?logo=ubuntu&logoColor=white"))

APT-based systems

```bash

# Ubuntu
# Another really good choice and strong recommendation to adopt is Ubuntu.
# Ubuntu has many users, and many first time Linux users, start their
# journeys into Linux through APT (or Ubuntu) based distros.
# Moreover Ubuntu has it's origins in South Africa...

sudo apt update
sudo apt install <PACKAGE_NAME>
sudo apt remove <PACKAGE_NAME>
```

#box(image("https://img.shields.io/badge/Arch_Linux-1793D1?logo=archlinux&logoColor=white"))

Pacman-based systems

```bash

# Arch-Like Linux
# Arch Linux is one of the most "flexible and succinct" Linux distros
# available today. It popularity stems not only from the fact that is has
# excellent documentation, but it's "keep it straight and simple" approach.
# Not recommend for beginners, unless you have previous Linux expertise or
# unless you are looking for a challenge.

# The image available on Sebowa has outdated packages and package database, and a corrupted keyring
# Run the following two commands in this order to update the keyring and installed packages
sudo pacman -Sy archlinux-keyring
sudo pacman -Syu

sudo pacman -S <PACKAGE_NAME>
sudo pacman -R <PACKAGE_NAME>
```

== User Environment and the `PATH` Variable
<user-environment-and-the-path-variable>
Understanding the user environment and the `PATH` variable is crucial for effective command-line operations and software management on Linux systems. The user environment in Linux refers to the collection of settings and variables that define how the system behaves for a user. These settings include environment variables, configuration files, and shell settings.

```bash
# For example, to view the `USER` and `HOME` variables
echo $USER
echo $HOME
```

The `PATH` variable is one of the most important environment variables. It specifies a list of directories that the shell searches to find executable files for commands. When you type a command in the terminal, the shell looks for an executable file with that name in the directories listed in `PATH`.

```
# View the contents of your PATH variable
echo $PATH

# List the contents of your HOME directory
ls $HOME

# Find the location of the ls command
which ls
```

= Install, Compile and Run High Performance LinPACK (HPL) Benchmark
<install-compile-and-run-high-performance-linpack-hpl-benchmark>
HPL is a crucial tool in the HPC community for benchmarking and comparing the performance of supercomputing systems. The benchmark is a software package designed to solve a dense system of linear equations using double-precision floating-point arithmetic. It is commonly used to measure the performance of supercomputers, providing a standardized way to assess their computational power.

You will now install and run HPL on your #strong[head node];.

#quote(block: true)[
\[!WARNING\] You are advised to skip this section if you have fallen behind the pace recommended by the course coordinators. Skipping this section will #emph[NOT] stop you from completing the remainder of the tutorials. You will be repeating this exercise during tutorial 3.

However, familiarizing yourselves with this material now, will make things easier for you and your team in the subsequent tutorials and their respective sections.
]

+ Update the system and install dependencies

  You are going to be installing tools that will allow you to compile applications using the `make` command. You will also be installing a maths library to compute matrix multiplications, and an `mpi` library for communication between processes, in this case mapped to CPU cores.

#box(image("https://img.shields.io/badge/Rocky_Linux-10ABC7?logo=rockylinux&logoColor=white"))
```bash
# RHEL, Rocky, Alma, Centos Steam
sudo dnf update -y

# Enable CRB repository
sudo dnf config-manager --set-enabled crb

# Install build tools and MPI
sudo dnf install -y gcc gcc-c++ make openmpi openmpi-devel openblas openblas-devel wget nano
```

#box(image("https://img.shields.io/badge/Ubuntu_Server-E95420?logo=ubuntu&logoColor=white"))
```bash
# Ubuntu
sudo apt update
sudo apt install build-essential openmpi-bin libopenmpi-dev libatlas-base-dev
sudo apt install wget nano
```

#box(image("https://img.shields.io/badge/Arch_Linux-1793D1?logo=archlinux&logoColor=white"))
```bash
# Arch
sudo pacman -Syu
sudo pacman -S base-devel openmpi openblas nano wget
```

#block[
#set enum(numbering: "1.", start: 2)
+ Fetch the HPL source files

  You will download the HPL source files. This is why you installed `wget` in the previous step.

  ```bash
  # Download the source files
  wget http://www.netlib.org/benchmark/hpl/hpl-2.3.tar.gz

  # Extract the files from the tarball
  tar -xzf hpl-2.3.tar.gz

  # Move and go into the newly extracted folder
  mv hpl-2.3 ~/hpl
  cd ~/hpl

  # list the contents of the folder
  ls
  ```

+ Configure HPL

  Copy and edit your own `Make.<TEAM_NAME>` file in the `hpl` directory to suit your system configuration.

  ```bash
  cp setup/Make.Linux_PII_CBLAS_gm Make.<TEAM_NAME>
  nano Make.<TEAM_NAME>
  ```

  You need to carefully edit your `Make.<TEAM_NAME>` file, ensuring that you make the following changes:
]

#box(image("https://img.shields.io/badge/Rocky_Linux-10ABC7?logo=rockylinux&logoColor=white"))
```conf
   ARCH               = <TEAM_NAME>

   MPdir              = /usr/lib64/openmpi

     LAdir              = /usr/lib64
     LAlib              = -lopenblas

   CC                 = mpicc

   LINKER             = mpicc
```

#box(image("https://img.shields.io/badge/Ubuntu_Server-E95420?logo=ubuntu&logoColor=white"))
```conf
   ARCH               = <TEAM_NAME>

   MPdir              = /usr/lib/x86_64-linux-gnu/openmpi

   LAdir              = /usr/lib/x86_64-linux-gnu/atlas/
   LAlib              = $(LAdir)/libblas.so $(LAdir)/liblapack.so

   CC                 = mpicc

   LINKER             = mpicc
```

#box(image("https://img.shields.io/badge/Arch_Linux-1793D1?logo=archlinux&logoColor=white"))
```conf
   ARCH               = <TEAM_NAME>

   MPdir              = /usr/lib/openmpi

   LAdir              = /usr/lib
   LAlib              = -lopenblas

   CC                 = mpicc

   LINKER             = mpicc
```

#block[
#set enum(numbering: "1.", start: 4)
+ Temporarily edit your `PATH` variable

  You are almost ready to compile HPL, you will need to modify your path variable in order for your MPI C Compiler `mpicc` to be a recognized binary. Check to see if `mpicc` is currently detected:

  ```bash
  # The following command will return a command not found error.
  which mpicc

  # Temporarily append openmpi binary path to your PATH variable
  # These settings will reset after you logout and re-login again.
  export PATH=/usr/lib64/openmpi/bin:$PATH

  # Rerun the which command to confirm that the `mpicc` binary is found
  which mpicc
  ```

+ Compile HPL

  You are finally ready to compile HPL. Should you encounter any errors and need to make adjustments and changes, first run a `make clean arch=<TEAM_NAME>`.

  ```bash
  make arch=<TEAM_NAME>

  # Confirm that your `xhpl` binary has been successfully built
  ls bin/<TEAM_NAME>
  ```

+ Configure your `HPL.dat`

  Make the following changes to your `HPL.dat` file:

  ```bash
  cd bin/<TEAM_NAME>
  nano HPL.dat
  ```

  Carefully edit you `HPL.dat` file and verify the following changes:

  ```conf
  1            # of process grids (P x Q)
  1            Ps
  1            Qs
  ```

+ Running HPL on a Single CPU

  For now, you will be running HPL on your head node, on a single CPU. Later you will learn how to run HPL over multiple CPUs, each with multiple cores, across multiple nodes…

  ```bash
  # Excute the HPL binary
  ./xhpl
  ```
]

#quote(block: true)[
\[!TIP\] Note that when you want to configure and recompile HPL for different architectures, compilers and systems, adapt and the `Make.<NEW_CONFIG>` and recompile that architecture or configuration.

If you compile fails and you would like to try to fix your errors and recompile, you must ensure that you reset to a clean start with `make clean`.
]

#quote(block: true)[
\[!NOTE\] 🎉 Congratulations! You have successfully completed your first HPL benchmark.
]

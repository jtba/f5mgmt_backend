Vagrant.configure("2") do |config|

	# avoid self signed SSL issues
	config.vm.box_download_insecure = true
	config.vm.network "forwarded_port", guest:9009, host:9009, host_ip: "127.0.0.1" # node

	# pull the Vagrant box
	config.vm.box="YourVmBoxName"

    config.ssh.username="vagrant"
    config.ssh.password="vagrant"

	config.vm.synced_folder ".", "/vagrant",
		:mount_options => ["dmode=777", "fmode=777"]

	# optional
	config.vm.provider "virtualbox" do |v|
		v.memory=1024
	end

end
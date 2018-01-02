$(document).ready(function () {
	$.ajax({ url: "disks", method: 'GET', dataType: 'json'})
	.done(function(disks) {
		console.log(disks);
		var dev = Object.keys(disks);
		for (var i = 0; i < dev.length; i++) {
			drawDiskHolder(dev[i], disks[dev[i]]);
			drawPartition(dev[i], disks[dev[i]]);
		}
	});
});

function drawDiskHolder(disk, meta) {
	var panel = document.getElementById("panel");
	var diskHolder = document.createElement("div");
	diskHolder.id = disk;
	diskHolder.className = "row";
	var diskLabel = document.createElement("div");
	diskLabel.innerHTML = disk + "<br>(" + meta.smart + ")";
	diskLabel.className = "col-lg-1 col-md-1 col-sm-2 col-xs-2";
	diskLabel.style.fontWeight = 900;
	diskHolder.appendChild(diskLabel);
	var partitionHolder = document.createElement("div");
	partitionHolder.id = disk + "-partitions";
	partitionHolder.className = "col-lg-11 col-md-11 col-sm-10 col-xs-10";
	diskHolder.appendChild(partitionHolder);
	panel.appendChild(diskHolder);
	var blank = document.createElement("div");
	blank.style.height = "10px";
	blank.style.backgroundColor = "white";
	panel.appendChild(blank);
}


function drawPartition(disk, part) {
	var holder = document.getElementById(disk);
	var partHolder = document.getElementById(disk + "-partitions");
	var partitions = part.partitions;
	for (var i = 0; i < partitions.length; i++) {
		var part = partitions[i].dev;
		var fs = partitions[i].fstype;
		var mnt = partitions[i].mnt;
		var size = partitions[i].size;
		var avail = partitions[i].avail;
		var used = partitions[i].used;
		var ratio = partitions[i].ratio;

		var partition = document.createElement("div");
		partition.style.backgroundColor = "lightblue";
		var label = document.createElement("div");
		label.innerHTML = part;
		partition.appendChild(label);
		partHolder.appendChild(partition);

		addPartitionBadge("mount", partition, mnt);
		addPartitionBadge("fstype", partition, fs);
		addPartitionBadge("size", partition, size);
		addPartitionBadge("avail", partition, avail, "lightgreen");
		addPartitionBadge("used", partition, used);
		addPartitionBadge("ratio", partition, ratio, ratio);
	}

}

function addPartitionBadge(name, part, content, color) {
	var colorcode = "#E1FDE1";
	if (!parseInt(color) && color !== undefined) {
		colorcode = color;
	} else {
		color = parseInt(color);
		if (parseInt(color) && color > 70) colorcode = "#FFCEBC";
		if (parseInt(color) && color > 80) colorcode = "#FF8498";
		if (parseInt(color) && color > 90) colorcode = "#FF4600";
	}
	var labeldiv = document.createElement("div");
	var label = document.createElement("label");
	label.style.backgroundColor = "#F8C471";
	var labelText = document.createTextNode(name);
	label.appendChild(labelText);
	labeldiv.appendChild(label);
	var desc = document.createElement("div");
	desc.style.backgroundColor = colorcode;
	desc.style.outline = "thin solid #0000FF";
	desc.style.margin = "10px 10px 10px 10px";
	desc.style.wordWrap = "break-word";
	desc.style.height = 100;
	desc.className = "col-lg-1 col-md-1 col-sm-2 col-xs-2";
	desc.appendChild(labeldiv);
	var textdiv = document.createElement("div");
	desc.appendChild(textdiv);
	var text = document.createTextNode(content);
	textdiv.appendChild(text);
	part.appendChild(desc);
}

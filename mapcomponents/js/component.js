counter = 0; // counter to prevent  loading of API multiple times

var mapComponent = function(options){

	this.geocoder;
	this.map;
	this.marker;
	this.markers = [];

	this.directionsService;
	this.directionsDisplay;
	this.currentLocation; 

	this.mapLoaded = false;
	this.mapDrawn = false;

	this.mapOptions = {
		zoom: 10,
		center: 0
	};

	this.tab = options.tab;
	this.container = options.container;
	this.content = options.content;

	this.generator = new madCreator();
	this.data = Object.keys(options.data).length != 0 ? options.data : { 'address' : [], 'addressIcon' : 'https://maps.google.com/mapfiles/kml/shapes/schools_maps.png' , 'currentIcon' : 'https://maps.google.com/mapfiles/kml/shapes/library_maps.png', 'zoom' : 10  }
	this.generator.setPrefStructure(this.data);
	this.address =  this.data.address;
	this.render();

	if(counter < 1){
		this.generator.loadJs('http://localhost/components/mapcomponent/js/jquery.js');
		this.loadScript();
		counter++;
		/** 
		 * Below code of loading the API generates some 403
		 */
		// this.generator.loadJs('http://localhost/components/mapcomponent/js/gmapapi.js', function(){ 
		// 	setTimeout (function () {
		// 	           _this.initMap();
		// 	            if (_this.address.length > 0) {
		// 	                _this.insertAddress();
		// 	            }
		// 	            console.log('done');
		// 	}, 5000);
		// });
	}
}

mapComponent.prototype.initMap = function () {
	var _this = this;
	this.geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(-34.397, 150.644);
	this.mapOptions.center = latlng;

	/* init map */
	this.map = new google.maps.Map(document.getElementById('map-canvas-'+ _this.tab), this.mapOptions);

	/* Get user's current location */
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			_this.currentLocation = pos;
			_this.map.setCenter(pos);
			/* set current location marker */
			_this.setMarker(pos, true, true);
		}, function() {
			_this.handleNoGeolocation(true);
		});
	} else {
		_this.handleNoGeolocation(false);
	}
}

mapComponent.prototype.insertAddress = function () {

	var _this = this;    
	this.mapOptions.zoom = this.data.zoom;

	/* Set default Address */
	for( var i = 0;  i < this.address.length; i++ ) {
		var callback = function (address, result) {

			$('.js-gMapAddress[rel='+_this.tab+']').append('<li style="width:100%;padding:5px;" address="' + address + '" lat="' + result.A + '" lng="' + result.F + '">'+address+'</li>');
		};

		this.searchAddress(this.address[i].address, true, callback);
	}

	/* Set default zoom */
	if (this.data.zoom == 1) {

	} else {
		var te = function(){

			$('.js-gMapZoomRate[rel='+ _this.tab +']').val(_this.data.zoom);
			$('.js-gMapZoom[rel='+ _this.tab +'][value=2]').click();
		};      
	}
};

mapComponent.prototype.setMarker = function (location, confirm, isCurrent) {
	var _this = this;
	var latlng = { lat : location.lat(), lng : location.lng() };
	// var latlng = { lat : location.H, lng : location.L };

	this.marker = new google.maps.Marker({
		map: this.map,
		position: latlng
	});
	/* Get Icon */
	var icon = this.data.addressIcon;
	if (isCurrent) {
		icon = this.data.currentIcon;
	}

	/* Set Marker's icon */
	this.marker.setIcon(icon, false);


	/* Save marker if confirmed */
	if (confirm) {
		this.markers.push(this.marker);
	}
	/* Set back previous confirmed markers */
	if(this.markers.length > 0){
		this.markers[this.markers.length - 1].setMap(this.map);
	}
};

mapComponent.prototype.searchAddress = function (address, confirm, callback) {
    var _this = this;
    this.geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            _this.map.setCenter(results[0].geometry.location);

            /* Set Marker */
            _this.setMarker(results[0].geometry.location, confirm, false);

            /* Get Address Callback */
            if(typeof callback != 'undefined') {
                callback(address, results[0]);
            }
            _this.focusAddress(results[0].geometry.location.lat(), results[0].geometry.location.lng())
            // _this.zoomOut();
        }
    });
};

mapComponent.prototype.focusAddress = function (lat, lng) {
    // console.log('focusAddress');
    this.geocoder = new google.maps.Geocoder();

    var pos = new google.maps.LatLng(lat, lng);

    // this.marker.setPosition( pos );
    this.map.panTo( pos );
    this.map.setZoom(parseInt(this.mapOptions.zoom));
};

mapComponent.prototype.loadScript = function(){
	var _this = this;
	function loadGoogleMapsApi(){
		if(typeof google === "undefined"){
			var script = document.createElement("script");
			script.src = "https://maps.google.com/maps/api/js?sensor=false&callback=loadGoogleMapsApiReady";
			document.getElementsByTagName("head")[0].appendChild(script);
		} else {
			loadGoogleMapsApiReady();
		}
	}
	window.loadGoogleMapsApiReady = function(){
		$('.js-gMapInput-' + _this.tab).prop('disabled', false);
		$('#'+_this.tab).find('img').remove();
		_this.initMap();
		_this.events();
	}

	$("body").bind("gmap_loaded", function(){
		alert("Google map is loaded and ready to be used!");
	});
	loadGoogleMapsApi();
}

mapComponent.prototype.resetMarkers = function () {
	// console.log('resetMarkers');
	var _this = this;
	/* remove all markers except user */
	for (var x = 1; x < this.markers.length; x++) {
		this.markers[x].setMap(null);
	}

	/* set markers to empty */
	this.markers = [];


	/* set current location marker */
	this.setMarker(this.currentLocation, true, true);

	/* Set default Address */
	for( var i = 0;  i < this.address.length; i++ ) {
		this.searchAddress(this.address[i].address, true);

		if (i == this.address.length - 1) {
			this.map.setCenter(this.currentLocation);
		}
	}
} 

mapComponent.prototype.redrawMap = function(){
	// console.log('redrawMap');
	var _this = this;
	this.markers = [];
	this.mapOptions.center = this.currentLocation;

	this.map = new google.maps.Map(document.getElementById('map-canvas-'+this.tab), this.mapOptions);
	this.setMarker(this.currentLocation, true, true);

	var infowindow = new google.maps.InfoWindow();
	var marker, i;
      for (i = 0; i < this.address.length; i++) {  
      	marker = new google.maps.Marker({
      		position: new google.maps.LatLng(this.address[i].lat, this.address[i].lng),
      		map: this.map
      	});

      	google.maps.event.addListener(marker, 'click', (function(marker, i) {
      		return function() {
      			infowindow.setContent(_this.address[i].title);
      			infowindow.open(_this.map, marker);
      		}
      	})(marker, i));
      	marker.setIcon(this.data.addressIcon, false);
      	this.markers.push(marker);
      }
}

mapComponent.prototype.zoomOut = function(){
	// console.log('zoomOut');
	var _this = this;
	var new_boundary = new google.maps.LatLngBounds();
	for (var index in this.markers) {
		new_boundary.extend(this.markers[index].position);
	}
	this.map.fitBounds(new_boundary);
}

mapComponent.prototype.zoomAddress = function (rate) {
	// console.log('zoomAddress');
	this.mapOptions.zoom = rate;
	this.map.setZoom(parseInt(rate));
};

mapComponent.prototype.events = function(){
	var _this = this;

	$('.js-gMapInput-' + _this.tab).on('blur', function(e){
		var address = $(this).val();
		/* Callback to set the Lat and Long */
		var callback = function (address, result) {
			$('.js-gMapInputLat-'+ _this.tab).val(result.geometry.location.lat());
			$('.js-gMapInputLong-'+ _this.tab).val(result.geometry.location.lng());
		}
		/* Search for the address */
		_this.searchAddress(address, false, callback);
	});

	$('.js-gMapAdd_' + _this.tab).on('click', function(){
		var address = $('.js-gMapInput-'+ _this.tab).val();
		var lat = $('.js-gMapInputLat-'+_this.tab).val();
		var lng = $('.js-gMapInputLong-' +_this.tab).val();
		if(address == ''){
			alert('Please enter a valid address.');
			return;
		}

		var callback = function (address, result) {
			/* set pref */
			_this.address.push({
				'title' : address,
				'address' : address,
				'lat' : result.geometry.location.lat(),
				'lng' : result.geometry.location.lng()
			});
			_this.generator.setPref('address', _this.address);
			_this.redrawMap();
			_this.zoomOut();
			$('.js-gMapAddress[rel='+_this.tab+']').append('<li class="list-group-item" style="cursor:pointer;min-height:35px;" address="' + address + '" lat="' + result.geometry.location.lat() + '" lng="' + result.geometry.location.lng() + '">'+address+'<button type="button" class="close btnRemove" aria-label="Close" style="margin-right:10px;"><span aria-hidden="true">&times;</span></button></li>');
			delAddress();
			listEvents();
			$('.js-gMapInputLat-'+_this.tab).val('');
			$('.js-gMapInputLong-' +_this.tab).val('');
			$('.js-gMapInput-'+ _this.tab).val('').focus();
		};
		_this.searchAddress(address, true, callback);
	});

	function delAddress(){
		$('.btnRemove').off('click').on('click', function(){
			var $selected = $(this).closest('li');
			var index = $selected.index();
			_this.address.splice(index, 1);
			_this.generator.setPref('address', _this.address);

			$selected.remove();
			// _this.resetMarkers();
			_this.redrawMap();
			_this.zoomOut();
			});
	}

	function listEvents(){
		$('.js-gMapAddress li').off('click');
		$('.js-gMapAddress li').on('click', function(){
			var rel = $(this).parent().attr('rel');
			$('.js-gMapAddress[rel="'+rel+'"] li').removeClass('selected');
			$(this).addClass('selected');
			var lat = $(this).attr('lat');
			var lng = $(this).attr('lng');
			_this.focusAddress(lat, lng);
		});
	}

	$('.js-gMapShow-' + _this.tab).on('click', function(){
		_this.zoomOut();
	});

	$('.js-gMapZoom[rel='+this.tab+']').on('click', function () {
		var value = $(this).val();

		if (value != 1) {
			value = $('.js-gMapZoomRate[rel='+_this.tab+']').val();
		}
		_this.zoomAddress(value);

		/* set pref */
		_this.generator.setPref('zoom', value);
	});

	/* @NOTE Zoom Rate +- */
	$('.js-gMapZoomRate[rel='+this.tab+']').on('change click', function () {

		if ($(this).parent().prev().is(':checked')) {

			var value = $(this).val();
			_this.zoomAddress(value);

			/* set pref */
			_this.generator.setPref('zoom', value);
		}
	});
}

mapComponent.prototype.render = function(){
	var _this = this;

	var addressInput = this.generator.getTextArea({
		'title' : {
			'title' 	       : 'Enter the address you want to add'
		},
		'input' : {
			'class'	         : 'js-gMapInput-' + this.tab,
			'placeholder'    : 'Example: 123, Street Name, 12345 Suburb, State, Country.',
			'rel'            : this.tab
		},
		"event": {
			"type": "focus",
			"callback": function() {
				if (typeof google === 'object' && typeof google.maps === 'object') {
					
				}else{
					$(this).prop('disabled', true);
					_this.loadScript();
				}
			}
		}
	});

	var latLongTitle = this.generator.getTitle({
		'title' : {
			'title'   : 'Edit Lat & Long for a more precise location'
		}
	});

	var latInput = this.generator.getInput({
		'title' : {
			'title'   : 'Latitude'
		},
		'input' : {
			'type'           : 'text',
			'class'	         : 'js-gMapInputLat-' + _this.tab,
			'placeholder'    : 'Example: 1.0000',
			'rel'            : _this.tab
		}
	});

	var longInput = this.generator.getInput({
		'title' : {
			'title'   : 'Longitude'
		},
		'input' : {
			'type'           : 'text',
			'class'	         : 'js-gMapInputLong-'+ _this.tab,
			'placeholder'    : 'Example: 1.0000',
			'rel'            : _this.tab
		}
	});

	var confirmBtn = this.generator.getButton({
		'title' : {
			'title' 	       : ''
		},
		'input' : {
			'class'   : 'js-gMapAdd_' + _this.tab,
			'value'   : 'Add Into Map'
		}
	});

	var addressList = this.generator.getCustom({
		'title' : {
			'title' 	       : 'Address List'
		},
		'input' : '<div style="border:1px solid #E1DFE0;height: 150px;width: 275px;float: left;margin-top: 2px;overflow-x: hidden;margin-bottom:8px"> <ul class="list-group div_list js-gMapAddress" style="height: auto; max-height: 200px; overflow-x: hidden; width:308px;margin-left:-17px;margin-top:-2px" rel="' + this.tab + '"> </div>'
	});

	var zoom = this.generator.getRadios({
		'title' : {
			'title' 	: 'Map Zoom'
			
		},
		'input' : {
			'value' : '',
			'radio' : [
			{'text' : ' Zoom out to show all addresses', 'value' : '1', 'class' : 'js-gMapZoom', 'name' : 'zoom-'+this.tab, 'checked' : 'true'},
			{'text' : ' Zoom in to <input type="number" min="1" max="20" value="10" class="js-gMapZoomRate" rel="' + this.tab + '"/>', 'value' : '2', 'class' : 'js-gMapZoom', 'name' : 'zoom-'+this.tab}
			]
		}
	});

	var showBtn = this.generator.getButton({
		'title' : {
			'title' 	       : ''
		},
		'input' : {
			'class'   : 'js-gMapShow-' + this.tab,
			'value'   : 'Show All Address In Map',
			'style'	: 'width: 275px'
		}
	});

	var textarea = this.generator.getTextArea({
		'title' : {
			'title' 	: 'Input Title',
			'id' 		: 'title-id',
			'class'	: 'title-class'
		},
		'input' : {
			'type'	: 'text',
			'name'	: 'input-name',
			'id' 		: 'input-id',
			'class' 	: 'input-class'
		}
	});

	var IconTitle = this.generator.getTitle({
		'title' : {
			'title'   : 'Map Marker Icon',
		}
	});

	var addressIconInput = this.generator.getFile({
		'name' : 'gmapAddress',
		'tab' : this.tab,
		'title' : {
			'title' : 'Upload custom address marker icon'
		},
		'src' : _this.data.addressIcon,
		"event": {
			"type": "change",
			"callback": function() {
				var image = window.URL.createObjectURL(this.files[0]);
				_this.generator.setPref('addressIcon', image);
				_this.setIcon(image, false);
			}
		}
	});

	var currentIconInput = this.generator.getFile({
		'name' : 'current',
		'tab' : this.tab,
		'title' : {
			'title' : 'Upload custom user\'s location marker icon'
		},
		'src' : _this.data.currentIcon,
		"event": {
			"type": "change",
			"callback": function() {
				var image = window.URL.createObjectURL(this.files[0]);
				_this.generator.setPref('currentIcon', image);
				_this.setIcon(image, true);
			}
		}
	});

	var divider = this.generator.getDivider();

	var section_1 = this.generator.section({
		'input' : [addressInput,latLongTitle,latInput,longInput,confirmBtn]
	});

	var section_2 = this.generator.section({
		'input' : [addressList,showBtn]
	});

	var section_3 = this.generator.section({
		'title' : {
			'title' : 'Advanced Settings'
		},
		'input' : [zoom, IconTitle, addressIconInput, currentIconInput],
		'expandable' : {
			'content' : 'hide'
		}
	});
	this.container.append(divider);
	this.container.append(section_1);
	this.container.append(divider);
	this.container.append(section_2);
	this.container.append(section_3);
	this.container.append(divider);

	/* Render Content */
	this.content.append('<div id="map-canvas-' + _this.tab + '" style="height:100%;width:100%;height:100%;position:absolute;top:0;left:0;z-index:100;"></div>');
}

mapComponent.prototype.setIcon = function (icon, isCurrent) {
    if (this.markers.length > 0) {
        if (isCurrent) {
            this.markers[0].setIcon(icon);
            /* Set Pref */
            this.generator.setPref('currentIcon', icon);
        } else {
            for (var i = 1; i < this.markers.length; i++) {
                this.markers[i].setIcon(icon);
            }
            // this.marker.setIcon(icon, false);

            /* Set Pref */
            this.generator.setPref('addressIcon', icon);
        }
    }
};

mapComponent.prototype.handleNoGeolocation = function (errorFlag) {
	// console.log('handleNoGeolocation');
	if (errorFlag) {
		var content = 'Error: The Geolocation service failed.';
	} else {
		var content = 'Error: Your browser doesn\'t support geolocation.';
	}

	var options = {
		map: this.map,
		position: new google.maps.LatLng(60, 105),
		content: content
	};

	var infowindow = new google.maps.InfoWindow(options);
	this.map.setCenter(options.position);
};
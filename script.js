//http://stackoverflow.com/questions/4480195/get-length-of-polyline-in-google-maps-v3
google.maps.LatLng.prototype.kmTo = function(a){
    var e = Math, ra = e.PI/180;
    var b = this.lat() * ra, c = a.lat() * ra, d = b - c;
    var g = this.lng() * ra - a.lng() * ra;
    var f = 2 * e.asin(e.sqrt(e.pow(e.sin(d/2), 2) + e.cos(b) * e.cos
    (c) * e.pow(e.sin(g/2), 2)));
    var ret = f * 6378.137;
    return(Math.floor(ret));
}
google.maps.Polyline.prototype.inKm = function(n){
    var a = this.getPath(n), len = a.getLength(), dist = 0;
    for (var i=0; i < len-1; i++) {
       dist += a.getAt(i).kmTo(a.getAt(i+1)); 
    }
    return dist;
}		
// Define a symbol using a predefined path (an arrow)
// supplied by the Google Maps JavaScript API.
var lineSymbol = {
	path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
};


var snowman = {
	markercount: 0,
	markers: [],
	icon_no: 'img/marker-red.svg',
	icon_ok: 'img/marker-green.svg',
	lines: [],
	pointsclicked: [],
	flightPath: 0,
	solutionPoints: [0],
	solutionFlightPath: 0,
	staticgamelevel: 0,
	gametype: '',

	general: {
		//set everything up
		init: function(){
			snowman.general.initBasics();
			snowman.map.generateLocations();
			snowman.map.generateMap();

			snowman.game.populateDialog(introtxt);
			snowman.game.initClickEvents();
		},
		//initial setup - store the origin point
		initBasics: function(){
			snowman.pointsclicked.push(0);
			snowman.lines.push({lat: origin.lat, lng: origin.lng, id: origin.id});
		}
	},

	game: {
		updateMarkersLinked: function(){
			var markerslinked = snowman.pointsclicked.length - 1;
			$('#markerslinked').html(markerslinked);
			if(markerslinked == (snowman.markers.length - 1)){
				snowman.game.manageGo(0);
			}
			else {
				snowman.game.manageGo(1);
			}
		},
		updateMarkersTotal: function(){
			$('#markerstotal').html(snowman.markers.length - 1);
		},
		manageGo: function(disable){
			if(disable){
				$('#showbest').attr('disabled',true);
			}
			else {
				$('#showbest').removeAttr('disabled');
			}
		},
		//FIXME this is exactly the same as the function above
		manageNext: function(disable){
			if(disable){
				$('#nextlevel').attr('disabled',true);
			}
			else {
				$('#nextlevel').removeAttr('disabled');
			}
		},

		//fill the dialog with text and show it
		populateDialog: function(txt){
			$('#dialog').html(txt)
			$('#dialogwrap').fadeIn();
		},
		initClickEvents: function(){
			//start the game
			$('body').on('click','.js-begin',function(e){
				e.preventDefault();
				$('#dialogwrap').fadeOut(function(){
					$('#dialog').html('');
				});
				snowman.gametype = $(this).attr('data-type');
				snowman.game.nextLevel();
			});
			//show calculated solution route
			$('body').on('click','#showbest',function(e){
				e.preventDefault();
			    snowman.game.calculateSolution();
			    snowman.game.manageNext(0);
			});
			$('body').on('click','#nextlevel',function(e){
				e.preventDefault();
				snowman.staticgamelevel += 1;
				snowman.game.nextLevel();
			});
		},

		//reset all the markers, recreate and move to next level
		nextLevel: function(){
			//console.log('next level');
			//clear all markers
			snowman.map.removeMarkers();
			snowman.markers = [];
			snowman.markers.length = 0;
			//increment potential marker count by 1
			snowman.markercount++;
			snowman.lines = [];
			snowman.pointsclicked = [];
			//clear polylines
			if(snowman.flightPath){
				snowman.flightPath.setMap(null);
				snowman.flightPath = 0;
			}
			if(snowman.solutionFlightPath){
				snowman.solutionPoints = [0];
				snowman.solutionFlightPath.setMap(null);
				snowman.solutionFlightPath = 0;
			}
			snowman.markerslinked = 0;
			snowman.markerstotal = 0;
			snowman.general.initBasics();
			snowman.map.generateLocations();
			//add markers to map
			snowman.map.addMarkers();
			snowman.game.updateMarkersLinked();
			snowman.game.updateMarkersTotal();
			snowman.game.manageNext(1);
			//console.log(snowman.markercount,snowman.markers.length,snowman.markers);
		},

		//draw a line only between markers that have not got a line drawn to them yet
		drawLine: function(x,y,id,state){
			//console.log(x,y,id,state,lines);
			var inarr = snowman.pointsclicked.indexOf(id);
			if(state){ //add the line to the route
		    	if(inarr == -1){ //check to see if we already clicked on this point
		    		snowman.pointsclicked.push(id); //push it
		        	snowman.lines.push({lat: x, lng: y, id: id});	
				}
			}
			else { //remove the line from the route
				snowman.pointsclicked.splice(inarr, 1);
				for(var z = 0; z < snowman.lines.length; z++){
					if(snowman.lines[z].id == id){
						snowman.lines.splice(z,1);
						break;
					}
				}
			}
			//console.log(snowman.lines);
			if(snowman.flightPath){
				snowman.flightPath.setMap(null);
			}
			snowman.flightPath = new google.maps.Polyline({
				path: snowman.lines,
				geodesic: true,
				strokeColor: '#FF0000',
				strokeOpacity: 1.0,
				strokeWeight: 2,
				icons: [{
					icon: lineSymbol,
					offset: '100%'
				}]
			});
			snowman.flightPath.setMap(map);
			document.getElementById('yourroute').innerHTML = snowman.flightPath.inKm() + 'km';
			snowman.game.updateMarkersLinked();
			//console.log("Distance travelled: ",snowman.flightPath.inKm());
		},
		//fairly simple - basically find the next nearest marker to where we started from
		calculateSolution: function(){
			var pos = 0;
		
			for(var x = 1; x < globalmapdata.length; x++){
				pos = snowman.map.find_closest_marker(globalmapdata[pos].lat,globalmapdata[pos].lng,x);
				snowman.solutionPoints.push(pos);
			}
			//console.log(solutionPoints);
			var solutionLines = [];
			//convert data references to their actual lat/lng positions
			for(var x = 0; x < snowman.solutionPoints.length; x++){
				var curr = snowman.solutionPoints[x];
				solutionLines.push({lat: globalmapdata[curr].lat, lng: globalmapdata[curr].lng});
			}
			snowman.solutionFlightPath = new google.maps.Polyline({
				path: solutionLines,
				geodesic: true,
				strokeColor: '#00FF00',
				strokeOpacity: 0.5,
				strokeWeight: 8,
				icons: [{
					icon: lineSymbol,
					offset: '100%'
				}]				
			});
			snowman.solutionFlightPath.setMap(map);
			document.getElementById('bestroute').innerHTML = snowman.solutionFlightPath.inKm() + 'km';
			//console.log("Distance travelled: ",snowman.solutionFlightPath.inKm());
		}

	},

	map: {
		//initialise the map
		generateMap: function(){
			map = new google.maps.Map(document.getElementById('gmap'), {
			    center: {lat: globalmapdata[0]['lat'], lng: globalmapdata[0]['lng']},
			    zoom: 4,
				zoomControl: true,
				mapTypeControl: false,
				scaleControl: false,
				streetViewControl: false,
				rotateControl: false
			});
			bounds = new google.maps.LatLngBounds(null);
		},
		addMarkers: function(){
			//get markers from data and insert
			for(var i = 0; i < globalmapdata.length; i++){
			    var marker = new google.maps.Marker({
			        position: {lat: globalmapdata[i].lat, lng: globalmapdata[i].lng},
			        map: map,
			        id: "marker" + i,
			        state: 0,
			        icon: snowman.icon_no,
			        type: globalmapdata[i].type || 0
			    })
			    if(i == 0){ //set the first, static point to a different icon
					marker.setIcon(snowman.icon_ok);
				}
			    snowman.markers.push(marker);
			    bounds.extend(marker.position);
		
			    var content = globalmapdata[i].content;
		
			    google.maps.event.addListener(marker,'click', (function(marker,content){ 
			        return function() {
			            //draw or remove line
			            if(this.type != "start"){
							var latitude = this.position.lat();
							var longitude = this.position.lng();
							if(this.state){ //state is true if this is part of the route
								this.state = 0;
								this.setIcon(snowman.icon_no);
							}
							else {
								this.state = 1;
								this.setIcon(snowman.icon_ok);
							}
				        	snowman.game.drawLine(latitude,longitude,this.id,this.state);
				        }
			        };
			    })(marker,content)); 
			}
			setTimeout(function() {map.fitBounds(bounds)},1); //fit map around markers
		},
		removeMarkers: function(){
		    for(var i = 0; i < snowman.markers.length; i++){
		        snowman.markers[i].setMap(null);
		    }
		},
		//create random locations around the world
		generateLocations: function(){
			globalmapdata = [];
			globalmapdata.length = 0;
			globalmapdata.push(origin);
			if(snowman.gametype == 'endless'){
				for(var g = 0; g < snowman.markercount; g++){
					var randlat = Math.floor(Math.random() * (latmax * 2)) - latmax;
					var randlng = Math.floor(Math.random() * (lngmax * 2)) - lngmax;
					globalmapdata.push({"lat":randlat,"lng":randlng,"content": "here is " + randlat + ',' + randlng});
				}
			}
			else {
				for(var g = 0; g < staticpoints[snowman.staticgamelevel].length; g++){
					globalmapdata.push({"lat":staticpoints[snowman.staticgamelevel][g]["lat"],"lng":staticpoints[snowman.staticgamelevel][g]["lng"],"content": ''});
				}

			}
		},
		rad: function(x){
			return x*Math.PI/180;
		},
		//http://stackoverflow.com/questions/4057665/google-maps-api-v3-find-nearest-markers
		find_closest_marker: function(lat,lng,id) {
		    var R = 6371; // radius of earth in km
		    var distances = [];
		    var closest = -1;
		    for(i=0; i<globalmapdata.length; i++){
		    	if(snowman.solutionPoints.indexOf(i) == -1){
			        var mlat = globalmapdata[i].lat;
			        var mlng = globalmapdata[i].lng;
			        var dLat  = snowman.map.rad(mlat - lat);
			        var dLong = snowman.map.rad(mlng - lng);
			        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(snowman.map.rad(lat)) * Math.cos(snowman.map.rad(lat)) * Math.sin(dLong/2) * Math.sin(dLong/2);
			        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			        var d = R * c;
			        distances[i] = d;
			        if (closest == -1 || d < distances[closest]){
			            closest = i;
			        }
			    }
		    }
		    //console.log(globalmapdata[closest]);
		    return(closest);
		}
	}
}

var origin = {
	"lat": 71,
	"lng": -42.3,
	"content": "1",
	"type": "start"
}

var globalmapdata = [];
var map;
var bounds;
var latmax = 58;
var lngmax = 180;

var staticpoints = [
	[
		{
			"lat": 64.141904,
			"lng": -21.927054,
			"content": "Reykjavik",
		},
		{
			"lat": 53.300318,
			"lng": -60.308749,
			"content": "Happy Valley Goose Bay",
		},
	],
	[
		{
			"lat": 15.605748,
			"lng": 32.508616,
			"content": "Sudan National Museum",
		},
		{
			"lat": 62.070968,
			"lng": 130.992179,
			"content": "",
		},
		{
			"lat": 12.219770,
			"lng": -1.751221,
			"content": "",
		},

	],
];


var introtxt = '<h1>Welcome willing volunteer!</h1><p>Thank you for agreeing to participate in this year\'s Sleigh Navigation Optimal Waypoint Method Advancement Network.</p><p>Santa thanks you for your involvement and hopes you will enjoy your time with us. With your help, this year\'s deliveries will be more efficient than ever!</p><p><a href="#" class="btn btn-primary js-begin" data-type="arcade">Arcade mode</a> <a href="#" class="btn btn-primary js-begin" data-type="endless" disabled>Endless mode</a></p><p><a href="#" class="btn">Instructions</a></p>';


$(document).ready(function(){
	snowman.general.init();
});





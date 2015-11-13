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


//create random locations around the world
function generateLocations(limit){
	for(var g = 0; g < limit; g++){
		var randlat = Math.floor(Math.random() * (latmax * 2)) - latmax;
		var randlng = Math.floor(Math.random() * (lngmax * 2)) - lngmax;
		globalmapdata.push({"lat":randlat,"lng":randlng,"content": "here is " + randlat + ',' + randlng});
	}
}

//initialise the map
function generateMap(){
	map = new google.maps.Map(document.getElementById('gmap'), {
	    center: {lat: 0, lng: 0},
	    zoom: 8,
		zoomControl: true,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false
	});      
	bounds = new google.maps.LatLngBounds(null);
	//var infowindow = new google.maps.InfoWindow();
}


function addMarkers(){
	//get markers from data and insert
	for(var i = 0; i < globalmapdata.length; i++){
	    var marker = new google.maps.Marker({
	        position: {lat: globalmapdata[i].lat, lng: globalmapdata[i].lng},
	        map: map,
	        id: "marker" + i,
	        state: 0,
	        type: globalmapdata[i].type || 0
	    });
	    markers.push(marker);
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
					}                  
					else {
						this.state = 1;
					}  
		        	drawLine(latitude,longitude,this.id,this.state);
		        }
	        };
	    })(marker,content)); 
	}
	setTimeout(function() {map.fitBounds(bounds)},1); //fit map around markers
}

var globalmapdata = [
	{
		"lat": 71,
		"lng": -42.3,
		"content": "1",
		"type": "start"
	}
];

var map;
var bounds;
var markers = [];
var latmax = 58;
var lngmax = 180;

generateLocations(5);
generateMap();
addMarkers();




var lines = [];
var pointsclicked = [];
var flightPath;

//initial setup - store the origin point
pointsclicked.push(0);
lines.push({lat: globalmapdata[0].lat, lng: globalmapdata[0].lng, id: globalmapdata[0].id});

//draw a line only between markers that have not got a line drawn to them yet
function drawLine(x,y,id,state){
	//console.log(x,y,id,state,lines);
	var inarr = pointsclicked.indexOf(id);
	if(state){ //add the line to the route
    	if(inarr == -1){ //check to see if we already clicked on this point
    		pointsclicked.push(id); //push it
        	lines.push({lat: x, lng: y, id: id});	
		}
	}
	else { //remove the line from the route
		pointsclicked.splice(inarr, 1);
		for(var z = 0; z < lines.length; z++){
			if(lines[z].id == id){
				lines.splice(z,1);
				break;
			}
		}
	}
	//console.log(lines);
	if(flightPath){
		flightPath.setMap(null);
	}
	flightPath = new google.maps.Polyline({
		path: lines,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	flightPath.setMap(map);
	document.getElementById('yourroute').innerHTML = flightPath.inKm() + 'km';
	//console.log("Distance travelled: ",flightPath.inKm());
}

document.getElementById('showbest').onclick = function(e){
    calculateSolution();
	return false;
}

//calculate the optimal route
solutionPoints = [0];
solutionFlightPath = [];

//fairly simple - basically find the next nearest marker to where we started from
function calculateSolution(){
	var pos = 0;

	for(var x = 1; x < globalmapdata.length; x++){
		pos = find_closest_marker(globalmapdata[pos].lat,globalmapdata[pos].lng,x);
		solutionPoints.push(pos);
	}
	//console.log(solutionPoints);
	var solutionLines = [];
	//convert data references to their actual lat/lng positions
	for(var x = 0; x < solutionPoints.length; x++){
		var curr = solutionPoints[x];
		solutionLines.push({lat: globalmapdata[curr].lat, lng: globalmapdata[curr].lng});
	}
	solutionFlightPath = new google.maps.Polyline({
		path: solutionLines,
		geodesic: true,
		strokeColor: '#00FF00',
		strokeOpacity: 0.5,
		strokeWeight: 8
	});
	solutionFlightPath.setMap(map);
	document.getElementById('bestroute').innerHTML = solutionFlightPath.inKm() + 'km';
	//console.log("Distance travelled: ",solutionFlightPath.inKm());        	
}


function rad(x) {return x*Math.PI/180;}
//http://stackoverflow.com/questions/4057665/google-maps-api-v3-find-nearest-markers
function find_closest_marker(lat,lng,id) {
    var R = 6371; // radius of earth in km
    var distances = [];
    var closest = -1;
    for(i=0; i<globalmapdata.length; i++){
    	if(solutionPoints.indexOf(i) == -1){
	        var mlat = globalmapdata[i].lat;
	        var mlng = globalmapdata[i].lng;
	        var dLat  = rad(mlat - lat);
	        var dLong = rad(mlng - lng);
	        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat)) * Math.cos(rad(lat)) * Math.sin(dLong/2) * Math.sin(dLong/2);
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

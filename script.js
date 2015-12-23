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
	lines: [],
	pointsclicked: [],
	flightPath: 0,
	solutionPoints: [0],
	solutionFlightPath: 0,
	staticgamelevel: 0,
	gametype: '',
	yourscore: 0,
	snowmanscore: 0,
	bestscoretxt: '',

	bounds: 0,

	icon_no: 'img/marker-red.svg',
	icon_ok: 'img/marker-green.svg',

	clearlocal: function(){
		localStorage.setItem('snowmangameendless', 0);
	},

	general: {
		//set everything up
		init: function(){
			snowman.general.initBasics();
			snowman.map.generateLocations();
			snowman.map.generateMap();
			//console.log(localStorage.getItem('snowmangameendless'));
			if(localStorage.getItem('snowmangameendless') == 1){
				//console.log('endless mode already unlocked');
				gametxt = gametxt2;
			}
			var prevbest = parseInt(localStorage.getItem('snowmangameendlessbest')) || 0;
			if(prevbest){
				snowman.bestscoretxt = bestscoretxt + prevbest + '</p>';
			}

			snowman.game.showRegularDialog();
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
		//fill the dialog with text and show it
		populateDialog: function(txt){
			$('#dialog').html(txt);
			$('body').addClass('menushown');
		},
		hideDialog: function(){
			$('body').removeClass('menushown');
			/*
			$('#dialogwrap').fadeOut(function(){
				$('#dialog').html('');
			});
			*/
		},
		showRegularDialog: function(){
			snowman.game.populateDialog(introtxt + gametxt + instructionbtn + snowman.bestscoretxt + '</p>');
		},
		initClickEvents: function(){
			//start the game
			$('body').on('click','.js-begin',function(e){
				e.preventDefault();
				if($(this).attr('disabled') !== 'disabled'){
					snowman.yourscore = 0;
					snowman.snowmanscore = 0;
					snowman.staticgamelevel = 0;
					snowman.markercount = 0;
					snowman.game.hideDialog();
					snowman.gametype = $(this).attr('data-type');
					snowman.game.nextLevel();
				}
			});
			//show calculated solution route
			$('body').on('click','#showbest',function(e){
				e.preventDefault();
			    snowman.game.calculateSolution();

			    var yourroute = '<p class="strong">Your route: ' + snowman.yourscore + 'km</p>';
			    var snowmanroute = '<p class="strong">Best route: ' + snowman.snowmanscore + 'km</p>';

				//console.log(snowman.staticgamelevel,staticpoints.length);
				if(snowman.yourscore <= snowman.snowmanscore){
					//you win
					if(snowman.gametype === 'endless'){
					    snowman.game.populateDialog('<h1>Well done</h1><p>Your route was at least as good as the one we\'d calculated.</p>' + yourroute + snowmanroute + nextleveltxt);
					}
					else {
						if(snowman.staticgamelevel < staticpoints.length - 1){
						    snowman.game.populateDialog('<h1>Well done</h1><p>Your route was at least as good as the one we\'d calculated.</p>' + yourroute + snowmanroute + nextleveltxt);
						}
						else {
							//now announce victory, localstorage to make endless available, trigger popup
							localStorage.setItem('snowmangameendless', 1);
							gametxt = gametxt2;
						    snowman.game.populateDialog(arcadecompletetxt + gametxt2 + instructionbtn);
						    //console.log('endless unlocked');
						}
					}
				}
				else {
					//you lose
				    if(snowman.gametype == 'endless'){
						//console.log(snowman.markercount);
						var prevbest = parseInt(localStorage.getItem('snowmangameendlessbest')) || 0;
						var yscore = snowman.markercount - 1;
						if(yscore > prevbest){
						    snowman.game.populateDialog(gameovertxt + yourroute + snowmanroute + '<p>Congratulations! You got a new high score.</p><p>New high score: ' + yscore + '</p>' + gametxt + instructionbtn);
							localStorage.setItem('snowmangameendlessbest', yscore);
							snowman.bestscoretxt = bestscoretxt + yscore + '</p>';
						}
						else {
						    snowman.game.populateDialog(gameovertxt + yourroute + snowmanroute + '<p>You failed to beat your previous high score.</p><p>Previous best: ' + prevbest + '</p>' + gametxt + instructionbtn);
						}
					}
					else {
					    snowman.game.populateDialog(gameovertxt + yourroute + snowmanroute + gametxt + instructionbtn);
					}
				}

			});
			$('body').on('click','#nextlevel',function(e){
				e.preventDefault();
				snowman.game.hideDialog();
				snowman.staticgamelevel += 1;
				snowman.game.nextLevel();
			});
			$('body').on('click','.js-instructions',function(e){
				e.preventDefault();
				snowman.game.populateDialog(instructiontxt + gametxt);
			});
			$('body').on('click','#showmenu',function(e){
				e.preventDefault();
				snowman.game.populateDialog(pausetxt + gametxt + continuetxt);
			});
			$('body').on('click','#continue',function(e){
				e.preventDefault();
				snowman.game.hideDialog();
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
			if(snowman.gametype == 'endless'){
				snowman.markercount++;
				$('#yourscore').html('Level: ' + snowman.markercount);
			}
			else {
				$('#yourscore').html('');
			}
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
			snowman.yourscore = snowman.flightPath.inKm();
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
			//only show solution if in endless mode
			if(snowman.gametype === 'endless'){
				snowman.solutionFlightPath.setMap(map);
			}
			snowman.snowmanscore = snowman.solutionFlightPath.inKm();
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
		},
		addMarkers: function(){
			snowman.bounds = new google.maps.LatLngBounds(null);
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
			    snowman.bounds.extend(marker.position);
		
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
			setTimeout(function() {map.fitBounds(snowman.bounds);},1); //fit map around markers
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
			if(snowman.gametype === 'endless'){
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
			"lat": 64.371603,
			"lng": -19.160156,
			"content": "",
		},
		{
			"lat": 62.647230,
			"lng": 14.941406,
			"content": "",
		},
		{
			"lat": 50.810559,
			"lng": 19.160156,
			"content": "",
		},
		{
			"lat": 34.693444,
			"lng": -91.582031,
			"content": "",
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
	[
		{
			"lat": -44.003357,
			"lng": 169.980469,
			"content": "",
		},
		{
			"lat": 21.671039,
			"lng": 103.623047,
			"content": "",
		},
		{
			"lat": -34.500527,
			"lng": -65.566406,
			"content": "",
		},
	],
	[
		{
			"lat": 66.559917,
			"lng": 169.277344,
			"content": "",
		},
		{
			"lat": -1.288956,
			"lng": 101.777344,
			"content": "",
		},
		{
			"lat": -50.662234,
			"lng": -71.542969,
			"content": "",
		},
		{
			"lat": 19.752911,
			"lng": -100.722656,
			"content": "",
		},
	],
	[
		{
			"lat": 60.987316,
			"lng": 140.097656,
			"content": "",
		},
		{
			"lat": -23.133631,
			"lng": 44.824219,
			"content": "",
		},
		{
			"lat": -26.010722,
			"lng": 129.902344,
			"content": "",
		},
	],
	[
		{
			"lat": 46.880215,
			"lng": 9.316406,
			"content": "",
		},
		{
			"lat": 43.665217,
			"lng": 24.433594,
			"content": "",
		},
		{
			"lat": 24.633696,
			"lng": 20.917969,
			"content": "",
		},
		{
			"lat": 33.235619,
			"lng": 43.769531,
			"content": "",
		},
		{
			"lat": 0.468738,
			"lng": 114.082031,
			"content": "",
		},
		{
			"lat": 38.019245,
			"lng": 139.965820,
			"content": "",
		},
		{
			"lat": 66.884091,
			"lng": 178.945313,
			"content": "",
		},
		{
			"lat": 37.346859,
			"lng": -116.367188,
			"content": "",
		},
		{
			"lat": 52.124491,
			"lng": -105.468750,
			"content": "",
		},
		{
			"lat": -0.585934,
			"lng": -72.070313,
			"content": "",
		},
		{
			"lat": -31.852682,
			"lng": 22.500000,
			"content": "",
		},
	]
];


var introtxt = '<h1>Welcome kind volunteer!</h1><p>Thank you for agreeing to participate in this year\'s <em>Sleigh Navigation Optimal Waypoint Method Advancement Network</em>.</p><p>Santa thanks you for your involvement and hopes you will enjoy your time with us. With your help, this year\'s deliveries will be more efficient than ever!</p>';
var gametxt = '<p><span class="btn btn-primary js-begin" data-type="arcade">Arcade mode</span> <span class="btn btn-primary js-begin" data-type="endless" disabled="disabled">Endless mode</span></p>';
var gametxt2 = '<p><span class="btn btn-primary js-begin" data-type="arcade">Arcade mode</span> <span class="btn btn-primary js-begin" data-type="endless">Endless mode</span></p>';
var instructiontxt = '<h1>Instructions</h1><p>In recent years, Santa\'s deliveries have been increasingly inefficient. That\'s where you come in. Santa needs your help to improve his navigation around the globe.</p><p>Each map marker represents a hopeful young child waiting at home for a present (or in some cases, on board a ship). Starting from Santa HQ in Greenland, simply click on the map markers to form the shortest route possible - and Santa will be home before the sun rises.</p>';
var instructionbtn = '<p><span class="btn js-instructions">Instructions</span></p>';
var gameovertxt = '<h1>Game over</h1><p>Sorry, but you failed to create a better route. Please try again.</p>';
var arcadecompletetxt = '<h1>Arcade mode complete!</h1><p>Congratulations! You have completed initial training and unlocked ENDLESS MODE.</p>';
var nextleveltxt = '<p><button id="nextlevel" class="btn">Continue</button></p>';

var pausetxt = '<h1>Menu</h1>';
var continuetxt = '<p><button id="continue" class="btn">Return to game</button></p>';

var bestscoretxt = '<p class="strong">Your best Endless score: ';

$(document).ready(function(){
	snowman.general.init();
});





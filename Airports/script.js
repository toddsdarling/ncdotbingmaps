/*
function initMap() {
      setTimeout(loadMap, 1000);
    }
 
    function loadMap() {
      //init the bing map with map options
      $('#airportMap').NCDOTBingMap({
        enablePinZoom:true,
        mapCenterLat:35.3460,
        mapCenterLong: -79.4170,
        zoom:7,
        showMapTypeSelector:false
      });
 
      $("#airportMap").data("NCDOTBingMap").showTraffic();
    }
 
    function loadMapControl() {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.async = false;
      script.src = "//dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&s=1&onscriptload=loadMap";
      //script.onload = loadMap;
      document.documentElement.firstChild.appendChild(script);
    }
 
    $(document).ready(function() {
     
      // $("#bingMap").NCDOTBingMap({
      //   enablePinZoom: false,
      //   zoom: 10,
      //   mapCenterLat: 35.787743,
      //   mapCenterLong: -78.644257,
      //   showMapTypeSelector: false,
      //   disableMouseInput: true,
      //   disablePanning: true
      // });
 
      // $("#bingMap").data("NCDOTBingMap").showTraffic();
      loadMapControl();
    });
*/

    function initMap() {
      setTimeout(loadMap, 1000);
    }
 
    function loadMap() {
      $("#airportMap").NCDOTBingMap({
        enablePinZoom: false,
        zoom: 10,
        mapCenterLat: 35.787743,
        mapCenterLong: -78.644257,
        showMapTypeSelector: false,
        disableMouseInput: false,
        disablePanning: false
      });

      $.ajax({
        type: 'GET',
        url: 'transit_aviation_airports.xml',
        data: {},
        contentType: "application/xml; charset=utf-8",
        dataType: "xml",
        success: setAirportPins
      });      
 
      
    }
 
    function loadMapControl() {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = "//dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&s=1&onscriptload=loadMap";
      // script.onload = loadMap;
      document.documentElement.firstChild.appendChild(script);
    }

function setAirportPins(response) {

    //grab the array of pins
    var xmlBody = $.parseXML(response.childNodes[0].outerHTML);
    var pinArrayFromXML = $(xmlBody).find('item');
    var pinArray = [];

    //loop through the pins
    for (var i = 0 ; i < pinArrayFromXML.length; i++) {

        var parsedItem = {};
        var coordinates = {};
        var itemChildren = pinArrayFromXML[i].childNodes;

        itemChildren.forEach(function(value, key) {

          if (value.nodeName === 'title') {
            parsedItem.title = value.innerHTML;
          }

          if (value.nodeName === 'description') {

            var desc = value.innerHTML.replace('<![CDATA[', '').replace(']]>', '').replace(/^"(.*)"$/, '$1');
            parsedItem.description = desc;
          }

          if (value.nodeName === 'geo:lat') {
            coordinates.lat = value.innerHTML;
          }

          if (value.nodeName === 'geo:long') {
            coordinates.long = value.innerHTML;
          }

          if (value.nodeName === 'geo:address') {
            coordinates = value.innerHTML;
          }

          if (value.nodeName === 'icon') {
            var pinType = value.innerHTML;

            if (pinType.indexOf('passenger') !== -1) {                       
              parsedItem.iconPath = '../assets/passengerAirport.svg';                
              parsedItem.tinyIconPath = '../assets/passengerAirport-tiny.svg';                 
            } else {        
              parsedItem.iconPath = '../assets/privateAirport.svg';
              parsedItem.tinyIconPath = '../assets/privateAirport-tiny.svg';                
            }
          }

        });

        parsedItem.coordinates = coordinates;

        parsedItem.pinWidth = 45;
        parsedItem.pinHeight = 45;


        pinArray.push(parsedItem);

          /* the setPin function can take an object with the following properties: 

          coordinates: an object with 'lat' and 'long' properties,
          title: the name of this pin
          description: the infobox description
          iconPath: the path to the custom icon
          tinyIconPath: the path to the 'tiny' or zoomed out icon (this is only used if the pinZoom option is enabled
          when the map is created)*/

          
    }

    $('#airportMap').data('NCDOTBingMap').setPins(pinArray);

    
}


 
    $(document).ready(function() {
      // $(".twitter-feed").on("DOMSubtreeModified propertychange", "#twitter-widget-0", function() {
      //   $(".twitter-timeline").contents().find(".timeline-Tweet-media").css("display", "none");
      //   $(".twitter-block").css("height", "100%");
      // });
     
      // $("#bingMap").NCDOTBingMap({
      //   enablePinZoom: false,
      //   zoom: 10,
      //   mapCenterLat: 35.787743,
      //   mapCenterLong: -78.644257,
      //   showMapTypeSelector: false,
      //   disableMouseInput: true,
      //   disablePanning: true
      // });
 
      // $("#bingMap").data("NCDOTBingMap").showTraffic();
      loadMapControl();
    });






/*
$(document).ready(function() {

  var scriptTag = document.createElement('script');
  scriptTag.async = false;
  scriptTag.src = 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&onscriptload=getMap';
  scriptTag.type = 'text/javascript';

document.documentElement.firstChild.appendChild(scriptTag );
  //document.getElementsByTagName('body')[0].appendChild(scriptTag);            
  //set up 

});

function getMap() {


  //init the bing map with map options
  $('#airportMap').NCDOTBingMap({
    enablePinZoom:true,
    mapCenterLat:35.3460,
    mapCenterLong: -79.4170,
    zoom:7,
    showMapTypeSelector:false
  });
 
  /* since the pin data could come from a variety of sources, the call to get the pins
  stays in the HTML, not in the jQuery plugin */
  
  //make the call to load the map pin data

  /*
  $.ajax({
    type: 'GET',
    url: 'transit_aviation_airports.xml',
    data: {},
    contentType: "application/xml; charset=utf-8",
    dataType: "xml",
    success: setAirportPins
  });


}

function setAirportPins(response) {

    //grab the array of pins
    var xmlBody = $.parseXML(response.childNodes[0].outerHTML);
    var pinArrayFromXML = $(xmlBody).find('item');
    var pinArray = [];

    //loop through the pins
    for (var i = 0 ; i < pinArrayFromXML.length; i++) {

        var parsedItem = {};
        var coordinates = {};
        var itemChildren = pinArrayFromXML[i].childNodes;

        itemChildren.forEach(function(value, key) {

          if (value.nodeName === 'title') {
            parsedItem.title = value.innerHTML;
          }

          if (value.nodeName === 'description') {

            var desc = value.innerHTML.replace('<![CDATA[', '').replace(']]>', '').replace(/^"(.*)"$/, '$1');
            parsedItem.description = desc;
          }

          if (value.nodeName === 'geo:lat') {
            coordinates.lat = value.innerHTML;
          }

          if (value.nodeName === 'geo:long') {
            coordinates.long = value.innerHTML;
          }

          if (value.nodeName === 'geo:address') {
            coordinates = value.innerHTML;
          }

          if (value.nodeName === 'icon') {
            var pinType = value.innerHTML;

            if (pinType.indexOf('passenger') !== -1) {                       
              parsedItem.iconPath = '../assets/passengerAirport.svg';                
              parsedItem.tinyIconPath = '../assets/passengerAirport-tiny.svg';                 
            } else {        
              parsedItem.iconPath = '../assets/privateAirport.svg';
              parsedItem.tinyIconPath = '../assets/privateAirport-tiny.svg';                
            }
          }

        });

        parsedItem.coordinates = coordinates;

        parsedItem.pinWidth = 45;
        parsedItem.pinHeight = 45;


        pinArray.push(parsedItem);

          /* the setPin function can take an object with the following properties:

          coordinates: an object with 'lat' and 'long' properties,
          title: the name of this pin
          description: the infobox description
          iconPath: the path to the custom icon
          tinyIconPath: the path to the 'tiny' or zoomed out icon (this is only used if the pinZoom option is enabled
          when the map is created)

          
    }

    $('#airportMap').data('NCDOTBingMap').setPins(pinArray);

    
}    */
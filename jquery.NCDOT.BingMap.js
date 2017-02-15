/** This is the Bing Maps jQuery plugin used for NCDOT 

This plugin will handle the following:
- creating the map
- placing pins
- building the custon infobox
- showing and hiding the custom infobox when you click a pin
- showing traffic

This plugin does NOT handle
- ensuring jQuery and the Bing Maps script is loaded
- getting any external data for the pins/descriptions
- styling the map container (that's assumed to be handled by the page you're loading the map on)

To use the plugin, attach it to a DOM element similiar to other jQuery plugins. You can pass it a options
object:

$('#myMapDiv').NCDOTBingMap({
  enablePinZoom:true,
  mapCenterLat:35.3460,
  mapCenterLong: -79.4170,
  zoom:7,
  showMapTypeSelector:false
});

To call a method on the plugin, you would call it like this:

$('#myMapDiv').data('NCDOTBingMap').setPins(pinArray);

or 

$('#myMapDiv').data('NCDOTBingMap').showTraffic();




Options you can set:
  enablePinZoom (false by default): This will change pins to show smaller pins when zoomed out and larger pins when
 zoomed in. NOTE: You will need to pass in custom pins for this. This should only be set where you have
 a large amount of pins. Pass true to turn it on

  mapCenteLat: Latitude for where the map should be centered
  mapCenterLong: Longitude for where the map should be centered
  (the default is to be centered in the center of NC)

  mapCenterAddress: You can optionally pass an address to center the map on.  NOTE: This will override the previous parameters
  if you set it.

  zoom: set a zoom level for the map (7 by default)

  showMapTypeSelector (false by default): Pass true to turn on the Bing Maps dropdown that lets you select the
  different type of maps (street, birds eye, etc.)

  disableMouseInput (false by default): This disables the ability to interact with the map via mouse. You would set this to true
  if you want a static map

  disablePanning (false by default): This disables the ability to pan the map around. You would set this to true if you want a static map

Plugin methods:

- setPins
  Pass this function an array of pin objects to place them on the map
  A pin object has the following properties:

  title (String, optional): This will show in the infobox when the pin is clicked
  description (String, optional): This will show in the infobox when the pin is clicked

  NOTE: If BOTH title and description aren't set, no infobox will open when this pin is clicked

  coordinates (Object or String, required): Object with two properties 'lat' and 'long' or a string representing
  the address you'd like to place a pin on.  
  iconPath (String, optional): This is the path to the custom pin icon
  tinyIconPath (String, optional, required for pin zoom): This is the path to the 'zoomed out' icon 
  width (Number, optional): set the pin width
  height (Number, optional): set the pin height
  tinyPinWidth (Number, optional): sets the tiny pin width
  tinyPinHeight (Number, optional): sets the tiny pin height

- openInfoBox
  You generally won't call this, as it's called internally when you click a pin.  Pass it the pin that
  was clicked and it will open the infobox for that pin

  NOTE:  This also sets a 'blockClick' handler for the map so that if you click on the map it will close
  the infobox and also makes it so you can't scroll the map using the mousewheel (so that you can scroll the
  infobox if needed)

- setInfoBoxContent
  You generally won't call this as it's called internally when you click a pin. It takes the pin that was
  clicked, reads the description out of the metadata and sets the description of the infobox

- closeInfoBox
  This closes the currently open infobox and removes the 'blockClick' handler from the map

- zoomPins
  If the pin zoom option is enabled, this handles swapping out the pins when the map is zoomed beyond
  a certain level. You won't call this function.

- showTraffic
  This method takes no parameters and will load the traffic module and show it over the current map

- parseGeocodeResult
  This method simply steps through the geocoding result object which is rather large and pulls out the
  coordinates that come back. It's called whenever a geocoding request comes through

*/

(function($) {

  "use strict";
  $.NCDOTBingMap = function(element, options) {

    //set some default map options
    //by default, the map is centered and zoomed to show the whole state
    var defaultOptions = {
      enablePinZoom: false,
      mapCenterLat: 35.3460,
      mapCenterLong: -79.4170,
      zoom: 7,
      showMapTypeSelector: false,
      credentials: 'AhZV-7p6O0GkB7SWeEMYX3AGi9jxHMOaI7H9aqlymzHRWRomi3YMKxf3G4jzmnCp',
      disableMouseInput: false,
      disablePanning: false
    };

    var plugin = this;
    plugin.element = element;

    //this is our standard markup for an infobox which is rendered out with Handlebars
    plugin.infoboxMarkup = '\
      <div class="bing-map__infobox">\
      <a class="bing-map__infobox-close" href="#">x</a>\
      <div class="bing-map__infobox-title">{{title}}</div>\
      {{{description}}}\
      </div>';

    plugin.zoomedOutPinArray = [];
    plugin.zoomedInPinArray = [];

    plugin.settings = {};

    plugin.init = function() {

      plugin.settings = $.extend({}, defaultOptions, options);

      //if you pass an address to center the map around
      //ateempt to geocode it
      if (options.mapCenterAddress) {


        var searchRequestURL = 'https://dev.virtualearth.net/REST/v1/Locations?q=' + encodeURIComponent(options.mapCenterAddress) + '&key=' + plugin.settings.credentials;

        $.ajax({
          url: searchRequestURL,
          dataType: "jsonp",
          jsonp: 'jsonp'
        }).then(function(result) {
          var resultsCoords = plugin.parseGeocodeResult(result);
          if (resultsCoords != null) {
            plugin.map.setView({
              center: new Microsoft.Maps.Location(resultsCoords.lat, resultsCoords.long)
            });
          }
        });
      }

      //create the map
      plugin.map = new Microsoft.Maps.Map(element, {
        credentials: plugin.settings.credentials,
        center: new Microsoft.Maps.Location(plugin.settings.mapCenterLat, plugin.settings.mapCenterLong),
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        zoom: plugin.settings.zoom,
        showMapTypeSelector: plugin.settings.showMapTypeSelector,
        disableMouseInput: plugin.settings.disableMouseInput,
        disablePanning: plugin.settings.disablePanning,
        enableSearchLogo: false
      });

      //add the bing-map class onto the container element so it will pick up the A style
      //to fix the transition
      $(element).addClass('bing-map');

      
      //remove double click handler
      Microsoft.Maps.Events.addHandler(plugin.map, 'dblclick', function(e) {
      
        var eventTarget = e.originalEvent.target;
        var eventTargetParent = e.originalEvent.target.offsetParent;        

        if ((eventTarget.className.length > 0) || (eventTargetParent)) {

          if (eventTarget.className.indexOf('bing-map__infobox') > -1 || eventTargetParent.className.indexOf('bing-map__infobox') > -1) {
            e.handled = true;
          }

        }
      });
      

      //add the infobox to the map container DIV
      //it starts off screen to the right
      var bingMapContainer = element.querySelector('.MicrosoftMap');
      var infoBox = document.createElement('div');
      infoBox.className += '  bing-map__infobox-wrapper';
      bingMapContainer.appendChild(infoBox);

      if (plugin.settings.enablePinZoom) {

        Microsoft.Maps.Events.addHandler(plugin.map, 'viewchangeend', function() {
          //call the show pins function and pass it the end zoom of the map    
          plugin.zoomPins(plugin.map.getTargetZoom());
        });
      }


    }

    //call the init function
    plugin.init();

    /**** External methods for this plugin below ****/

    /* the setPin function can take an object with the following properties:

    coordinates: an object with 'lat' and 'long' properties,
    title: the name of this pin
    description: the infobox description
    iconPath: the path to the custom icon
    tinyIconPath: the path to the 'tiny' or zoomed out icon (this is only used if the pinZoom option is enabled
    when the map is created)
    width: the width of the large pin
    height: the height of the large pin
    tinyPinWidht: the width of the 'tiny' pin
    tinyPinHeight: the height of the 'tiny' pin

    */

    plugin.setPins = function(pinArray) {

      var pinOptions = {
        anchor: new Microsoft.Maps.Point(11, 22),
        visible: false,
        typeName: 'blah'
      };

      for (var i = 0; i < pinArray.length; i++) {

        var pinObj = pinArray[i];

        //if there's a custom icon passed in, set it
        if (pinObj.iconPath) {
          pinOptions.icon = pinObj.iconPath;
        }

        //create the pin with 0, 0 coordinates.  This will updated down below
        //either through the coordinates passed in or through geocoding
        var pin = new Microsoft.Maps.Pushpin(
          new Microsoft.Maps.Location(0, 0),
          pinOptions
        );

        //if you pass a width and height set that on the pin
        if (pinObj.pinWidth) {
          pin.setOptions({
            width: pinObj.pinWidth
          });
        }

        if (pinObj.pinHeight) {
          pin.setOptions({
            height: pinObj.pinHeight
          })
        }

        //if there's a title or description for the pin, add the click handler
        //for the infobox
        if (pinObj.title || pinObj.description) {
          //Add a click event handler to the pin.
          Microsoft.Maps.Events.addHandler(pin, 'click', this.openInfoBox);
          //Microsoft.Maps.Events.addHandler(pin, 'mouseover', this.openInfoBox);
          //Microsoft.Maps.Events.addHandler(pin, 'mouseout', this.openInfoBox);
        }

        pin.metadata = {};

        //add title and description for infobox
        //if they get passed in
        if (pinObj.title) {
          pin.metadata = $.extend(pin.metadata, {
            title: pinObj.title
          });
        }

        if (pinObj.description) {
          pin.metadata = $.extend(pin.metadata, {
            description: pinObj.description
          })
        }

        if (plugin.settings.enablePinZoom) {
          var tinyPin = new Microsoft.Maps.Pushpin(
            new Microsoft.Maps.Location(pinObj.coordinates.lat, pinObj.coordinates.long),
            pinOptions
          );

          tinyPin.metadata = pin.metadata;

          tinyPin.setOptions({
            icon: pinObj.tinyIconPath,
          });

          if (pinObj.tinyPinWidth) {
            tinyPin.setOptions({
              width: pinObj.tinyPinWidth,
            });
          }

          if (pinObj.tinyPinHeight) {
            tinyPin.setOptions({
              height: pinObj.tinyPinHeight,
            });
          }

          //if there's a title or description for the pin, add the click handler
          //for the infobox to the tiny pin as well
          if (pinObj.title || pinObj.description) {
            //Add a click event handler to the pin.
            Microsoft.Maps.Events.addHandler(tinyPin, 'click', this.openInfoBox);
          }

          //add each pin to their array
          plugin.zoomedOutPinArray.push(tinyPin);
          plugin.zoomedInPinArray.push(pin);

          plugin.map.entities.push(tinyPin);
          plugin.map.entities.push(pin);

        } else {

          //if you're not dealing with zoomed pins, just set the pin to visible
          pin.setOptions({
            visible: true
          });
        }

        //if you pass a string for the coodinates parameter, the plugin assumes its an address
        //and attempts to geocode it

        if (typeof pinObj.coordinates === 'string' || pinObj.coordinates instanceof String) {

          var searchRequestURL = 'https://dev.virtualearth.net/REST/v1/Locations?q=' + encodeURIComponent(pinObj.coordinates) + '&key=' + plugin.settings.credentials;

          //create the contextObj to hold a reference to the CURRENT pin (and tiny pin, if needed)
          //so when the AJAX completes you'll have the reference you need
          var contextObj = {
            pin: pin
          }

          if (tinyPin) {
            contextObj.tinyPin = tinyPin;
          }

          $.ajax({
            url: searchRequestURL,
            dataType: "jsonp",
            jsonp: 'jsonp',
            context: contextObj
          }).then(function(result) {
            var resultsCoords = plugin.parseGeocodeResult(result);
            if (resultsCoords != null) {
              this.pin.setLocation(new Microsoft.Maps.Location(resultsCoords.lat, resultsCoords.long));
              //check if you need to set the location of the tiny pin
              if (plugin.settings.enablePinZoom) {
                this.tinyPin.setLocation(new Microsoft.Maps.Location(resultsCoords.lat, resultsCoords.long));
              }

            }
          });

        } else {
          var pinLocation = new Microsoft.Maps.Location(pinObj.coordinates.lat, pinObj.coordinates.long);
          pin.setLocation(pinLocation)

        }

        plugin.map.entities.push(pin);

      }

      //when you're done adding all the pins, call the zoomPins function
      //of the plugin to set the correct pin
      if (plugin.settings.enablePinZoom) {
        plugin.zoomPins();
      }
    }

    /* this function calls the method to set the infobox content then adds the appropriate classes
    to the infobox to open it */
    plugin.openInfoBox = function(e) {

      var infoBox = plugin.element.querySelector('.bing-map__infobox-wrapper');

      //this sets all the content of the info box. Pass it the event target
      plugin.setInfoBoxContent(this);

      //disable click actions and nousewheel actions on the map (so you can scroll the infobox with the mousewheel)
      plugin.clickHandler = Microsoft.Maps.Events.addHandler(plugin.map, 'click', plugin.blockClick);
      plugin.mouseWheelHandler = Microsoft.Maps.Events.addHandler(plugin.map, 'mousewheel', plugin.blockScrollWheel);

      //add the open class to the infobox which will open it
      $(infoBox).addClass('open');

      //set the map to center on that pin and zoom in
      plugin.map.setView({
        center: this.target.getLocation(),
      });

    }

    /* set the infobox content for a pin.  This is called from the 'openInfoBox' function */
    plugin.setInfoBoxContent = function(e) {

      var infoBox = plugin.element.querySelector('.bing-map__infobox-wrapper');
      var context = {};
      var infoBoxTemplate = Handlebars.compile(this.infoboxMarkup);
      var infoBoxHTML;
      var closeLink;

      if (e.target.metadata.title) {
        context = $.extend(context, {
          title: e.target.metadata.title
        });
      }

      if (e.target.metadata.description) {
        context = $.extend(context, {
          description: e.target.metadata.description
        });
      }

      infoBoxHTML = infoBoxTemplate(context);

      infoBox.innerHTML = infoBoxHTML;

      //adds the event listener for close button
      infoBox.querySelector('.bing-map__infobox-close').addEventListener('mousedown', plugin.closeInfoBox);

    }

    /* ONLY when the infobox is open, this checks to see if you clicked
    on the map to close the infobox and also blocks scrolling on the map
    so you can scroll the infobox. This handler is set on openInfoBox (and removed on closeInfoBox) */

    plugin.blockClick = function(e) {

      //need to check 2 items:  The event.target and the event.target.offsetparent
      //if the event.target is the infobox you clicked on the box itself but none of its children
      //if the event.target.offsetparent is the infobox that means you clicked on one of the infoboxes children
      var eventTarget = e.originalEvent.target;
      var eventTargetParent = e.originalEvent.target.offsetParent;
      var infoBoxClick = false;

      if ((eventTarget.className.length > 0) || (eventTargetParent)) {

        if (eventTarget.className.indexOf('bing-map__infobox') > -1 || eventTargetParent.className.indexOf('bing-map__infobox') > -1) {
          infoBoxClick = true;
        }

        if (infoBoxClick === true) {
          //if you've clicked in the infobox, block the click event on the map
          e.handled = true;
        } else {
          //if you've clicked on a pin, don't close the infobox again, keep it open and replace it
          if (e.targetType !== 'pushpin') {
            //if you've clicked on the map, close the infobox
            plugin.closeInfoBox(e);
          }

        }
      }
    }

    plugin.blockScrollWheel = function(e) {
      if (e.targetType == 'map') {
        e.handled = true;
      }
    }

    /* closes the infobox and removes the blockClick so that the map
    will function normally when the infobox is closed */

    plugin.closeInfoBox = function(e) {

      /* if you click directly on the map to close the infobox, the
      map object is sent instead of a click event. If you click the "x" on the infobox
      the normal click event gets sent (which has preventDefault). So need to check if the event
      has a preventDefault param */ 
      if (e.preventDefault) {
        e.preventDefault();  
      }

      

      var infoBox = $(e.target).parents('.bing-map__infobox-wrapper');

      //remove the click and mousewheel handler so the map can function normally
      Microsoft.Maps.Events.removeHandler(plugin.clickHandler);
      Microsoft.Maps.Events.removeHandler(plugin.mouseWheelHandler);

      //rmeove the open class from the infobbox
      $(infoBox).removeClass('open');
    }

    /* this handles showing/hiding the tiny pin/large pin when you zoom out/zoom in on
    the map */
    plugin.zoomPins = function() {

      //this is called once the map is done building and also whenever the user
      //zooms the map.  If the map is "zoomed out" enough, it loops through both 
      //arrays showing the "zoomed out" pins and hiding the "zoomed in" pins
      var zoomLevel = plugin.map.getTargetZoom();

      if (zoomLevel > 7) {

        for (var i = 0; i < plugin.zoomedOutPinArray.length; i++) {
          plugin.zoomedOutPinArray[i].setOptions({
            visible: false
          });
        }

        for (var j = 0; j < plugin.zoomedInPinArray.length; j++) {
          plugin.zoomedInPinArray[j].setOptions({
            visible: true
          });
        }
        //reverse for if the map is zoomed in. If the map is "zoomed in" enough,  
        //it shows the "zoomed in" pins and hiding the "zoomed out" pins    
      } else if (zoomLevel <= 7) {

        for (var i = 0; i < plugin.zoomedOutPinArray.length; i++) {
          plugin.zoomedOutPinArray[i].setOptions({
            visible: true
          });
        }

        for (var j = 0; j < plugin.zoomedInPinArray.length; j++) {
          plugin.zoomedInPinArray[j].setOptions({
            visible: false
          });
        }
      }
    };

    plugin.enablePinHover = function() {

      Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', { callback: function() {} });

    }


    /* shows the traffic layer on the map */
    plugin.showTraffic = function() {

      //if you need a traffic map, load the traffic module and display it
      Microsoft.Maps.loadModule('Microsoft.Maps.Traffic', {
        callback: function() {
          var trafficLayer = new Microsoft.Maps.Traffic.TrafficLayer(plugin.map);
          //need to call show traffic layer with a delay
          setTimeout(function() {
            trafficLayer.show();
          }, 1000);
          // show the traffic Layer             
        }
      });
    }

    plugin.parseGeocodeResult = function(result) {
      if (result.resourceSets[0].resources.length == 0) {
        return null;
      } else {
        var coordObj = {};
        coordObj.lat = result.resourceSets[0].resources[0].geocodePoints[0].coordinates[0];
        coordObj.long = result.resourceSets[0].resources[0].geocodePoints[0].coordinates[1];
        return coordObj;
      }
    }

    plugin.createDropdownControl = function(whichDropdown) {

      //empty dropdown of all the options
      $(whichDropdown).empty();

      //get the array of pins from the map
      var pinArray = plugin.map.entities;

      //create the first empty option
      var optionTag = document.createElement('option');
      optionTag.innerHTML = 'Select...';
      optionTag.setAttribute('value', '');
      whichDropdown.appendChild(optionTag);

      for (var i = 0; i < pinArray.getLength(); i++) {

        var pin = pinArray.get(i);

        optionTag = document.createElement('option');
        optionTag.innerHTML = pin.metadata.title;
        optionTag.setAttribute('value', pin.metadata.title);

        whichDropdown.appendChild(optionTag); 
      }

      //stash the pinArray on the dropdown function to reference it from the listener
      whichDropdown.pinArray = pinArray;

      whichDropdown.addEventListener('change', function() {
        
        //get all the pins
        var pinArray = this.pinArray;

        for (var i = 0; i < pinArray.getLength(); i++) {

            var pin = pinArray.get(i);

            if (pin.metadata.title === this.value) {
              Microsoft.Maps.Events.invoke(pin, 'click');
            }
        }
      }, false);


    }



  }


  // add the plugin to the jQuery.fn object
  $.fn.NCDOTBingMap = function(options) {

    // iterate through the DOM elements we are attaching the plugin to
    return this.each(function() {

      // if plugin has not already been attached to the element
      if (undefined == $(this).data('NCDOTBingMap')) {

        // create a new instance of the plugin
        // pass the DOM element and the user-provided options as arguments
        var plugin = new $.NCDOTBingMap(this, options);

        // in the jQuery version of the element
        // store a reference to the plugin object
        // you can later access the plugin and its methods and properties like
        // element.data('pluginName').publicMethod(arg1, arg2, ... argn) or
        // element.data('pluginName').settings.propertyName
        $(this).data('NCDOTBingMap', plugin);

      }

    });

  }

}(jQuery));

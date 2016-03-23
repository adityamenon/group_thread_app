/**
  * Features that reamin to be implemented.
  * 1. Add a friend's Username
  * 2. Accept/reject incoming friend requests
  * ✔ 3. Show my marker in the map and make it move as I move
  * ✔ 4. Update my current coordinates into deepstream.io
  * 5. Subscribe to friends' location and render their pins as they move in the map
  * 6. Select friend from dropdown to get walking directions to their location
  * 7. Display message that someone is walking to you when they are
  * 8. If friend is moving then change the directions accordingly
  * 9. A new "Smove" page in the app
  * 10. Book a Smove for all friends after choosing each one with a radio button
  * 11. Display a message in your screen when friend has requested a Smove for you
**/

angular.module('gta', ['ionic', 'uiGmapgoogle-maps', 'gta.controllers', 'gta.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.welcome', {
    url: '/welcome',
    views: {
      'tab-welcome': {
        templateUrl: 'templates/tab-welcome.html',
        controller: 'WelcomeCtrl'
      }
    }
  })

  .state('tab.coe', {
      url: '/checkOnEveryone',
      views: {
        'tab-coe': {
          templateUrl: 'templates/tab-coe.html',
          controller: 'WTFCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/welcome');
})

.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        libraries: 'weather,geometry,visualization'
    });
});

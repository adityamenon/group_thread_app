var dsanon = new deepstream('127.0.0.1:6030').login();

angular.module('gta.controllers', []).controller('MainCtrl', function ($scope, LoginData) {
  $scope.loginData = LoginData;
  $scope.$watch(
    function () {
      return LoginData;
    },
    function (newVal) {
      $scope.loginData = newVal;
    });
}).controller('WTFCtrl', function ($scope, $state, uiGmapGoogleMapApi) {
  var geoOptions = {
    enableHighAccuracy: true,
    maximumAge: 6000,
    timeout: 5400
  };

  $scope.map = {
    center: {
      latitude: null,
      longitude: null
    },
    zoom: 18
  };

  $scope.marker = {
    coords: {
      latitude: null,
      longitude: null
    }
  };

  if ($scope.loginData.status !== true) $state.go('tab.welcome');

  uiGmapGoogleMapApi.then(function (maps) {
    navigator.geolocation.watchPosition(
      function (p) {
        console.log(p);

        $scope.$apply(function () {
          $scope.map.center.latitude = p.coords.latitude;
          $scope.map.center.longitude = p.coords.longitude;

          $scope.marker.coords.latitude = p.coords.latitude;
          $scope.marker.coords.longitude = p.coords.longitude;

          dsanon.record.getRecord("user/"+$scope.loginData.user.username).set('coords.latitude', p.coords.latitude);
          dsanon.record.getRecord("user/"+$scope.loginData.user.username).set('coords.longitude', p.coords.longitude);
        });
      },
      function (e) {
        console.log(e);
        $scope.gpsError = e;
      },
      geoOptions
    );
  });
}).controller('WelcomeCtrl', function(
  $rootScope, $scope, $ionicModal, $http, $ionicPopup, $state, LoginData
) {
  if (LoginData.status === true) {
    $state.go('tab.coe');
  }

  $ionicModal.fromTemplateUrl('templates/modals/signup.html', {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.registerModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/modals/login.html', {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.loginModal = modal;
  });

  $scope.loginForm = {};
  $scope.signupForm = {};

  $scope.execLogin = function () {
      var username = $scope.loginForm.Username,
          password = $scope.loginForm.Password;

      record = dsanon.record.getRecord('user/'+username);

      record.whenReady(function () {
        record.discard();

        if (record.get("password") === password) {
          LoginData.status = true;
          LoginData.user = record.get();

          $ionicPopup.alert({
              "template": "You're now Logged In!"
          }).then(function () {
              $scope.loginModal.hide();
              $state.go('tab.coe');
          });
        } else {
          $ionicPopup.alert({
              "template": "Login failed!"
          }).then(function () {
              $scope.loginModal.hide();
              $state.go('tab.welcome');
          });
        }
      });
  };

  $scope.execSignup = function () {
      var fullName = $scope.signupForm.FullName,
          username = $scope.signupForm.Username,
          password = $scope.signupForm.Password;

      dsanon.on('error', function (err) {
        console.log("Anonymous Deepstream connection error: ", err);
      });

      dsanon.record.getRecord("user/"+username).set({
        fullName: fullName,
        username: username,
        password: password, // This is a PoC, there are a LOT of other security concerns as well - needs more architecting overall,
        coords: {
          latitude: null,
          longitude: null
        }
      });

      $ionicPopup.alert({
          "template": "Registration completed! Please login now."
      }).then(function () {
          $scope.registerModal.hide();
          $scope.loginModal.show();
      });
  };
});

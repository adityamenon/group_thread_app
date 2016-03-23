var dsanon = new deepstream('127.0.0.1:6030').login();

angular.module('gta.controllers', [])

.controller('WelcomeCtrl', function(
  $rootScope, $scope, $ionicModal, $http, $ionicPopup, $state
) {
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
        if (record.get("password") === password) {
          record.discard();
          $ionicPopup.alert({
              "template": "You're now Logged In!"
          }).then(function () {
              $scope.loginModal.hide();
              $state.go('tab.basicInfoSurvey');
          });
        } else {
          $ionicPopup.alert({
              "template": "Login failed!"
          }).then(function () {
              $scope.loginModal.hide();
              $state.go('tab.login');
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
        password: password // This is a PoC, there are a LOT of other security concerns as well - needs more architecting overall
      });

      $ionicPopup.alert({
          "template": "Registration completed! Please login now."
      }).then(function () {
          $scope.registerModal.hide();
          $scope.loginModal.show();
      });
  };
})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});

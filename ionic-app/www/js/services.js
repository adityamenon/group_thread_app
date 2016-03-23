angular.module('gta.services', [])

.factory('LoginData', function() {
  return {
    status: false,
    user: {
      username: "anonymous"
    }
  };
});

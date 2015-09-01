angular
    .module('FantasyFootballTools',[])
    .controller('draftCtrl',function($scope, LoadPlayersService, $http,  $log){
        var init = function(){

            $scope.players = [];
            LoadPlayersService.fetch().then(function(data) {
                $scope.players= data.players;
                console.log($scope.players);
            })
        }

        init();
    })
    .factory('LoadPlayersService', function($q,$timeout,$http) {
        var heroes = {
            fetch: function(callback) {
                var deferred = $q.defer();
                $timeout(function() {
                    $http.get("data.json").success(function(data) {
                        deferred.resolve(data);
                    });
                }, 30);

                return deferred.promise;
            }
        };

        return heroes;
    });
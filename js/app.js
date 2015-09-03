angular
    .module('FantasyFootballTools',['mgcrea.ngStrap'])
    .controller('draftCtrl',function($scope, LoadPlayersService, $modal, $http,  $log){
        var init = function(){

            $scope.players = [];
            $scope.keepers = [];
            $scope.showDraftBoard = false;
            $scope.keeperTime = true;
            $scope.draftOver = false;
            $scope.draftTime = false;
            $scope.selPlayer=null;
            $scope.selField=null;
            $scope.config = null;
            LoadPlayersService.fetch().then(function(data) {
                $scope.players= data.players;
                $scope.players.each(function(n){
                    n.available = true;
                })
                if (data.configOptions){
                    console.log("YAHOOEY");
                    $scope.configOptions = data.configOptions;
                }
            })

            $scope.colorScale= {
                QB:"#a3c8ff",
                RB:"#a3ff8c",
                WR:"red",
                TE:"orange",
                K:'purple',
                DST:'pink'
            }

            $scope.teams = {number:10, teams:[]};
            $scope.rounds = {number:16, rounds:[]};
            $scope.filters = ['All','QB','RB','WR','TE','K','DST'];
            $scope.filter = 'All';
            $scope.strategy = 'BVN';

            $scope.editNameModal = $modal({scope: $scope, template: 'modal/editNameModal.tpl.html', show: false});
        }

        $scope.changeName = function(team) {
            $scope.teamData = team;
            console.log(team.roster);
            $scope.editNameModal.$promise.then($scope.editNameModal.show);
        };

        $scope.loadConfig = function(config){
            $scope.config = config;
        }

        $scope.createBoard = function(){
            if ($scope.config){
                $scope.teams = $scope.config.config.teams;
                $scope.rounds = $scope.config.config.rounds;
            }
            if ($scope.teams.teamNames){
                for (var i = 1; i <= $scope.teams.number ; i++){
                    $scope.teams.teams.push({name:$scope.teams.teamNames[i-1],number:i,picks:{},players:[]});
                }
            }else {
                for (var i = 1; i <= $scope.teams.number ; i++){
                    $scope.teams.teams.push({name:'Team '+i,number:i,picks:{},players:[]});
                }
            }
            for (var i = 1; i <= $scope.rounds.number ; i++){
                $scope.rounds.rounds.push({number:i,picks:{}});
            }

            $scope.showDraftBoard = true;
            if ($scope.config){
                if ($scope.config.config.keepers){
                    $scope.keepers = $scope.config.config.keepers;
                    $scope.addKeepers();
                }
            }
            $scope.keeperTime = true;
        }

        $scope.selectField = function(round,team){
            $scope.selField = {round:round.number, team:team.number, name:team.name};
        }

        $scope.selectPlayer = function(player){
            $scope.selPlayer = player;
        }

        $scope.setFilter = function(filter){
            $scope.filter = filter;
        }

        $scope.startDraft = function(){
            $scope.draftTime= true;
            $scope.keeperTime = false;

            $scope.selField = $scope.nextOnTheClock();
        }

        $scope.draftPlayer = function(){
            $scope.addKeeper();
            $scope.selField = $scope.nextOnTheClock();
        }

        $scope.simPick = function(){
            $scope.findBestPlayer($scope.selField.round,$scope.selField.team);
            $scope.selField = $scope.nextOnTheClock();
        }

        $scope.nextOnTheClock = function(){
            $scope.selPlayer = null;
            $scope.selField = null;
            for (var i = 1; i <= $scope.rounds.number ; i++){
                if (i%2 == 0){
                    for (var j = $scope.teams.number;j>0;j--){
                        if ($scope.rounds.rounds[i-1].picks[j]){
                        } else {
                            var field = {round:i, team:j, name:$scope.teams.teams[j-1].name};
                            return field;
                        }
                    }
                } else {
                    for (var j = 1;j<=$scope.teams.number;j++){
                        if ($scope.rounds.rounds[i-1].picks[j]){
                        } else{
                            var field = {round:i, team:j, name:$scope.teams.teams[j-1].name};
                            return field;
                        }
                    }
                }
            }
            $scope.draftOver = true;
            $scope.draftTime = false;
        }

        $scope.simDraft = function(){
            $scope.keeperTime = false;
            $scope.selPlayer = null;
            $scope.selField = null;
            for (var i = 1; i <= $scope.rounds.number ; i++){
                if (i%2 == 0){
                    for (var j = $scope.teams.number;j>0;j--){
                        $scope.findBestPlayer(i,j);
                    }
                } else {
                    for (var j = 1;j<=$scope.teams.number;j++){
                        $scope.findBestPlayer(i,j);
                    }
                }
            }
            $scope.draftOver = true;
            $scope.draftTime = false;
        }

        $scope.findBestPlayer = function(round,team){
            if ($scope.rounds.rounds[round-1].picks[team]){
                $scope.selPlayer = null;
                $scope.selField = null;
            } else {
                $scope.selField = {round:round, team:team, name:$scope.teams.teams[team-1].name};
                var k = 0;
                var fullteam = $scope.teams.teams[team-1];
                while ($scope.selPlayer == null){
                    if ($scope.players[k].available == true){
                        var player = $scope.players[k];
                        if ($scope.starter(player,fullteam)){
                            $scope.selPlayer = player;
                        } else {
                            console.log("Passed on " + player.name);
                        }
                    }
                    k++;
                }
                $scope.addKeeper();
            }
        }

        $scope.addKeeper = function(){
            $scope.selPlayer.round = $scope.selField.round;
            $scope.selPlayer.team = $scope.selField.name;
            $scope.teams.teams[$scope.selField.team - 1].picks[$scope.selField.round] = $scope.selPlayer;
            $scope.teams.teams[$scope.selField.team - 1].players.push($scope.selPlayer);
            $scope.rounds.rounds[$scope.selField.round - 1].picks[$scope.selField.team] = $scope.selPlayer;
            $scope.selPlayer.available = false;
            $scope.selPlayer = null;
            $scope.selField = null;
        }

        $scope.addKeepers = function(){
            for (var i = 0; i < $scope.keepers.length; i++){
                var keep = $scope.keepers[i];
                $scope.selField = {round:keep.round_num, team:keep.team_num, name:$scope.teams.teams[keep.team_num-1].name}
                var player = $scope.players.filter(function(player){
                    return player.name.indexOf(keep.player) != -1;
                });
                $scope.selPlayer = player[0];
                $scope.addKeeper();
            }
        }

        $scope.starter = function(player, team){
            var starters = {
                QB:0,
                RB:0,
                WR:0,
                TE:0,
                FLEX:0,
                K:0,
                DST:0,
                BENCH:0
            };
            var count = {
                QB:0,
                RB:0,
                WR:0,
                TE:0,
                K:0,
                DST:0
            };
            var cap = {
                QB:1,
                RB:2,
                WR:2,
                TE:1,
                FLEX:2,
                K:1,
                DST:1,
                BENCH:6
            }

            var max = {
                QB:2,
                RB:5,
                WR:7,
                TE:2,
                K:1,
                DST:1
            }

            if (team && $scope.strategy == 'BVN'){
                var i = 0;
                team.roster = {QB:[],RB:[],WR:[],TE:[],FLEX:[],K:[],DST:[],BENCH:[]};
                team.players.each(function(n){
                    count[n.pos]++;
                    if (starters[n.pos] >= cap[n.pos]){
                        if (['RB','WR','TE'].indexOf(n.pos) > -1){
                            if (starters.FLEX == cap.FLEX){
                                starters['BENCH']++;
                                team.roster.BENCH.push(n);
                            } else {
                                starters['FLEX']++;
                                team.roster.FLEX.push(n);
                            }
                        } else {
                            starters['BENCH']++;
                            team.roster.BENCH.push(n);
                        }
                    } else {
                        starters[n.pos]++;
                        team.roster[n.pos].push(n);
                    }
                    i++;
                });

                if (count[player.pos] >=max[player.pos]){return false;}

                if (starters[player.pos] >= cap[player.pos]){
                    if (['RB','WR','TE'].indexOf(player.pos) > -1){
                        if (starters['FLEX']<cap['FLEX']){
                            team.roster.FLEX.push(player);
                            return true;
                        } else if (i < $scope.rounds.number - 2 + starters['K'] + starters['DST']){
                            team.roster.BENCH.push(player);
                            return true;
                        } else return false;
                    } else if (player.pos == 'QB'){
                        if (count['QB'] == 1 && i > 7 && i < $scope.rounds.number - 2 + starters['K'] + starters['DST']){
                            team.roster.BENCH.push(player);
                            return true;
                        } else return false;
                    } else {
                        console.log(player.pos);
                        return false;
                    }
                } else {
                    team.roster[player.pos].push(player);
                    return true;
                }
            } else {return false;}
        }

        $scope.resetDraft = function(){
            init();
        }

        $scope.showPlayers = function(){
            this.show= !this.show;
            console.log($scope.showFilters);
        }

        init();
    })
    .factory('LoadPlayersService', function($q,$timeout,$http) {
        var players = {
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

        return players;
    });
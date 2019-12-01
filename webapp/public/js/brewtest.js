(function (){
    'use strict';

    window.chartColors = [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(255, 159, 64)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
    ];

    angular
        .module('brewtest', ['nvd3'])
        .controller('homeCtrl', ['$scope', '$http',
        function ($scope, $http) {
            var layout = {
                showlegend: false,
                xaxis: { title: 'Date / Time', type: 'date' },
                yaxis: { title: 'Temperature (°C)', nticks: 10 },
                yaxis2: {
                    title: 'Output Status',
                    nticks: 2,
                    range: [ 0, 1 ],
                    overlaying: 'y',
                    side: 'right'
                },
                margin: {
                    l: 50,
                    r: 50,
                    b: 50,
                    t: 50,
                    pad: 4
                }
            };

            $scope.liveTemp = [];

            $http.get('/api/currentbrew').then(function success(resp) {
                $scope.currentBrew = resp.data[0];
            });

            // get socket config from the server, connect to socket server and create listeners
            $http.get('/init').then(function success(resp) {
                var socket_config = '//' + resp.data.socket_addr + ':' + resp.data.socket_port;
            
                $http.get('/api/getlogs').then(function success(resp) {
                    $scope.logs = resp.data
                    
                    $scope.brewData = {
                        datasets: [],
                    }

                    $scope.logs.forEach(function(controller, idx, ary) {
                        var timestamps = [], sensorValues = [], outputValues = [];

                        var dataset = {
                            label: controller.name,
                            fill: false,
                            pointRadius: 0,
                            backgroundColor: window.chartColors[idx % window.chartColors.length],
                            borderColor: window.chartColors[idx % window.chartColors.length],
                            data: []
                        }

                        var outputset = {
                            
                        }

                        controller.logs.forEach(function (log, idx, ary) {
                            timestamps.push(new Date(log.timestamp));
                            sensorValues.push(log.sensorValue);
                            outputValues.push(log.outputValue);

                            dataset.data.push({
                                x: new Date(log.timestamp),
                                y: log.sensorValue
                            })

                            if (idx === ary.length - 1) {
                                controller.sensor.currentRecord = {};
                                controller.sensor.currentRecord.timestamp = log.timestamp;
                                controller.sensor.currentRecord.temp = log.sensorValue;
                            }
                        });
                        
                        $scope.brewData.datasets.push(dataset);
                        console.log(dataset);
                        // $scope.brewData.push({
                        //     x: timestamps,
                        //     y: sensorValues
                        // });
    
                        // if (controller.output)
                        //     $scope.brewData.push({
                        //         x: timestamps,
                        //         y: outputValues,
                        // });
                        
                        $scope.liveTemp.push(controller);
                    });

                    var chartConfig = {
                        type: 'line',
                        data: $scope.brewData,
                        options: {
                            scales: {
                                xAxes: [{
                                    type: 'time'
                                }],
                                yAxes: [{
                                    scaleLabel: {
                                        display: true,
                                        labelString: 'Temperature'
                                    }
                                }]
                            }
                        }

                    }

                    var ctx = document.getElementById('brewGraph').getContext('2d');
                    var brewGraph = new Chart(ctx, chartConfig)
                    // Plotly.newPlot('brewGraph', $scope.brewData, layout, { displaylogo: false, responsive: true });
                });

                console.log($scope.brewData);

                var socket = io(socket_config);
                socket.on('connect', function () { console.log('connected!'); });
                socket.on('liveTemp', function(data) { 
                    if ($scope.brewData || $scope.brewData.length > 0)
                        $scope.$apply(function () {
                            // for now update the 24 hour graph every time receiving a new 'live' temp
                            // put this in the new 'recordTemp' socket message once that's setup
                            var chartIndex = $scope.brewData.findIndex(function(element){
                                return element.name === (data.name + " " + data.sensor.name);
                            });
                            $scope.liveTemp[chartIndex] = data;

                            // Plotly.extendTraces('brewGraph', { y: [[ data.sensor.currentRecord.temp ]], x: [[ new Date(data.sensor.currentRecord.timestamp) ]] }, [chartIndex]);

                            // if (data.output)
                            //     Plotly.extendTraces('brewGraph', { y: [[ data.output.state ]], x: [[ new Date() ]] }, [chartIndex + 1]);

                            chartIndex = $scope.liveTemp.findIndex(function (element) {
                                return element.name === data.name;
                            });

                            $scope.liveTemp[chartIndex] = data;
                        });
                });
            });
        }
    ]);

    angular
        .module('brewtest')
        .controller('historyCtrl', ['$scope', '$http',
        function ($scope, $http) {
            $http.get('/api/brews/').then(function success(resp) {
                console.log(resp.data);
                $scope.brews = resp.data;
                $scope.brews.forEach(function (brew) {
                    brew.graph = [{
                        x: [],
                        y: [],
                        type: 'scatter'
                    }];

                    brew.layout = {
                        showlegend: false,
                        xaxis: { title: 'Date / Time', type: 'date' },
                        yaxis: { title: 'Temperature (°C)', nticks: 10 },
                        margin: {
                            l: 50,
                            r: 50,
                            b: 50,
                            t: 50,
                            pad: 4
                        }
                    };

                    brew.tempData.forEach(function(record) {
                        brew.graph[0].x.push(new Date(record.timestamp));
                        brew.graph[0].y.push(record.temp);
                    });

                    Plotly.newPlot(brew._id, brew.graph, brew.layout, { displaylogo: false });
                });
            });

        }
    ]);
})();

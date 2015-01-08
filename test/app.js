var fs = require('fs');
var assert = require("assert");

describe('Application', function () {
    var app = require('../app');

    it('there are app mode', function () {
        assert.ok(app.node_env == 'development' || app.node_env == 'production');
    });

    describe('Check configuration', function () {
        var config = require('../core/config');

        it('should exist config.js file', function (done) {
            var configFile = 'config.json';

            fs.open(configFile, 'r', function (err, fd) {
                assert.ok(!err, 'should exist "config.json" file');
                fs.close(fd);
                done();
            });
        });

        it('there is a specified port number', function () {
            var server = config({mode: app.node_env}).server;
            assert.ok(server.port > 1000 && server.port < 9999);
        });

        it('server configure file has production mode parameter', function () {
            var productionServer = config({mode: 'production'}).server;
            assert.ok(productionServer.port > 1000 && productionServer.port < 9999);
        });
    });
});
/**
 * @author       Niklas Berg <nkholski@niklasberg.se>
 * @copyright    2018 Niklas Berg
 * @license      MIT
 */

var AnimatedTiles = (function (Phaser) {
    'use strict';

    var AnimatedTiles = function (_Phaser$Plugins$Scene) {
        function AnimatedTiles(scene, pluginManager) {
            Phaser.Plugins.ScenePlugin.call(this, scene, pluginManager);

            this.map = null;
            this.animatedTiles = [];
            this.rate = 1;
            this.active = false;
            this.activeLayer = [];
            this.followTimeScale = true;

            if (!scene.sys.settings.isBooted) {
                scene.sys.events.once('boot', this.boot, this);
            }
        }

        AnimatedTiles.prototype = Object.create(Phaser.Plugins.ScenePlugin.prototype);
        AnimatedTiles.prototype.constructor = AnimatedTiles;

        AnimatedTiles.prototype.boot = function () {
            var eventEmitter = this.systems.events;
            eventEmitter.on('postupdate', this.postUpdate, this);
            eventEmitter.on('shutdown', this.shutdown, this);
            eventEmitter.on('destroy', this.destroy, this);
        };

        AnimatedTiles.prototype.init = function (map) {
            var mapAnimData = this.getAnimatedTiles(map);
            var animatedTiles = {
                map: map,
                animatedTiles: mapAnimData,
                active: true,
                rate: 1,
                activeLayer: []
            };
            map.layers.forEach(function () {
                return animatedTiles.activeLayer.push(true);
            });
            this.animatedTiles.push(animatedTiles);
            if (this.animatedTiles.length === 1) {
                this.active = true;
            }
        };

        AnimatedTiles.prototype.setRate = function (rate, gid = null, map = null) {
            if (gid === null) {
                if (map === null) {
                    this.rate = rate;
                } else {
                    this.animatedTiles[map].rate = rate;
                }
            } else {
                var loopThrough = function (animatedTiles) {
                    animatedTiles.forEach(function (animatedTile) {
                        if (animatedTile.index === gid) {
                            animatedTile.rate = rate;
                        }
                    });
                };
                if (map === null) {
                    this.animatedTiles.forEach(function (animatedTiles) {
                        loopThrough(animatedTiles.animatedTiles);
                    });
                } else {
                    loopThrough(this.animatedTiles[map].animatedTiles);
                }
            }
        };

        AnimatedTiles.prototype.resetRates = function (mapIndex = null) {
            if (mapIndex === null) {
                this.rate = 1;
                this.animatedTiles.forEach(function (mapAnimData) {
                    mapAnimData.rate = 1;
                    mapAnimData.animatedTiles.forEach(function (tileAnimData) {
                        tileAnimData.rate = 1;
                    });
                });
            } else {
                this.animatedTiles[mapIndex].rate = 1;
                this.animatedTiles[mapIndex].animatedTiles.forEach(function (tileAnimData) {
                    tileAnimData.rate = 1;
                });
            }
        };

        AnimatedTiles.prototype.resume = function (layerIndex = null, mapIndex = null) {
            var scope = mapIndex === null ? this : this.animatedTiles[mapIndex];
            if (layerIndex === null) {
                scope.active = true;
            } else {
                scope.activeLayer[layerIndex] = true;
                scope.animatedTiles.forEach((animatedTile) => {
                    this.updateLayer(animatedTile, animatedTile.tiles[layerIndex]);
                });
            }
        };

        AnimatedTiles.prototype.pause = function (layerIndex = null, mapIndex = null) {
            var scope = mapIndex === null ? this : this.animatedTiles[mapIndex];
            if (layerIndex === null) {
                scope.active = false;
            } else {
                scope.activeLayer[layerIndex] = false;
            }
        };

        AnimatedTiles.prototype.postUpdate = function (time, delta) {
            if (!this.active) return;

            var globalElapsedTime = delta * this.rate * (this.followTimeScale ? this.scene.time.timeScale : 1);

            this.animatedTiles.forEach((mapAnimData) => {
                if (!mapAnimData.active) return;

                var elapsedTime = globalElapsedTime * mapAnimData.rate;

                mapAnimData.animatedTiles.forEach((animatedTile) => {
                    animatedTile.next -= elapsedTime * animatedTile.rate;

                    if (animatedTile.next < 0) {
                        var currentIndex = animatedTile.currentFrame;
                        var oldTileId = animatedTile.frames[currentIndex].tileid;

                        var newIndex = currentIndex + 1;
                        if (newIndex > animatedTile.frames.length - 1) {
                            newIndex = 0;
                        }

                        animatedTile.next = animatedTile.frames[newIndex].duration;
                        animatedTile.currentFrame = newIndex;

                        animatedTile.tiles.forEach((layer, layerIndex) => {
                            if (!mapAnimData.activeLayer[layerIndex]) return;
                            this.updateLayer(animatedTile, layer, oldTileId);
                        });
                    }
                });
            });
        };

        AnimatedTiles.prototype.updateLayer = function (animatedTile, layer, oldTileId = -1) {
            var tilesToRemove = [];
            var tileId = animatedTile.frames[animatedTile.currentFrame].tileid;

            layer.forEach(function (tile) {
                if (oldTileId > -1 && (!tile || tile.index !== oldTileId)) {
                    tilesToRemove.push(tile);
                } else if (tile) {
                    tile.index = tileId;
                }
            });

            tilesToRemove.forEach(function (tile) {
                var pos = layer.indexOf(tile);
                if (pos > -1) layer.splice(pos, 1);
            });
        };

        AnimatedTiles.prototype.shutdown = function () {};

        AnimatedTiles.prototype.destroy = function () {
            this.shutdown();
            this.scene = undefined;
        };

        AnimatedTiles.prototype.getAnimatedTiles = function (map) {
            var animatedTiles = [];
            map.tilesets.forEach((tileset) => {
                var tileData = tileset.tileData || {};
                Object.keys(tileData).forEach((index) => {
                    index = parseInt(index);
                    if (!tileData[index].hasOwnProperty("animation")) return;

                    var animatedTileData = {
                        index: index + tileset.firstgid,
                        frames: [],
                        currentFrame: 0,
                        tiles: [],
                        rate: 1
                    };

                    tileData[index].animation.forEach((frameData) => {
                        animatedTileData.frames.push({
                            duration: frameData.duration,
                            tileid: frameData.tileid + tileset.firstgid
                        });
                    });

                    animatedTileData.next = animatedTileData.frames[0].duration;

                    map.layers.forEach((layer) => {
                        if (!layer || !layer.tilemapLayer || layer.tilemapLayer.type === "StaticTilemapLayer") {
                            animatedTileData.tiles.push([]);
                            return;
                        }

                        var tiles = [];
                        layer.data.forEach((tileRow) => {
                            tileRow.forEach((tile) => {
                                if (!tile) return;
                                if (tile.index - tileset.firstgid === index) tiles.push(tile);
                            });
                        });

                        animatedTileData.tiles.push(tiles);
                    });

                    animatedTiles.push(animatedTileData);
                });
            });

            map.layers.forEach((layer, layerIndex) => {
                this.activeLayer[layerIndex] = true;
            });

            return animatedTiles;
        };

        AnimatedTiles.prototype.putTileAt = function (layer, tile, x, y) {};

        AnimatedTiles.prototype.updateAnimatedTiles = function () {
            var x = null,
                y = null,
                w = null,
                h = null,
                container = null;

            if (container === null) {
                container = this.animatedTiles.slice();
            }

            container.forEach((mapAnimData) => {
                var chkX = x !== null ? x : 0;
                var chkY = y !== null ? y : 0;
                var chkW = w !== null ? mapAnimData.map.width : 10;
                var chkH = h !== null ? mapAnimData.map.height : 10;

                mapAnimData.animatedTiles.forEach((tileAnimData) => {
                    tileAnimData.tiles.forEach((tiles, layerIndex) => {
                        var layer = mapAnimData.map.layers[layerIndex];
                        if (!layer || !layer.tilemapLayer || layer.tilemapLayer.type === "StaticTilemapLayer") return;

                        for (var _x = chkX; _x < chkX + chkW; _x++) {
                            for (var _y = chkY; _y < chkY + chkH; _y++) {
                                var tile = layer.data[_x][_y];
                                if (!tile) continue;
                                if (tile.index === tileAnimData.index && tiles.indexOf(tile) === -1) tiles.push(tile);
                                tile.index = tileAnimData.frames[tileAnimData.currentFrame].tileid;
                            }
                        }
                    });
                });
            });
        };

        return AnimatedTiles;
    }(Phaser.Plugins.ScenePlugin);

    AnimatedTiles.register = function (PluginManager) {
        PluginManager.register('AnimatedTiles', AnimatedTiles, 'animatedTiles');
    };

    return AnimatedTiles;
})(Phaser);

if (typeof module !== 'undefined') module.exports = AnimatedTiles;

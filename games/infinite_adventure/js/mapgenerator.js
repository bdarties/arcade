export default class MapGenerator {
    constructor(scene, tileSize = 16, margin = 500) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.margin = margin;
    this.wallGroup = scene.physics.add.staticGroup();
    this.doorsVis = scene.add.group();
    this.doorsHit = scene.physics.add.staticGroup();
    this.blockDoorsVis = scene.add.group();
    this.blockDoorsHit = scene.physics.add.staticGroup();
    this.puzzleRoomCooldown = 0;
    
    // Add chest spawn callback
    this.spawnChest = (x, y) => {
        if (scene.spawnChest) {
            scene.spawnChest(x, y);
        }
    };
}

    generate(roomCount = 12) {
        this.rooms = this._generateRooms(roomCount);
        this.rooms.forEach((room, index) => {
            room.index = index;
            room.doorPositions = [];
            if (room.links) {
                room.links.forEach(l => {
                    const doorPos = this._calcDoorPos(room, l.dir);
                    room.doorPositions.push({ gridX: doorPos.x, gridY: doorPos.y, link: l });
                });
            }
            this._buildRoom(room);
        });
        return { 
            rooms: this.rooms, 
            wallGroup: this.wallGroup, 
            doorsVis: this.doorsVis, 
            doorsHit: this.doorsHit, 
            blockDoorsVis: this.blockDoorsVis, 
            blockDoorsHit: this.blockDoorsHit 
        };
    }

    _generateRooms(nb) {
        const rooms = [], occupied = [];
        const first = { x: 0, y: 0, cols: Phaser.Math.Between(12, 18), rows: Phaser.Math.Between(12, 18) };
        first.centerX = first.x + (first.cols * this.tileSize) / 2;
        first.centerY = first.y + (first.rows * this.tileSize) / 2;
        rooms.push(first);
        occupied.push({ x: 0, y: 0, w: first.cols * this.tileSize, h: first.rows * this.tileSize });
        let last = first;

        for (let i = 1; i < nb; i++) {
            const isPuzzle = i >= 3 && this.puzzleRoomCooldown <= 0 && Phaser.Math.Between(1, 100) <= 50;
            if (isPuzzle) this.puzzleRoomCooldown = 6;
            else if (this.puzzleRoomCooldown > 0) this.puzzleRoomCooldown--;

            let placed = false, attempts = 0;
            while (!placed && attempts < 200) {
                attempts++;
                const cols = isPuzzle ? 19 : Phaser.Math.Between(20, Math.floor(Math.sqrt(Phaser.Math.Between(450, 600))) + 10);
                const rows = isPuzzle ? 19 : Math.max(15, Math.floor(Phaser.Math.Between(450, 600) / cols));
                const dir = Phaser.Math.Between(0, 3);
                const off = [
                    { x: 0, y: -rows * this.tileSize - this.margin }, 
                    { x: last.cols * this.tileSize + this.margin, y: 0 }, 
                    { x: 0, y: last.rows * this.tileSize + this.margin }, 
                    { x: -cols * this.tileSize - this.margin, y: 0 }
                ][dir];
                const nx = last.x + off.x, ny = last.y + off.y;
                const rect = { x: nx, y: ny, w: cols * this.tileSize, h: rows * this.tileSize };

                if (!occupied.some(o => !(rect.x + rect.w <= o.x || rect.x >= o.x + o.w || rect.y + rect.h <= o.y || rect.y >= o.y + o.h))) {
                    placed = true;
                    last = { 
                        x: nx, y: ny, cols, rows, 
                        centerX: nx + (cols * this.tileSize) / 2, 
                        centerY: ny + (rows * this.tileSize) / 2, 
                        connectedTo: rooms.length - 1, 
                        connectedDir: dir, 
                        isPuzzleRoom: isPuzzle 
                    };
                    rooms.push(last);
                    occupied.push(rect);
                }
            }

            if (!placed) {
                const cols = isPuzzle ? 13 : Phaser.Math.Between(20, 25);
                const rows = isPuzzle ? 13 : Math.max(15, Math.floor(Phaser.Math.Between(800, 1500) / cols));
                const nx = last.x + last.cols * this.tileSize + this.margin;
                last = { 
                    x: nx, y: last.y, cols, rows, 
                    centerX: nx + (cols * this.tileSize) / 2, 
                    centerY: last.y + (rows * this.tileSize) / 2, 
                    connectedTo: rooms.length - 1, 
                    connectedDir: 1, 
                    isPuzzleRoom: isPuzzle 
                };
                rooms.push(last);
                occupied.push({ x: nx, y: last.y, w: cols * this.tileSize, h: rows * this.tileSize });
            }
        }

        const opp = [2, 3, 0, 1];
        rooms.forEach((r, i) => {
            if (r.connectedTo !== undefined) {
                const prev = rooms[r.connectedTo];
                if (!prev.links) prev.links = [];
                if (!r.links) r.links = [];
                prev.links.push({ dir: r.connectedDir, index: i });
                r.links.push({ dir: opp[r.connectedDir], index: r.connectedTo });
            }
        });

        return rooms;
    }

    _calcDoorPos(room, dir) {
        const m = Math.min(4, Math.floor(room.cols / 3));
        const mr = Math.min(4, Math.floor(room.rows / 3));
        
        const cfg = [
            { x: Phaser.Math.Between(Math.max(1, m), room.cols - 1 - m), y: 0 },
            { x: room.cols - 1, y: Phaser.Math.Between(Math.max(1, mr), room.rows - 1 - mr) },
            { x: Phaser.Math.Between(Math.max(1, m), room.cols - 1 - m), y: room.rows - 1 },
            { x: 0, y: Phaser.Math.Between(Math.max(1, mr), room.rows - 1 - mr) }
        ][dir];

        return { x: cfg.x, y: cfg.y, dir: dir };
    }

    _buildRoom(room) {
        const s = this.tileSize;
        const doorGridPositions = new Set();
        
        room.doorPositions.forEach(d => {
            doorGridPositions.add(`${d.gridX},${d.gridY}`);
            const dir = d.link.dir;
            if (dir === 0 && d.gridY > 0) doorGridPositions.add(`${d.gridX},${d.gridY - 1}`);
            if (dir === 1 && d.gridX < room.cols - 1) doorGridPositions.add(`${d.gridX + 1},${d.gridY}`);
            if (dir === 2 && d.gridY < room.rows - 1) doorGridPositions.add(`${d.gridX},${d.gridY + 1}`);
            if (dir === 3 && d.gridX > 0) doorGridPositions.add(`${d.gridX - 1},${d.gridY}`);
        });
        
        for (let y = 0; y < room.rows; y++) {
            for (let x = 0; x < room.cols; x++) {
                const wx = room.x + x * s + s / 2;
                const wy = room.y + y * s + s / 2;
                const isEdge = x === 0 || x === room.cols - 1 || y === 0 || y === room.rows - 1;
                
                if (isEdge) {
                    const isDoor = doorGridPositions.has(`${x},${y}`);
                    if (!isDoor) {
                        const frame = this._getWallFrame(x, y, room.cols, room.rows);
                        this.wallGroup.create(wx, wy, "walls", frame).setOrigin(0.5).setDepth(1);
                    }
                } else {
                    this.scene.add.rectangle(wx, wy, s, s, 0x584422).setOrigin(0.5).setDepth(0);
                }
            }
        }

        if (room.isPuzzleRoom) this._addLevers(room);
        if (room.doorPositions) room.doorPositions.forEach(d => this._addDoor(room, d));
    }

    _getWallFrame(x, y, cols, rows) {
        if (x === 0 && y === 0) return 6;
        if (x === cols - 1 && y === 0) return 7;
        if (x === 0 && y === rows - 1) return 4;
        if (x === cols - 1 && y === rows - 1) return 5;
        if (y === 0) return 3;
        if (y === rows - 1) return 1;
        if (x === 0) return 2;
        return 0;
    }

    _addLevers(room) {
        const s = this.tileSize;
        const pos = [{ x: 6, y: 9 }, { x: 9, y: 6 }, { x: 12, y: 9 }, { x: 9, y: 12}];
        const order = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);
        
        room.puzzleLevers = pos.map((p, i) => {
            const l = this.scene.physics.add.sprite(room.x + p.x * s + s / 2, room.y + p.y * s + s / 2, "lever", 0)
                .setOrigin(0.5).setDepth(5).setInteractive();
            l.leverIndex = i;
            l.isActivated = false;
            return l;
        });

        room.leverState = [];
        room.correctOrder = order;
        room.puzzleSolved = false;
        room.hintText = this.scene.add.text(room.centerX, room.y + s * 2, 
            "Trouvez le bon ordre des leviers!\nAppuyez sur A (J1) ou P (J2)", 
            { fontSize: "8px", fill: "#fff", align: "center" }
        ).setOrigin(0.5).setDepth(6);
    }

    _addDoor(room, doorData) {
        const s = this.tileSize;
        const frames = [0, 1, 3, 2];
        
        const x = room.x + doorData.gridX * s + s / 2;
        const y = room.y + doorData.gridY * s + s / 2;
        const dir = doorData.link.dir;

        const vis = this.scene.add.image(x, y, "door_frames", frames[dir]).setOrigin(0.5).setDepth(2);
        this.doorsVis.add(vis);

        const hit = this.doorsHit.create(x, y, null).setSize(s * 2, s * 2).setVisible(false);
        hit.roomIndex = doorData.link.index;
        hit.direction = dir;

        const block = this.scene.add.image(x, y, "doors", frames[dir]).setOrigin(0.5).setDepth(3).setVisible(false);
        this.blockDoorsVis.add(block);

        const blockHit = this.blockDoorsHit.create(x, y, null).setSize(s, s).setActive(false).setVisible(false);
        blockHit.roomIndex = room.index;
        blockHit.direction = dir;
        blockHit.doorSprite = block;
        blockHit.normalDoor = vis;
    }

    checkLeverInteraction(player) {
        const room = this.rooms.find(r => 
            player.x >= r.x && player.x <= r.x + r.cols * this.tileSize && 
            player.y >= r.y && player.y <= r.y + r.rows * this.tileSize
        );
        if (!room?.puzzleLevers || room.puzzleSolved) return;

        const closest = room.puzzleLevers.reduce((c, l) => {
            const d = Phaser.Math.Distance.Between(player.x, player.y, l.x, l.y);
            return (!c || d < c.dist) ? { lever: l, dist: d } : c;
        }, null);

        if (closest && closest.dist < 32) this._activateLever(room, closest.lever, player);
    }

    _activateLever(room, lever, player) {
        if (lever.isActivated) return;

        lever.isActivated = true;
        lever.setFrame(2);
        room.leverState.push(lever.leverIndex);

        const idx = room.leverState.length - 1;
        if (room.leverState[idx] !== room.correctOrder[idx]) {
            this._resetLevers(room);
            player.health = Math.max(0, player.health - 20);
            const isP2 = player === this.scene.player2;
            this.scene.events.emit(isP2 ? "updateHealthP2" : "updateHealth", player.health, 100);
            player.setTint(0xff0000);
            this.scene.time.delayedCall(200, () => player.setTint(player.baseTint || 0xffffff));
            if (player.health <= 0) this.scene.handlePlayerDeath(player, isP2);
        } else if (room.leverState.length === room.correctOrder.length) {
            room.puzzleSolved = true;
            room.hintText?.setText("Énigme résolue!");
            this.scene.time.delayedCall(1000, () => {
                room.hintText?.destroy();
                this.scene.spawnChest(room.centerX, room.centerY);
            });
        }
    }

    _resetLevers(room) {
        room.leverState = [];
        room.puzzleLevers.forEach(l => {
            l.isActivated = false;
            l.setFrame(0);
        });
    }

    closeRoomDoors(roomIndex) {
        this.blockDoorsHit.getChildren().forEach(h => {
            if (h.roomIndex === roomIndex) {
                h.setActive(true);
                h.doorSprite?.setVisible(true);
            }
        });
    }

    openRoomDoors(roomIndex) {
        this.blockDoorsHit.getChildren().forEach(h => {
            if (h.roomIndex === roomIndex) {
                h.setActive(false);
                h.doorSprite?.setVisible(false);
            }
        });
    }

    generateBossRoom() {
    // Création d'une salle deux fois plus grande que les salles normales
    const bossRoomCols = this.defaultCols * 10;
    const bossRoomRows = this.defaultRows * 10.
    
    // Position centrale pour la salle du boss
    const bossRoomX = this.margin + (this.totalCols - bossRoomCols) / 2 * this.tileSize;
    const bossRoomY = this.margin + (this.totalRows - bossRoomRows) / 2 * this.tileSize;
    
    const bossRoom = {
        x: bossRoomX,
        y: bossRoomY,
        cols: bossRoomCols,
        rows: bossRoomRows,
        centerX: bossRoomX + (bossRoomCols * this.tileSize) / 2,
        centerY: bossRoomY + (bossRoomRows * this.tileSize) / 2,
        isBossRoom: true,
        index: this.rooms.length
    };
    
    // Génération des murs pour la salle du boss
    this.generateWallsForRoom(bossRoom);
    
    // Portes spéciales pour la salle du boss (plus grandes)
    this.generateBossDoors(bossRoom);
    
    this.rooms.push(bossRoom);
    return bossRoom;
}

generateBossDoors(bossRoom) {
    const directions = [
        { x: bossRoom.centerX, y: bossRoom.y - 2, dir: 2 }, // Haut
        { x: bossRoom.x - 2, y: bossRoom.centerY, dir: 1 }, // Gauche
        { x: bossRoom.centerX, y: bossRoom.y + bossRoom.rows * this.tileSize + 2, dir: 0 }, // Bas
        { x: bossRoom.x + bossRoom.cols * this.tileSize + 2, y: bossRoom.centerY, dir: 3 } // Droite
    ];
    
    directions.forEach((door, index) => {
        // Portes visuelles plus grandes pour le boss
        const doorVis = this.scene.add.sprite(door.x, door.y, 'doors')
            .setFrame(1)
            .setScale(2)
            .setDepth(2);
        
        const doorHit = this.scene.add.rectangle(door.x, door.y, 32, 32)
            .setVisible(false);
        this.scene.physics.add.existing(doorHit);
        
        doorHit.roomIndex = bossRoom.index;
        doorHit.direction = door.dir;
        
        this.doorsVis.add(doorVis);
        this.doorsHit.add(doorHit);
    });
}
}
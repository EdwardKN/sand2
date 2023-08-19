var canvas = document.createElement("canvas");
var c = canvas.getContext("2d");
canvas.style.zIndex = "1"
document.body.appendChild(canvas)

canvas.width = 160 * 2;
canvas.height = 90 * 2;

var renderCanvas = document.createElement("canvas");
var renderC = renderCanvas.getContext("2d");
renderCanvas.style.zIndex = "10"
document.body.appendChild(renderCanvas)

var scale;

var mouseSize = 10;
var currentTool = 0;

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function fixCanvas() {
    if (window.innerWidth * 9 > window.innerHeight * 16) {
        renderCanvas.width = window.innerHeight * 16 / 9;
        renderCanvas.height = window.innerHeight;
        scale = renderCanvas.width / canvas.width

    } else {
        renderCanvas.width = window.innerWidth;
        renderCanvas.height = window.innerWidth * 9 / 16;
        scale = renderCanvas.height / canvas.height
    }
}

var mouse = {
    x: 1000,
    y: 1000,
    down: false
}

const chunkSize = 32;

function fixCanvas() {
    if (window.innerWidth * 9 > window.innerHeight * 16) {
        renderCanvas.width = window.innerHeight * 16 / 9;
        renderCanvas.height = window.innerHeight;
        scale = renderCanvas.width / canvas.width

    } else {
        renderCanvas.width = window.innerWidth;
        renderCanvas.height = window.innerWidth * 9 / 16;
        scale = renderCanvas.height / canvas.height

    }
}


renderCanvas.addEventListener("wheel", (e) => {
    currentTool += (Math.sign(e.deltaY))
});
renderCanvas.addEventListener("mousemove", function (e) {
    mouse.x = Math.floor(e.offsetX / scale)
    mouse.y = Math.floor(e.offsetY / scale)
})

renderCanvas.addEventListener("mousedown", function (e) {
    mouse.down = true;
})

window.addEventListener("mouseup", e => {
    mouse.down = false;
})

window.addEventListener("keydown", e => {
    if (e.code === "KeyD" && player.directionX == 0) {
        player.directionX = -1;
    }
    if (e.code === "KeyA" && player.directionX == 0) {
        player.directionX = 1;
    }
    if (e.code === "KeyW" && player.directionY == 0) {
        player.directionY = 1;
    }
    if (e.code === "KeyS" && player.directionY == 0) {
        player.directionY = -1;
    }
})
window.addEventListener("keyup", e => {
    if (e.code === "KeyD" && player.directionX == -1) {
        player.directionX = 0;
    }
    if (e.code === "KeyA" && player.directionX == 1) {
        player.directionX = 0;
    }
    if (e.code === "KeyW" && player.directionY == 1) {
        player.directionY = 0;
    }
    if (e.code === "KeyS" && player.directionY == -1) {
        player.directionY = 0;
    }
})

window.onresize = fixCanvas;


async function update() {
    requestAnimationFrame(update);
    renderC.imageSmoothingEnabled = false;

    c.clearRect(0, 0, canvas.width, canvas.height);

    if (mouse.down) {
        buttonPress();
    }

    let tmp = await updateChunks();
    render();

    c.lineWidth = 1;
    c.strokeStyle = "black";
    c.strokeRect(mouse.x - mouseSize / 2, mouse.y - mouseSize / 2, mouseSize, mouseSize)

    renderC.fillStyle = "white"
    renderC.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    renderC.drawImage(canvas, 0, 0, renderCanvas.width, renderCanvas.height)

    renderC.fillStyle = "gray"
    renderC.fillText(fps, 100, 100)

    renderC.fillStyle = "gray"
    renderC.fillText(tmp, 100, 120)

}

async function updateChunks() {
    let sortedChunks = Object.entries(chunks).sort(function(a, b) {
        let aSplit = a[0].split(",")
        let aX = JSON.parse(aSplit[0]);
        let aY = JSON.parse(aSplit[1]);       
        let bSplit = b[0].split(",")
        let bX = JSON.parse(bSplit[0]);
        let bY = JSON.parse(bSplit[1]);       

        if (aX == bX) {
          return aY - bY;
        }
        return bX - aX;
      });
    let filteredChunks = sortedChunks.filter(e => { if (e[1].shouldStep) { return true } })
    
    for(let i = 0; i < filteredChunks.length; i+= 2){
        filteredChunks[i][1].update(filteredChunks[i][0])
    }
    for(let i = 1; i < filteredChunks.length; i+= 2){
        filteredChunks[i][1].update(filteredChunks[i][0])
    }
    Object.entries(chunks).forEach(e => {
        e[1].shiftShouldStepAndReset()
    });
    return filteredChunks.length;
}

async function render() {


    for (let x = -Math.round(player.x / chunkSize) - 1, n = Math.round(canvas.width / chunkSize) - Math.round(player.x / chunkSize) + 1; x < n; x++) {
        for (let y = -Math.round(player.y / chunkSize) - 1, g = Math.round(canvas.height / chunkSize) - Math.round(player.y / chunkSize) + 1; y < g; y++) {
            if (chunks[x + "," + y]) {
                c.drawImage(chunks[x + "," + y].canvas, x * chunkSize + Math.floor(player.x), y * chunkSize + Math.floor(player.y))
            }
        }
    }
    player.update();
}

var times = [];
var fps;

function refreshLoop() {
    window.requestAnimationFrame(function () {
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift();
        }
        times.push(now);
        fps = times.length;
        refreshLoop();
    });
}

function buttonPress() {
    for (let i = 0; i < Math.pow(mouseSize, 2); i++) {
        let x = mouse.x + Math.floor(i / mouseSize) - Math.floor(mouseSize / 2 + player.x);
        let y = mouse.y + i % mouseSize - Math.floor(mouseSize / 2 + player.y)
        if (Math.abs(currentTool) % 4 == 0) {
            if (elements[x + "," + y] == undefined) {
                elements[x + "," + y] = new MovableSolid(x, y, "#c2b280")
            }
        } else if (Math.abs(currentTool) % 4 == 1) {
            if (elements[x + "," + y] == undefined) {
                elements[x + "," + y] = new Liquid(x, y, "blue", 5)
            }
        } else if (Math.abs(currentTool) % 4 == 2) {
            if (elements[x + "," + y] == undefined) {
                elements[x + "," + y] = new Gas(x, y, "gray", 5)
            }
        } else if (Math.abs(currentTool) % 4 == 3) {
            if (true) {
                elements[x + "," + y]?.activateChunks(x, y)
                elements[x + "," + y] = undefined;
                let tmpX = x >= 0 ? x % chunkSize : (chunkSize + x % (chunkSize));
                let tmpY = y >= 0 ? y % chunkSize : (chunkSize + y % (chunkSize));
                tmpX = tmpX == chunkSize ? 0 : tmpX;
                tmpY = tmpY == chunkSize ? 0 : tmpY;
                chunks[Math.floor(x / chunkSize) + "," + Math.floor(y / chunkSize)].context.clearRect(tmpX, tmpY, 1, 1);
            }
        }
        if (Math.abs(currentTool) % 4 !== 3) {
            elements[x + "," + y].draw();
            chunks[Math.floor(x / chunkSize) + "," + Math.floor(y / chunkSize)].shouldStepNextFrame = true;
        }
    }

}

function testGenerate() {
    for (let x = -500; x < 500; x++) {
        for (let y = -500; y < 500; y++) {
            let perlin = getPerlinNoise(x, y, 20, 100)
            if (perlin > 0.5 || Math.abs(x) > 450 || Math.abs(y) > 450) {
                elements[x + "," + y] = new ImmovableSolid(x, y, "brown")
                elements[x + "," + y].draw()
            }
        }
    }
}

async function init() {
    fixCanvas();
    refreshLoop();
    update();
    testGenerate()

}

var elements = [];

var chunks = [];

class Chunk {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = chunkSize;
        this.canvas.height = chunkSize;
        this.context = this.canvas.getContext("2d");
        this.shouldStep = true;
        this.shouldStepNextFrame = false;
    }
    shiftShouldStepAndReset() {
        this.shouldStep = this.shouldStepNextFrame;
        this.shouldStepNextFrame = false;
    }
    async update(cords) {
        let coords = cords.split(",")
        let chunkX = JSON.parse(coords[0]);
        let chunkY = JSON.parse(coords[1]);
        c.fillStyle = "lightgray"
        c.fillRect(Math.floor(chunkX * chunkSize + player.x), Math.floor(chunkY * chunkSize + player.y), chunkSize, chunkSize)

        for (let y = chunkY * chunkSize + chunkSize; y >= chunkY * chunkSize; y--) {
            for (let x = chunkX * chunkSize + 1; x < chunkX * chunkSize + chunkSize; x += 2) {
                if (elements[x + "," + y]?.step && !(elements[x + "," + y] instanceof Gas)) {
                    elements[x + "," + y]?.step();
                }
            }
            for (let x = chunkX * chunkSize; x < chunkX * chunkSize + chunkSize; x += 2) {
                if (elements[x + "," + y]?.step && !(elements[x + "," + y] instanceof Gas)) {
                    elements[x + "," + y]?.step();
                }
            }
        }
        for (let y = chunkY * chunkSize; y < chunkY * chunkSize + chunkSize; y++) {
            for (let x = chunkX * chunkSize + 1; x < chunkX * chunkSize + chunkSize; x += 2) {
                if (elements[x + "," + y]?.step && (elements[x + "," + y] instanceof Gas)) {
                    elements[x + "," + y]?.step();
                }
            }
            for (let x = chunkX * chunkSize; x < chunkX * chunkSize + chunkSize; x += 2) {
                if (elements[x + "," + y]?.step && (elements[x + "," + y] instanceof Gas)) {
                    elements[x + "," + y]?.step();
                }
            }
        }
    }
}


class Element {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: 1,
            y: 1
        };

        if (this.color === undefined) {
            this.color = "black"
        }
    }
    async draw() {
        if (!chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)]) {
            chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)] = new Chunk();
        }
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize))
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize))
        tmpX = tmpX == chunkSize ? 0 : tmpX
        tmpY = tmpY == chunkSize ? 0 : tmpY
        chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].context.fillStyle = this.color;
        chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].context.fillRect(tmpX, tmpY, 1, 1);
    }
    async moveTo(x, y) {
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize));
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize));
        tmpX = tmpX == chunkSize ? 0 : tmpX;
        tmpY = tmpY == chunkSize ? 0 : tmpY;
        chunks[Math.floor(this.x / chunkSize) + "," + Math.floor(this.y / chunkSize)].context.clearRect(tmpX, tmpY, 1, 1);
        elements[this.x + "," + this.y] = undefined
        let oldX = this.x;
        let oldY = this.y;
        this.x = x;
        this.y = y;
        elements[x + "," + y] = this;
        this.draw();
        this.activateChunks(x, y, oldX, oldY)
    }
    async switchWith(x, y) {
        let tmp = elements[x + "," + y]

        tmp.x = this.x;
        tmp.y = this.y;

        this.x = x;
        this.y = y;
        elements[x + "," + y] = this;

        elements[tmp.x + "," + tmp.y] = tmp;

        this.draw();
        tmp.draw();
        this.activateChunks(x, y, tmp.x, tmp.y)

    }
    activateChunks(x, y, x2, y2) {
        chunks[Math.floor(x / chunkSize) + "," + Math.floor(y / chunkSize)].shouldStepNextFrame = true;
        if (x % chunkSize > chunkSize - 2 || x % chunkSize < -chunkSize + 2) {
            if (!chunks[(Math.floor(x / chunkSize) - 1) + "," + Math.floor(y / chunkSize)]) {
                chunks[(Math.floor(x / chunkSize) - 1) + "," + Math.floor(y / chunkSize)] = new Chunk()
            }
            chunks[(Math.floor(x / chunkSize) - 1) + "," + Math.floor(y / chunkSize)].shouldStepNextFrame = true;
        }
        if (y % chunkSize > chunkSize - 2 || y % chunkSize < -chunkSize + 2) {
            if (!chunks[Math.floor(x / chunkSize) + "," + (Math.floor(y / chunkSize) - 1)]) {
                chunks[Math.floor(x / chunkSize) + "," + (Math.floor(y / chunkSize) - 1)] = new Chunk()
            }
            chunks[Math.floor(x / chunkSize) + "," + (Math.floor(y / chunkSize) - 1)].shouldStepNextFrame = true;
        }
        if (x % chunkSize < 2 && x % chunkSize > 0 || x % chunkSize > -2 && x % chunkSize < 0) {
            if (!chunks[(Math.floor(x / chunkSize) + 1) + "," + Math.floor(y / chunkSize)]) {
                chunks[(Math.floor(x / chunkSize) + 1) + "," + Math.floor(y / chunkSize)] = new Chunk()
            }
            chunks[(Math.floor(x / chunkSize) + 1) + "," + Math.floor(y / chunkSize)].shouldStepNextFrame = true;
            c.fillStyle = "black"
        }
        if (y % chunkSize < 2 && y % chunkSize > 0 || y % chunkSize > -2 && y % chunkSize < 0) {
            if (!chunks[Math.floor(x / chunkSize) + "," + (Math.floor(y / chunkSize) + 1)]) {
                chunks[Math.floor(x / chunkSize) + "," + (Math.floor(y / chunkSize) + 1)] = new Chunk()
            }
            chunks[Math.floor(x / chunkSize) + "," + (Math.floor(y / chunkSize) + 1)].shouldStepNextFrame = true;
        }
        if (x2 && y2) {
            this.activateChunks(x2, y2)
        }
    }

}

class Solid extends Element {

}

class Liquid extends Element {
    constructor(x, y, color, dispersionRate) {
        super(x, y, color);
        this.dispersionRate = dispersionRate;
    }
    async step() {
        let targetCell = getElementAtCell(this.x, this.y + 1);

        if (targetCell == undefined) {
            this.moveTo(this.x, this.y + 1)
        }
        if (targetCell !== undefined) {
            this.lookHorizontally(Math.random() > 0.5 ? -1 : 1);
        }
    }
    async lookHorizontally(dir) {
        let maxDir = 0;
        for (let i = 1; i < this.dispersionRate + 1; i++) {
            let targetCell1 = getElementAtCell(this.x + dir * i, this.y);
            let targetCell2 = getElementAtCell(this.x + dir * -i, this.y);
            if (targetCell1 == undefined) {
                maxDir = i * dir
            } else if (targetCell2 == undefined) {
                maxDir = i * dir * -1
            } else {
                i = undefined;
            }
        }
        if (maxDir !== 0) {
            if (maxDir * dir < 0) {
                this.lookHorizontally(-dir)
            } else {
                this.moveTo(this.x + maxDir, this.y)
            }
        }
    }
}
class Gas extends Element {
    constructor(x, y, color, dispersionRate) {
        super(x, y, color);
        this.dispersionRate = dispersionRate
    }
    async step() {
        let targetCell = getElementAtCell(this.x, this.y - 1);

        if (targetCell == undefined) {
            this.moveTo(this.x, this.y - 1)
        }
        if (targetCell !== undefined) {
            this.lookHorizontally(Math.random() > 0.5 ? -1 : 1);
        }
    }
    async lookHorizontally(dir) {
        let maxDir = 0;
        for (let i = 1; i < this.dispersionRate + 1; i++) {
            let targetCell1 = getElementAtCell(this.x + dir * i, this.y);
            let targetCell2 = getElementAtCell(this.x + dir * -i, this.y);
            if (targetCell1 == undefined) {
                maxDir = i * dir
            } else if (targetCell2 == undefined) {
                maxDir = i * dir * -1
            } else {
                i = undefined;
            }
        }
        if (maxDir !== 0) {
            if (maxDir * dir < 0) {
                this.lookHorizontally(-dir)
            } else {
                this.moveTo(this.x + maxDir, this.y)
            }
        }
    }
}

class MovableSolid extends Solid {
    async step() {
        let targetCell = getElementAtCell(this.x, this.y + 1);

        if (targetCell == undefined) {
            this.moveTo(this.x, this.y + 1)
        }
        if (targetCell instanceof Liquid || targetCell instanceof Gas) {
            this.switchWith(this.x, this.y + 1)
        }
        if (targetCell instanceof Solid) {
            this.lookDiagonally(Math.floor(Math.random() * 2) || -1, true);
        }
    }
    async lookDiagonally(dir, first) {
        let targetCell = getElementAtCell(this.x + dir, this.y + 1);

        if (targetCell == undefined) {
            this.moveTo(this.x + dir, this.y + 1)
        }
        if (targetCell instanceof Liquid || targetCell instanceof Gas) {
            this.switchWith(this.x + dir, this.y + 1)
        }
        if (targetCell instanceof Solid && first == true) {
            this.lookDiagonally(-dir, false);
        }
    }
}
class ImmovableSolid extends Solid {

}

function getElementAtCell(x, y) {
    return elements[x + "," + y]
}


class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speedLossX = 0.5;
        this.speedLossY = 0.5;
        this.directionX = 0;
        this.directionY = 0;
        this.clampX = 5;
        this.clampY = 7;
        this.speedToSpeedX = 1;
        this.speedToSpeedY = 1;
        this.w = 5
        this.h = 10;
        this.weight = 0.1
        this.gravityV = 0;
        this.gravityClamp = 4;
    }
    draw() {
        c.fillStyle = "black"
        c.fillRect(Math.floor(canvas.width / 2 - this.w / 2), Math.floor(canvas.height / 2 - this.h / 2), this.w, this.h)
    }
    update() {
        this.draw()


        this.vx = this.updateVelocity(this.vx, this.directionX, this.speedLossX, this.clampX, this.speedToSpeedX)
        this.vy = this.updateVelocity(this.vy, this.directionY, this.speedLossY, this.clampY, this.speedToSpeedY)

        this.gravityV = this.gravity(this.gravityV, this.gravityClamp)

        this.checkCollisions();

        this.x += this.vx

        this.y += this.vy + this.gravityV



    }

    checkCollisions() {
        let tmp = false;
        for (let i = 0; i < this.w; i++) {
            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2))]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2))] instanceof Solid)) {
                    tmp = true;
                }
            }
        }
        if (tmp) {
            this.gravityV = 0;
            if (this.vy < 0) {
                this.vy = 0;
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2) - 1)]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2) - 1)] instanceof Solid)) {
                        this.y++;
                    }
                }
            }
        }
        let tmp2 = false;
        for (let i = 0; i < this.w; i++) {

            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2 - 1))]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2 - 1))] instanceof Solid)) {
                    tmp2 = true;
                }
            }
        }
        if (tmp2) {
            if (this.directionY == 1) {
                this.vy = -this.gravityV;
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2))]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2))] instanceof Solid)) {
                        this.y--;
                    }
                }
            }
        }
        let tmp3 = false;
        for (let i = 0; i < this.h; i++) {
            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                    tmp3 = true;
                }
            }
        }
        if (tmp3) {
            if (this.directionX == 1) {
                this.vx = 0
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                        this.x--;
                    }
                }
            }
        }
        let tmp4 = false;
        for (let i = 0; i < this.h; i++) {
            if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                    tmp4 = true;
                }
            }
        }
        if (tmp4) {
            if (this.directionX == -1) {
                this.vx = 0
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]) {
                    if ((elements[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2 - 1))) + "," + (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)] instanceof Solid)) {
                        this.x++;
                    }
                }
            }
        }
    }
    updateVelocity(v, direction, speedloss, clamp, speedToSpeed) {
        v += speedToSpeed * direction;
        if (v > clamp) {
            v = clamp;
        }
        if (v < -clamp) {
            v = -clamp;
        }
        if (v > 0) {
            v -= speedloss
            if (v < 0) {
                v = 0;
            }
        } else if (v < 0) {
            v += speedloss
            if (v > 0) {
                v = 0;
            }
        }

        return v

    }
    gravity(v, clamp) {
        if (v > clamp) {
            v = clamp;
        }
        if (v < -clamp) {
            v = -clamp;
        }
        v -= this.weight;

        return v;
    }
}

function getPerlinNoise(x, y, perlinSeed, resolution) {
    noise.seed(perlinSeed);

    var value = noise.simplex2(x / resolution, y / resolution);
    value++;
    value /= 2;

    return value;

}

var player = new Player(200, 100)


window.onload = init;

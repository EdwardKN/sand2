var canvas = document.createElement("canvas");
var c = canvas.getContext("2d");
canvas.style.zIndex = "1"
document.body.appendChild(canvas)

canvas.width = 160;
canvas.height = 90;

var renderCanvas = document.createElement("canvas");
var renderC = renderCanvas.getContext("2d");
renderCanvas.style.zIndex = "10"
document.body.appendChild(renderCanvas)

var scale;

var mouseSize = 10;
var mouseColor = "black";
var currentTool = 0;

var maxSimulatedAtTime = 30;

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

    let pX = player.x - (canvas.width / 2 - player.w / 2);
    let pY = player.y - (canvas.height / 2 - player.h / 2);
    let filteredChunks = Object.entries(chunks).filter(e => { if (e[1].shouldStep) { return true } })

    let sortedChunks = filteredChunks.sort(function (a, b) {
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
    let result = sortedChunks.sort(function (a, b) {
        let aSplit = a[0].split(",")
        let aX = JSON.parse(aSplit[0]);
        let aY = JSON.parse(aSplit[1]);
        let bSplit = b[0].split(",")
        let bX = JSON.parse(bSplit[0]);
        let bY = JSON.parse(bSplit[1]);
        return (distance(aX, aY, -pX / chunkSize, -pY / chunkSize) - distance(bX, bY, -pX / chunkSize, -pY / chunkSize))
    });
    let tmp = [];
    for (i = 0; i < sortedChunks.length; i++) {
        if (i >= maxSimulatedAtTime) {
            result[i][1].shouldStepNextFrame = true;
            if (i == sortedChunks.length - 1 && fps >= 60) {
                maxSimulatedAtTime++;
            }
        } else {
            tmp.push(result[i])
        }
    }
    let sortedTmp = tmp.sort(function (a, b) {
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

    for (let i = 0; i < sortedTmp.length; i += 2) {
        sortedTmp[i][1].update(sortedTmp[i][0])
    }

    for (let i = 1; i < sortedTmp.length; i += 2) {
        sortedTmp[i][1].update(sortedTmp[i][0])
    }



    Object.entries(chunks).forEach(e => {
        e[1].shiftShouldStepAndReset()
    });
    return sortedTmp.length;
}

setInterval(() => {
    if (fps < 60) {
        maxSimulatedAtTime--;
    }
}, 1000);

function distance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
};
async function render() {


    for (let x = -Math.round(player.x / chunkSize) - 1, n = Math.round(canvas.width / chunkSize) - Math.round(player.x / chunkSize) + 1; x < n; x++) {
        for (let y = -Math.round(player.y / chunkSize) - 1, g = Math.round(canvas.height / chunkSize) - Math.round(player.y / chunkSize) + 1; y < g; y++) {
            if (chunks[[x, y]]) {
                c.drawImage(chunks[[x, y]].canvas, x * chunkSize + Math.floor(player.x), y * chunkSize + Math.floor(player.y))
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
        if (Math.abs(currentTool) % 10 == 0) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Water(x, y)
                elements[[x, y]].temp = -20
            }
        } else if (Math.abs(currentTool) % 10 == 1) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new AntiFire(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 2) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Fire(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 3) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Ice(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 4) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Acid(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 5) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Stone(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 6) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Slime(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 7) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Lava(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 8) {
            if (elements[[x, y]] == undefined) {
                elements[[x, y]] = new Ketchup(x, y)
            }
        } else if (Math.abs(currentTool) % 10 == 9) {
            if (true) {
                elements[[x, y]]?.activateChunks(x, y)
                elements[[x, y]] = undefined;
                let tmpX = x >= 0 ? x % chunkSize : (chunkSize + x % (chunkSize));
                let tmpY = y >= 0 ? y % chunkSize : (chunkSize + y % (chunkSize));
                tmpX = tmpX == chunkSize ? 0 : tmpX;
                tmpY = tmpY == chunkSize ? 0 : tmpY;
                chunks[[Math.floor(x / chunkSize), Math.floor(y / chunkSize)]].context.clearRect(tmpX, tmpY, 1, 1);
            }
        }

        if (Math.abs(currentTool) % 10 !== 9) {
            mouseColor = elements[[x, y]].color;
            elements[[x, y]].draw();
            chunks[[Math.floor(x / chunkSize), Math.floor(y / chunkSize)]].shouldStepNextFrame = true;
        }
    }

}

function rgb(r, g, b, a) {
    if (r < 0) { r = 0 }
    if (g < 0) { g = 0 }
    if (b < 0) { b = 0 }
    if (a) {
        return ["rgb(", Math.floor(r), ",", Math.floor(g), ",", Math.floor(b), ",", Math.floor(a), ")"].join("");
    } else {
        return ["rgb(", Math.floor(r), ",", Math.floor(g), ",", Math.floor(b), ")"].join("");
    }
}

function testGenerate() {
    for (let x = -500; x < 500; x++) {
        for (let y = -500; y < 500; y++) {
            let perlin = getPerlinNoise(x, y, 20, 100)
            if (perlin > 0.5 || Math.abs(x) > 450 || Math.abs(y) > 450) {
                elements[[x, y]] = new Stone(x, y, rgb(-perlin * 200 + 255 / 2, -perlin * 200 + 255 / 2, -perlin * 200 + 255 / 2))
                elements[[x, y]].draw()
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

var newElements = [
    [
        []
    ],
    [
        []
    ],
    [
        []
    ],
    [
        []
    ],
]

function getElementAtCell2(x, y) {

}

var elements = {};
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
        c.strokeStyle = "lightgray"
        c.lineWidth = 1;
        c.strokeRect(Math.floor(chunkX * chunkSize + player.x), Math.floor(chunkY * chunkSize + player.y), chunkSize, chunkSize)

        let elementsToUpdate = [];

        for (let y = chunkY * chunkSize + chunkSize - 1; y >= chunkY * chunkSize; y -= 2) {
            for (let x = chunkX * chunkSize; x < chunkX * chunkSize + chunkSize; x += 2) {
                let element = elements[[x, y]];
                elementsToUpdate.push(element)
            }
            for (let x = chunkX * chunkSize + 1; x < chunkX * chunkSize + chunkSize; x += 2) {
                let element = elements[[x, y]];
                elementsToUpdate.push(element)
            }
        }
        for (let y = chunkY * chunkSize + chunkSize; y >= chunkY * chunkSize; y -= 2) {
            for (let x = chunkX * chunkSize; x < chunkX * chunkSize + chunkSize; x += 2) {
                let element = elements[[x, y]];
                elementsToUpdate.push(element)
            }
            for (let x = chunkX * chunkSize + 1; x < chunkX * chunkSize + chunkSize; x += 2) {
                let element = elements[[x, y]];
                elementsToUpdate.push(element)
            }
        }
        elementsToUpdate = shuffle(elementsToUpdate);

        elementsToUpdate.forEach(e => {
            if (e) {
                e.update();
            }
        })


    }
}
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class Element {
    constructor(x, y, color, meltingPoint, boilingPoint) {
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
        this.health = 1;
        this.temp = 20;
        this.meltingPoint = meltingPoint;
        this.boilingPoint = boilingPoint;
    }
    async update() {
        if (this.step) { this.step(); }
        if (this.health <= 0) { this.remove() }

        this.updateTemp();

    }
    async updateTemp() {
        if (this.temp > 20) {
            this.temp -= 0.01;
        } else {
            this.temp += 0.01;
        }
        if (this.temp > this.boilingPoint && this.boil) { this.boil(); }
        if (this.temp > this.meltingPoint && this.melt) { this.melt(); }
        if (this.temp < this.meltingPoint && this.freeze) { this.freeze(); }
        if (this.temp < this.boilingPoint && this.condense) { this.condense(); }
    }
    async remove() {
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize));
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize));
        tmpX = tmpX == chunkSize ? 0 : tmpX;
        tmpY = tmpY == chunkSize ? 0 : tmpY;
        chunks[[Math.floor(this.x / chunkSize), Math.floor(this.y / chunkSize)]].context.clearRect(tmpX, tmpY, 1, 1);
        elements[[this.x, this.y]] = undefined
    }
    async transformTo(element) {
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize));
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize));
        tmpX = tmpX == chunkSize ? 0 : tmpX;
        tmpY = tmpY == chunkSize ? 0 : tmpY;
        chunks[[Math.floor(this.x / chunkSize), Math.floor(this.y / chunkSize)]].context.clearRect(tmpX, tmpY, 1, 1);
        let newElement = element;
        newElement.temp = this.temp;
        newElement.health = this.health;
        newElement.draw();
        elements[[this.x, this.y]] = newElement;

    }
    async draw() {
        if (!chunks[[Math.floor(this.x / chunkSize), Math.floor(this.y / chunkSize)]]) {
            chunks[[Math.floor(this.x / chunkSize), Math.floor(this.y / chunkSize)]] = new Chunk();
        }
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize))
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize))
        tmpX = tmpX == chunkSize ? 0 : tmpX
        tmpY = tmpY == chunkSize ? 0 : tmpY
        chunks[[Math.floor(this.x / chunkSize), Math.floor(this.y / chunkSize)]].context.fillStyle = this.color;
        chunks[[Math.floor(this.x / chunkSize), Math.floor(this.y / chunkSize)]].context.fillRect(tmpX, tmpY, 1, 1);
    }
    async moveTo(x, y) {
        let tmpX = this.x >= 0 ? this.x % chunkSize : (chunkSize + this.x % (chunkSize));
        let tmpY = this.y >= 0 ? this.y % chunkSize : (chunkSize + this.y % (chunkSize));
        tmpX = tmpX == chunkSize ? 0 : tmpX;
        tmpY = tmpY == chunkSize ? 0 : tmpY;
        chunks[[Math.floor(this.x / chunkSize), Math.floor(this.y / chunkSize)]].context.clearRect(tmpX, tmpY, 1, 1);
        elements[[this.x, this.y]] = undefined
        let oldX = this.x;
        let oldY = this.y;
        this.x = x;
        this.y = y;
        elements[[x, y]] = this;
        this.draw();
        this.activateChunks(x, y, oldX, oldY)
    }
    async switchWith(x, y) {
        let tmp = elements[[x, y]]

        tmp.x = this.x;
        tmp.y = this.y;

        this.x = x;
        this.y = y;
        elements[[x, y]] = this;

        elements[[tmp.x, tmp.y]] = tmp;

        this.draw();
        tmp.draw();
        this.activateChunks(x, y, tmp.x, tmp.y)

    }
    activateChunks(x, y, x2, y2) {
        chunks[[Math.floor(x / chunkSize), Math.floor(y / chunkSize)]].shouldStepNextFrame = true;
        if (x % chunkSize > chunkSize - 2 || x % chunkSize < -chunkSize + 2) {
            if (!chunks[[(Math.floor(x / chunkSize) - 1), Math.floor(y / chunkSize)]]) {
                chunks[[(Math.floor(x / chunkSize) - 1), Math.floor(y / chunkSize)]] = new Chunk()
            }
            chunks[[(Math.floor(x / chunkSize) - 1), Math.floor(y / chunkSize)]].shouldStepNextFrame = true;
        }
        if (y % chunkSize > chunkSize - 3 || y % chunkSize < -chunkSize + 3) {
            if (!chunks[[Math.floor(x / chunkSize), (Math.floor(y / chunkSize) + 1)]]) {
                chunks[[Math.floor(x / chunkSize), (Math.floor(y / chunkSize) + 1)]] = new Chunk()
            }
            chunks[[Math.floor(x / chunkSize), (Math.floor(y / chunkSize) + 1)]].shouldStepNextFrame = true;
        }
        if (x % chunkSize < 2 && x % chunkSize > 0 || x % chunkSize > -2 && x % chunkSize < 0) {
            if (!chunks[[(Math.floor(x / chunkSize) + 1), Math.floor(y / chunkSize)]]) {
                chunks[[(Math.floor(x / chunkSize) + 1), Math.floor(y / chunkSize)]] = new Chunk()
            }
            chunks[[(Math.floor(x / chunkSize) + 1), Math.floor(y / chunkSize)]].shouldStepNextFrame = true;
            c.fillStyle = "black"
        }
        if (y % chunkSize < 3 && y % chunkSize > 0 || y % chunkSize > -3 && y % chunkSize < 0) {
            if (!chunks[[Math.floor(x / chunkSize), (Math.floor(y / chunkSize) - 1)]]) {
                chunks[[Math.floor(x / chunkSize), (Math.floor(y / chunkSize) - 1)]] = new Chunk()
            }
            chunks[[Math.floor(x / chunkSize), (Math.floor(y / chunkSize) - 1)]].shouldStepNextFrame = true;
        }
        if (x2 && y2) {
            this.activateChunks(x2, y2)
        }
    }

}

class Solid extends Element {

}
class Background extends Element {

}

class Liquid extends Element {
    constructor(x, y, color, meltingPoint, boilingPoint, dispersionRate, stickyness) {
        super(x, y, color, meltingPoint, boilingPoint);
        this.dispersionRate = dispersionRate;
        this.stickyness = stickyness;
        this.currentStickyness = 0;
        this.flowSpeed = 1000;
    }
    async step() {
        let targetCell = getElementAtCell(this.x, this.y + 1);

        if (this.actOnOther && targetCell) {
            this.actOnOther(targetCell);
        }
        if (this.actOnOther && getElementAtCell(this.x, this.y - 1)) {
            this.actOnOther(getElementAtCell(this.x, this.y - 1));
        }
        if (this.actOnOther && getElementAtCell(this.x + 1, this.y)) {
            this.actOnOther(getElementAtCell(this.x + 1, this.y));
        }
        if (this.actOnOther && getElementAtCell(this.x - 1, this.y)) {
            this.actOnOther(getElementAtCell(this.x - 1, this.y));
        }

        if (this.stickyness) {
            this.currentStickyness = 0;
            if (targetCell instanceof Solid && targetCell) {
                this.currentStickyness = this.stickyness;
            }
            if (getElementAtCell(this.x, this.y - 1) instanceof Solid && getElementAtCell(this.x, this.y - 1)) {
                this.currentStickyness = this.stickyness;
            }
            if (getElementAtCell(this.x + 1, this.y) instanceof Solid && getElementAtCell(this.x + 1, this.y)) {
                this.currentStickyness = this.stickyness;
            }
            if (getElementAtCell(this.x - 1, this.y) instanceof Solid && getElementAtCell(this.x - 1, this.y)) {
                this.currentStickyness = this.stickyness;
            }
            if (targetCell?.currentStickyness > 0) {
                this.currentStickyness = targetCell.currentStickyness - 1;
            }
            if (getElementAtCell(this.x, this.y - 1)?.currentStickyness > 0) {
                this.currentStickyness = getElementAtCell(this.x, this.y - 1).currentStickyness - 1;
            }
            if (getElementAtCell(this.x + 1, this.y)?.currentStickyness > 0) {
                this.currentStickyness = getElementAtCell(this.x + 1, this.y).currentStickyness - 1;
            }
            if (getElementAtCell(this.x - 1, this.y)?.currentStickyness > 0) {
                this.currentStickyness = getElementAtCell(this.x - 1, this.y).currentStickyness - 1;
            }
            if (this.currentStickyness > 0) {
                return;
            }
        }

        if (targetCell == undefined) {
            this.moveTo(this.x, this.y + 1)
        }
        if (targetCell instanceof Gas) {
            this.switchWith(this.x, this.y + 1)
        }
        if (Math.random() * (this.flowSpeed + 1) > 0.9) {
            if (targetCell !== undefined) {
                this.lookHorizontally(Math.random() > 0.5 ? -1 : 1);
            }
        } else {
            this.activateChunks(this.x, this.y)
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
    constructor(x, y, color, boilingPoint, dispersionRate) {
        super(x, y, color, undefined, boilingPoint);
        this.dispersionRate = dispersionRate
    }
    async step() {
        let targetCell = getElementAtCell(this.x, this.y - 1);

        if (this.actOnOther && targetCell) {
            this.actOnOther(targetCell);
        }
        if (this.actOnOther && getElementAtCell(this.x, this.y - 1)) {
            this.actOnOther(getElementAtCell(this.x, this.y - 1));
        }
        if (this.actOnOther && getElementAtCell(this.x + 1, this.y)) {
            this.actOnOther(getElementAtCell(this.x + 1, this.y));
        }
        if (this.actOnOther && getElementAtCell(this.x - 1, this.y)) {
            this.actOnOther(getElementAtCell(this.x - 1, this.y));
        }

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

        if (this.actOnOther && targetCell) {
            this.actOnOther(targetCell);
        }
        if (this.actOnOther && getElementAtCell(this.x, this.y - 1)) {
            this.actOnOther(getElementAtCell(this.x, this.y - 1));
        }
        if (this.actOnOther && getElementAtCell(this.x + 1, this.y)) {
            this.actOnOther(getElementAtCell(this.x + 1, this.y));
        }
        if (this.actOnOther && getElementAtCell(this.x - 1, this.y)) {
            this.actOnOther(getElementAtCell(this.x - 1, this.y));
        }

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
class Stone extends ImmovableSolid {
    constructor(x, y, color) {
        super(x, y, color)
        this.extinguishingCapability = 5;
    }
}

class Sand extends MovableSolid {
    constructor(x, y) {
        super(x, y, "#c2b280", 10000)
    }
}
class Ice extends ImmovableSolid {
    constructor(x, y) {
        super(x, y, "lightblue", 0)
    }
    melt() {
        this.transformTo(new Water(this.x, this.y))
    }
}
class Water extends Liquid {
    constructor(x, y) {
        super(x, y, "blue", 0, 100, 5)
        this.extinguishingCapability = 100;
    }
    boil() {
        this.transformTo(new Steam(this.x, this.y))
    }
    freeze() {
        this.transformTo(new Ice(this.x, this.y))
    }
}
class Slime extends Liquid {
    constructor(x, y) {
        super(x, y, "green", 0, 100, 5, 10)
        this.extinguishingCapability = 1;
        this.flowSpeed = 0.0001;
    }
    boil() {
        this.transformTo(new AcidGas(this.x, this.y))
    }
}
class Steam extends Gas {
    constructor(x, y) {
        super(x, y, "lightgray", 100, 5)
    }
    condense() {
        this.transformTo(new Water(this.x, this.y))
    }
}
class Smoke extends Gas {
    constructor(x, y) {
        super(x, y, "gray", 100, 5)
        this.extinguishingCapability = 0.0010;
    }
}
class Wood extends ImmovableSolid {
    constructor(x, y) {
        super(x, y, "brown", 300)
        this.fireEase = 2;
        this.extinguishingCapability = 0.000000000001;
    }
    melt() {
        this.transformTo(new Fire(this.x, this.y))
    }
}

class Acid extends Liquid {
    constructor(x, y) {
        super(x, y, "green", 0, 100, 5)
        this.extinguishingCapability = 50;
    }
    actOnOther(targetCell) {
        if (!(targetCell instanceof Acid) && targetCell.temp < 150) {
            if (targetCell.acidResistance) {
                targetCell.health -= 0.2 * targetCell.acidResistance;
            } else {
                targetCell.health -= 0.2;
            }
            this.health -= 0.1;
            this.activateChunks(this.x, this.y, targetCell.x, targetCell.y)
        }
    }
    boil() {
        this.transformTo(new AcidGas(this.x, this.y))
    }
}
class AcidGas extends Gas {
    constructor(x, y) {
        super(x, y, "lightgreen", 100, 5)
    }
}
class Fire extends Liquid {
    constructor(x, y) {
        super(x, y, "orange", 200, 200, 2, 2)
        this.temp = 1000;
    }
    actOnOther(targetCell) {
        if (!(targetCell instanceof Fire)) {
            if (!targetCell.fireEase) { targetCell.fireEase = 1 };
            if (!this.tempLoosingFactor) { this.tempLoosingFactor = 1 };
            if (!targetCell.extinguishingCapability) { targetCell.extinguishingCapability = 1 };
            targetCell.temp += 10 * targetCell.fireEase;
            this.temp -= 10 * targetCell.extinguishingCapability * this.tempLoosingFactor;
            this.activateChunks(this.x, this.y, targetCell.x, targetCell.y)
        }
    }
    freeze() {
        if (Math.random() > 0.5) {
            this.transformTo(new Smoke(this.x, this.y))
        } else {
            this.remove();
        }
    }
}
class AntiFire extends Liquid {
    constructor(x, y) {
        super(x, y, "lightblue", -300, -50, 2, 2)
        this.temp = -200;
    }
    actOnOther(targetCell) {
        if (!(targetCell instanceof AntiFire)) {
            if (!targetCell.fireEase) { targetCell.fireEase = 1 };
            if (!this.tempLoosingFactor) { this.tempLoosingFactor = 1 };
            if (!targetCell.extinguishingCapability) { targetCell.extinguishingCapability = 1 };
            targetCell.temp -= 10 * targetCell.fireEase;
            this.temp += 10 * targetCell.extinguishingCapability * this.tempLoosingFactor;
            this.activateChunks(this.x, this.y, targetCell.x, targetCell.y)
        }
    }
    freeze() {
        if (Math.random() > 0.5) {
            this.transformTo(new Smoke(this.x, this.y))
        } else {
            this.remove();
        }
    }
}
class Lava extends Liquid {
    constructor(x, y) {
        super(x, y, "#FF3300", 800, 1200, 1, 1)
        this.temp = 1200;
        this.tempLoosingFactor = 0.1;
        this.flowSpeed = 0.0000001;
    }
    actOnOther(targetCell) {
        if (!(targetCell instanceof Lava)) {
            if (!targetCell.fireEase) { targetCell.fireEase = 1 };
            if (!this.tempLoosingFactor) { this.tempLoosingFactor = 1 };
            if (!targetCell.extinguishingCapability) { targetCell.extinguishingCapability = 1 };
            targetCell.temp += 10 * targetCell.fireEase;
            this.temp -= 10 * targetCell.extinguishingCapability * this.tempLoosingFactor;
            this.activateChunks(this.x, this.y, targetCell.x, targetCell.y)
        }
    }
    freeze() {
        this.transformTo(new Stone(this.x, this.y))
    }
}
class Ketchup extends Liquid {
    constructor(x, y) {
        super(x, y, "red", 0, 100, 1, 5)
        this.flowSpeed = 0.0000001;
    }
    boil() {
        this.transformTo(new Steam(this.x, this.y))
    }
}

function getElementAtCell(x, y) {
    return elements[[x, y]]
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
            if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2))]]) {
                if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2))]] instanceof Solid)) {
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
                if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2) - 1)]]) {
                    if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 + this.h / 2) - 1)]] instanceof Solid)) {
                        this.y++;
                    }
                }
            }
        }
        let tmp2 = false;
        for (let i = 0; i < this.w; i++) {

            if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2 - 1))]]) {
                if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2 - 1))]] instanceof Solid)) {
                    tmp2 = true;
                }
            }
        }
        if (tmp2) {
            if (this.directionY == 1) {
                this.vy = -this.gravityV;
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2))]]) {
                    if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2) + i)), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2))]] instanceof Solid)) {
                        this.y--;
                    }
                }
            }
        }
        let tmp3 = false;
        for (let i = 0; i < this.h; i++) {
            if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2 - 1))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]]) {
                if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2 - 1))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]] instanceof Solid)) {
                    tmp3 = true;
                }
            }
        }
        if (tmp3) {
            if (this.directionX == 1) {
                this.vx = 0
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]]) {
                    if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 - this.w / 2))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]] instanceof Solid)) {
                        this.x--;
                    }
                }
            }
        }
        let tmp4 = false;
        for (let i = 0; i < this.h; i++) {
            if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]]) {
                if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]] instanceof Solid)) {
                    tmp4 = true;
                }
            }
        }
        if (tmp4) {
            if (this.directionX == -1) {
                this.vx = 0
            }
            for (let i = 0; i < this.w; i++) {
                if (elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2 - 1))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]]) {
                    if ((elements[[(Math.floor(-Math.floor(this.x) + Math.floor(canvas.width / 2 + this.w / 2 - 1))), (-Math.floor(this.y) + Math.floor(canvas.height / 2 - this.h / 2) + i)]] instanceof Solid)) {
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

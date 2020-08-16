import * as p5 from "p5";
import { World, Body, Circle, Vector2Like } from "./VerletSim";

function createBodyFromPositions(positions: Vector2Like[]): Body {
    const body = new Body();

    const pos0 = positions[0];
    let pt1 = body.addPoint(pos0, { x: 0, y: 0 });

    for (let i = 1; i < positions.length; i++) {
        const pos = positions[i];
        const pt2 = body.addPoint(pos, { x: 0, y: 0 });
        body.addLine(pt1, pt2);
        pt1 = pt2;
    }

    return body;
}

function createBodyA(): Body {
    const positions = [
        { x:  50, y:  40 },
        { x:  70, y:  50 },
        { x:  70, y:  60 },
        { x:  70, y: 70 },
        { x:  80, y: 70 },
        { x:  90, y: 70 },
        { x: 100, y: 70 },
        { x: 120, y: 90 },
        { x: 130, y: 70 },
        { x: 140, y: 90 },
        { x: 150, y: 70 },
        { x: 160, y: 70 },
        { x: 170, y: 70 },
        { x: 180, y: 70 },
        { x: 190, y: 70 },
        { x: 200, y: 70 },
        { x: 210, y: 70 },
        { x: 220, y: 70 },
        { x: 230, y: 70 },
        { x: 240, y: 70 },
        { x: 250, y: 70 },
        { x: 260, y: 70 },
        { x: 270, y: 70 }
    ];

    return createBodyFromPositions(positions);
}

function createBodyB(): Body {
    const positions: Vector2Like[] = [];

    for (let x = 300; x <= 600; x += 25) {
        positions.push({ x, y: 50 });
    }

    return createBodyFromPositions(positions);
}

function createPresetWorld(world: World): World {
    world.bodies.push(createBodyA());
    world.bodies.push(createBodyB());

    const circles: Circle[] = [
        { position: { x: 120, y: 200 }, radius: 40 },
        { position: { x: 140, y: 300 }, radius: 40 },
        { position: { x: 220, y: 250 }, radius: 40 },
        { position: { x: 180, y: 390 }, radius: 25 },
        { position: { x: 220, y: 410 }, radius: 25 },
        { position: { x: 260, y: 390 }, radius: 25 },

        { position: { x: 350, y: 300 }, radius: 25 },
        { position: { x: 400, y: 300 }, radius: 25 },
        { position: { x: 450, y: 300 }, radius: 25 },
        { position: { x: 500, y: 300 }, radius: 25 },
        { position: { x: 550, y: 300 }, radius: 25 }
    ];

    circles.forEach(circle => world.circles.push(circle));

    return world;
}


function drawWorld(world: World, p: p5): void {
    const colors = ["#FF22FF", "#0022FF"];

    p.push();

    // Ground.
    p.strokeWeight(4);
    p.line(0, world.bottom, p.windowWidth, world.bottom);

    // Circles.
    p.strokeWeight(3);
    p.stroke("#FF0000");
    world.circles.forEach(circle => {
        p.circle(circle.position.x, circle.position.y, circle.radius * 2);
    });

    // Bodies.
    world.bodies.forEach(body => {
        body.lines.forEach((line, idx) => {
            p.push();

            p.stroke(colors[idx % colors.length]);

            p.line(
                line.p1.position.x, line.p1.position.y,
                line.p2.position.x, line.p2.position.y
            );

            p.pop();
        });
    });

    p.pop();
}

const sketch = (p: p5) => {
    let world: World;
    let paused = false;
    let editMode: "rope" | "circle" = "rope";
    let circleRadius = 25;

    const canvasWidth = 640;
    const canvasHeight = 480;

    const insideCanvas = (): boolean => {
        return (
            0 <= p.mouseX && p.mouseX <= canvasWidth &&
            0 <= p.mouseY && p.mouseY <= canvasHeight
        );
    }

    const setupUI = () => {
        p.createDiv();

        p.createButton("Reset").mouseClicked(() => {
            world = new World();
            world.bottom = canvasHeight * 0.95;
        });

        p.createButton("Preset").mouseClicked(() => {
            createPresetWorld(world);
        });

        const pauseCheckBox = p.createCheckbox("Pause", paused) as any;
        pauseCheckBox.changed(() => {
            paused = pauseCheckBox.checked();
        });

        p.createP("Add:");

        const radio = p.createRadio("Edit") as any;
        radio.option("rope");
        radio.option("circle");
        radio.selected(editMode);
        radio.mouseClicked(() => editMode = radio.value());

        p.createP("Circle Radius:");

        const slider = p.createSlider(5, 100, circleRadius) as any;
        slider.changed(() => circleRadius = slider.value());

        let body: Body = null;
        p.mouseReleased = () => {
            if (body) {
                body.static = false;
                body = null;
            }
        }
        p.mousePressed = () => {
            if (!insideCanvas()) {
                return;
            }
            if (editMode === "rope") {
                body = new Body();
                body.static = true;
            } else if (editMode === "circle") {
                world.circles.push({
                    position: { x: p.mouseX, y: p.mouseY },
                    radius: circleRadius
                });
            }
        };
        p.mouseDragged = () => {
            if (!body) {
                return;
            }

            const lastPoint = body.points[body.points.length - 1];

            if (lastPoint && lastPoint.position.x === p.mouseX && lastPoint.position.y === p.mouseY) {
                return;
            }

            const point = body.addPoint(
                { x: p.mouseX, y: p.mouseY },
                { x: 0, y: 0 }
            );

            if (body.points.length === 2) {
                world.bodies.push(body);
            }

            if (lastPoint) {
                body.addLine(lastPoint, point);
            }
        };
    }

    p.setup = () => {
        p.createCanvas(canvasWidth, canvasHeight);
        p.noFill().frameRate(30);

        world = new World();
        world.bottom = canvasHeight * 0.95;

        setupUI();
    }

    p.draw = () => {
        if (!paused) {
            world.update();
        }

        p.background(240);

        drawWorld(world, p);
    }
};

new p5(sketch);

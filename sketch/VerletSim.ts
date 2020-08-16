export interface Vector2Like {
    x: number;
    y: number;
}

export interface Point {
    position: Vector2Like;
    prevPosition: Vector2Like;
}

export interface Line {
    p1: Point;
    p2: Point;
    len: number;
}

export class Body {
    stiffness: number;
    bounce: number;
    friction: number;
    static: boolean;
    points: Point[];
    lines: Line[];

    constructor() {
        this.stiffness = 10;
        this.bounce = 0.25;
        this.friction = 0.1;
        this.static = false;
        this.points = [];
        this.lines = [];
    }

    addPoint(x: Vector2Like, v: Vector2Like): Point {
        const point = {
            position: { x: x.x, y: x.y },
            prevPosition: { x: x.x - v.x, y: x.y - v.y }
        };

        this.points.push(point);

        return point;
    }

    addLine(p1: Point, p2: Point): void {
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        this.lines.push({
            p1, p2, len: Math.sqrt(dx * dx + dy * dy)
        });
    }

    addLines(p1: Point, p2: Point, ...ps: Point[]): void {
        const points = [p1, p2, ...ps];
        for (let i = 0; i < points.length - 1; i++) {
            this.addLine(points[i], points[i + 1]);
        }
    }
}

export interface Circle {
    position: Vector2Like;
    radius: number;
}

export class World {
    gravity: Vector2Like;
    bottom: number;
    circles: Circle[];
    bodies: Body[];

    constructor() {
        this.gravity = { x: 0, y: 0.5 };
        this.bottom = 0;
        this.bodies = [];
        this.circles = [];
    }

    update(): void {
        this.updatePoints();
        this.resolveConstraints();
    }

    updatePoints(): void {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (body.static) {
                continue;
            }
            for (let j = 0; j < body.points.length; j++) {
                const point = body.points[j];
                const vx = point.position.x - point.prevPosition.x + this.gravity.x;
                const vy = point.position.y - point.prevPosition.y + this.gravity.y;
                point.prevPosition.x = point.position.x;
                point.prevPosition.y = point.position.y;
                point.position.x += vx;
                point.position.y += vy;
            }
        }
    }

    resolveConstraints(): void {
        this.resolveLineConstraints();
        this.resolveGroundConstraints();
        this.resolveCircleConstraints();
    }

    private resolveLineConstraints(): void {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (body.static) {
                continue;
            }
            for (let s = 0; s < body.stiffness; s++) {
                for (let j = 0; j < body.lines.length; j++) {
                    const line = body.lines[j];
                    this.constrainLine(line);
                }
            }
        }
    }

    private resolveGroundConstraints(): void {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (body.static) {
                continue;
            }
            for (let j = 0; j < body.points.length; j++) {
                const point = body.points[j];
                if (point.position.y > this.bottom) {
                    const vx = point.position.x - point.prevPosition.x;
                    const vy = point.position.y - point.prevPosition.y;
                    this.applyBounceAndFriction(
                        point,
                        { x: point.position.x, y: this.bottom },
                        { x: 0, y: -1 },
                        body.bounce,
                        body.friction
                    );
                }
            }
        }
    }

    private resolveCircleConstraints(): void {
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (body.static) {
                continue;
            }
            for (let j = 0; j < body.points.length; j++) {
                const point = body.points[j];
                for (let k = 0; k < this.circles.length; k++) {
                    const circle = this.circles[k];

                    const dx = point.position.x - circle.position.x;
                    const dy = point.position.y - circle.position.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    if (len > circle.radius) {
                        continue;
                    }

                    const nx = dx / len;
                    const ny = dy / len;

                    this.applyBounceAndFriction(
                        point,
                        {
                            x: nx * circle.radius + circle.position.x,
                            y: ny * circle.radius + circle.position.y
                        },
                        { x: nx, y: ny },
                        1,
                        0
                    );
                }
            }
        }
    }

    private constrainLine(line: Line): void {
        const dx = line.p2.position.x - line.p1.position.x;
        const dy = line.p2.position.y - line.p1.position.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const diff = line.len - len;
        const ox = dx / len * diff;
        const oy = dy / len * diff;
        line.p1.position.x -= ox / 2;
        line.p1.position.y -= oy / 2;
        line.p2.position.x += ox / 2;
        line.p2.position.y += oy / 2;
    }

    private applyBounceAndFriction(
        point: Point,
        constrainedPosition: Vector2Like,
        normal: Vector2Like,
        bounce: number,
        friction: number
    ): void {
        const tx = -normal.y;
        const ty = normal.x;

        const vx = point.position.x - point.prevPosition.x;
        const vy = point.position.y - point.prevPosition.y;

        const vn = normal.x * vx + normal.y * vy;
        const vt = tx * vx + ty * vy;

        point.position.x = constrainedPosition.x;
        point.position.y = constrainedPosition.y;

        point.prevPosition.x = point.position.x;
        point.prevPosition.y = point.position.y;

        point.prevPosition.x += vn * normal.x * bounce;
        point.prevPosition.y += vn * normal.y * bounce;
        point.prevPosition.x -= (vt * tx) * (1 - friction);
        point.prevPosition.y -= (vt * ty) * (1 - friction);
    }
}
